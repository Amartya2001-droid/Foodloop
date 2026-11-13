import { test } from 'node:test';
import assert from 'node:assert/strict';
process.env.STORAGE_MODE = 'memory';
const { MemStorage } = await import('../server/storage.ts');
test('expired reservations release food atomically and retain history', async () => {
  const store = new MemStorage();
  const item = await store.createFoodListing({ title: 'Bread', description: 'Wheat', quantity: '1 loaf', category: 'bakery', location: 'Door', latitude: 0, longitude: 0, donorId: 'donor', freshnessScore: 0, qualityScore: 0 });
  const pickupAt = new Date(Date.now() + 60000);
  const claim = await store.reserveListing({ listingId: item.id, claimerId: 'recipient', claimerName: 'recipient', claimerContact: 'test@example.invalid', pickupAt, pickupNotes: '' });
  await store.expireReservations(new Date(pickupAt.getTime() + 2 * 3600000 + 1));
  assert.equal((await store.getReservation(claim.id)).status, 'expired');
  assert.equal((await store.getFoodListing(item.id)).status, 'available');
  await assert.rejects(store.transitionReservation(claim.id, 'recipient', 'picked_up'), /Invalid/);
  await assert.rejects(store.deleteFoodListing(item.id), /history/);
  const second = await store.reserveListing({ listingId: item.id, claimerId: 'recipient2', claimerName: 'recipient2', claimerContact: 'test@example.invalid', pickupAt: new Date(Date.now() + 60000), pickupNotes: '' });
  assert.notEqual(second.id, claim.id);
});
