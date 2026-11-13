import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { server, client, register, listingForm } from './helpers.mjs';
test('accounts, cookie sessions, logout and donor authorization', async () => {
  const app = await server(5126);
  try {
    const donor = client(app.base), other = client(app.base), anonymous = client(app.base);
    assert.equal((await anonymous('/api/food-listings', 'POST', listingForm())).status, 401);
    assert.equal((await donor('/api/auth/register', 'POST', { username: 'short', password: 'short' })).status, 400);
    const owner = await register(donor, 'donor');
    assert.deepEqual(Object.keys(owner).sort(), ['id', 'username']);
    await register(other, 'other');
    assert.equal((await other('/api/auth/register', 'POST', { username: 'DONOR', password: 'local-test-password-only' })).status, 409);
    assert.equal((await anonymous('/api/auth/login', 'POST', { username: 'donor', password: 'incorrect-password' })).status, 401);
    const created = await donor('/api/food-listings', 'POST', listingForm({ donorId: 'spoofed' }));
    assert.equal(created.status, 201); const listing = await created.json();
    assert.equal(listing.donorId, owner.id);
    assert.equal(listing.pickupTimeStart, null);
    assert.equal((await other(`/api/food-listings/${listing.id}`, 'DELETE')).status, 403);
    assert.equal((await other(`/api/food-listings/${listing.id}`, 'PATCH', { status: 'claimed' })).status, 403);
    assert.equal((await other('/api/sensor-data', 'POST', { listingId: listing.id, temperature: 4, humidity: 50 })).status, 403);
    assert.equal((await other('/api/my-listings')).status, 200);
    assert.deepEqual(await (await other('/api/my-listings')).json(), []);
    assert.equal((await (await donor('/api/my-listings')).json()).length, 1);
    assert.equal((await donor(`/api/food-listings/${listing.id}`, 'DELETE', undefined, { Origin: 'https://evil.invalid' })).status, 403);
    assert.equal((await donor('/api/auth/logout', 'POST')).status, 204);
    assert.equal((await donor('/api/my-listings')).status, 401);
    const login = await donor('/api/auth/login', 'POST', { username: 'donor', password: 'local-test-password-only' });
    assert.equal(login.status, 200); assert.match(login.headers.get('set-cookie'), /HttpOnly/); assert.match(login.headers.get('set-cookie'), /SameSite=Strict/);
    assert.equal((await donor(`/api/food-listings/${listing.id}`, 'DELETE')).status, 204);
    assert.equal((await anonymous('/api/auth/me', 'GET', undefined, { Cookie: `foodloop_session=${randomBytes(32).toString('hex')}` })).status, 200);
    assert.equal((await (await anonymous('/api/auth/me')).json()).user, null);
  } finally { await app.close(); }
});
