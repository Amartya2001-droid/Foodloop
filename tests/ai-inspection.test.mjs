import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { server, client, register, listingForm } from './helpers.mjs';
test('AI inspection validates a stubbed provider response and persists provenance', async () => {
  let valid = true, calls = 0;
  const token = randomBytes(24).toString('hex');
  const provider = createServer(async (req, res) => {
    assert.equal(req.headers.authorization, `Bearer ${token}`);
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks));
    assert.equal(body.model, 'gpt-4o-mini'); assert.match(body.messages[0].content[1].image_url.url, /^data:image\/png;base64,/); calls++;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ choices: [{ message: { content: JSON.stringify(valid ? { title: 'Bread', description: 'Visible loaf; safety cannot be inferred.', category: 'bakery', quantity: '1 loaf', defectsDetected: [] } : { freshnessScore: 99 }) } }] }));
  });
  await new Promise(resolve => provider.listen(5130, '127.0.0.1', resolve));
  const app = await server(5129, { OPENAI_API_KEY: token, OPENAI_BASE_URL: 'http://127.0.0.1:5130/v1' });
  try {
    const donor = client(app.base); await register(donor, 'ai-owner');
    const listing = await (await donor('/api/food-listings', 'POST', listingForm())).json();
    const image = () => { const form = new FormData(); form.set('image', new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aV1sAAAAASUVORK5CYII=', 'base64')], { type: 'image/png' }), 'food.png'); return form; };
    const analyzed = await donor(`/api/food-listings/${listing.id}/inspect`, 'POST', image());
    assert.equal(analyzed.status, 200); const stored = (await analyzed.json()).aiAnalysis;
    assert.equal(stored.source, 'openai'); assert.equal(stored.model, 'gpt-4o-mini'); assert.ok(stored.observedAt); assert.match(stored.disclaimer, /not food safety/);
    valid = false;
    assert.equal((await donor(`/api/food-listings/${listing.id}/inspect`, 'POST', image())).status, 502);
    assert.deepEqual((await (await donor(`/api/food-listings/${listing.id}`)).json()).aiAnalysis, stored);
    assert.equal(calls, 2);
  } finally { await app.close(); await new Promise(resolve => provider.close(resolve)); }
});
