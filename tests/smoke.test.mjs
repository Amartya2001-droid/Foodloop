import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

for (const mode of ['production', 'development']) {
  test(`${mode}: app, listing lifecycle, and unavailable AI without credentials`, async () => {
    const port = mode === 'production' ? 5123 : 5124;
    const child = spawn(process.execPath, mode === 'production' ? ['dist/index.js'] : ['--import', 'tsx', 'server/index.ts'], {
      env: { ...process.env, NODE_ENV: mode, STORAGE_MODE: 'memory', DATABASE_URL: '', OPENAI_API_KEY: '', PORT: String(port) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', d => output += d);
    child.stderr.on('data', d => output += d);
    const base = `http://127.0.0.1:${port}`;
    try {
      let ready = false;
      for (let i = 0; i < 150; i++) {
        if (child.exitCode !== null) throw new Error(output);
        try { if ((await fetch(`${base}/api/food-listings`)).ok) { ready = true; break; } } catch {}
        await delay(100);
      }
      assert.ok(ready, output);
      const page = await fetch(base);
      assert.equal(page.status, 200);
      assert.match(await page.text(), /src\/main|\/assets\/index/);
      assert.deepEqual(await (await fetch(`${base}/api/food-listings`)).json(), []);
      assert.deepEqual(await (await fetch(`${base}/api/organizations`)).json(), []);
      assert.equal((await fetch(`${base}/api/organizations/missing`)).status, 404);
      assert.equal((await fetch(`${base}/api/my-listings`)).status, 404);
      assert.equal((await fetch(`${base}/api/food-listings/missing`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 404);
      assert.equal((await fetch(`${base}/api/food-listings/missing`, { method: 'DELETE' })).status, 404);
      assert.equal((await fetch(`${base}/api/food-listings`, { method: 'POST', body: new FormData() })).status, 400);
      const form = new FormData();
      for (const [k, v] of Object.entries({ title: 'Smoke test', description: 'Local test only', quantity: '1 item', category: 'other', location: 'Test location', latitude: '44.65', longitude: '-63.58', donorId: 'smoke-test', pickupTimeStart: '2026-11-11T12:00:00Z', pickupTimeEnd: '2026-11-11T13:00:00Z' })) form.set(k, v);
      const created = await fetch(`${base}/api/food-listings`, { method: 'POST', body: form });
      assert.equal(created.status, 201);
      const listing = await created.json();
      assert.equal(listing.title, 'Smoke test');
      assert.equal((await fetch(`${base}/api/food-listings/${listing.id}`)).status, 200);
      assert.equal((await (await fetch(`${base}/api/food-listings`)).json()).length, 1);
      assert.deepEqual(await (await fetch(`${base}/api/sensor-data/${listing.id}`)).json(), []);
      const reading = await fetch(`${base}/api/sensor-data`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listingId: listing.id, temperature: 4, humidity: 60 }) });
      assert.equal(reading.status, 201);
      const sensors = await (await fetch(`${base}/api/sensor-data/${listing.id}`)).json();
      assert.equal(sensors.length, 1);
      assert.equal(sensors[0].temperature, 4);
      assert.equal((await fetch(`${base}/api/sensor-data`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 400);

      const claimed = await fetch(`${base}/api/food-listings/${listing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'claimed' }) });
      assert.equal(claimed.status, 200);
      assert.equal((await claimed.json()).status, 'claimed');
      assert.deepEqual(await (await fetch(`${base}/api/food-listings`)).json(), []);
      assert.equal((await fetch(`${base}/api/food-listings/${listing.id}`, { method: 'DELETE' })).status, 204);
      assert.equal((await fetch(`${base}/api/food-listings/${listing.id}`)).status, 404);
      assert.equal((await fetch(`${base}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }) })).status, 503);
    } finally {
      child.kill('SIGTERM');
      await new Promise(resolve => child.exitCode !== null ? resolve() : child.once('exit', resolve));
    }
  });
}
