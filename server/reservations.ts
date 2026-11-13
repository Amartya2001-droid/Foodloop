import { randomUUID } from 'node:crypto';
import type { Claim, FoodListing } from '@shared/schema';
export class WorkflowError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export type ReserveInput = { listingId: string; claimerId: string; claimerName: string; claimerContact: string; pickupAt: Date; pickupNotes: string };
export type Action = 'cancel' | 'picked_up' | 'complete' | 'expire';
export function reserve(listing: FoodListing | undefined, input: ReserveInput, now = new Date()): Claim {
  if (!listing) throw new WorkflowError(404, 'Listing not found');
  if (listing.donorId === input.claimerId) throw new WorkflowError(400, 'You cannot reserve your own listing');
  if (listing.status !== 'available') throw new WorkflowError(409, 'Listing is no longer available');
  if (input.pickupAt <= now || (listing.expiryDate && input.pickupAt >= listing.expiryDate) || (listing.pickupTimeStart && input.pickupAt < listing.pickupTimeStart) || (listing.pickupTimeEnd && input.pickupAt > listing.pickupTimeEnd)) throw new WorkflowError(400, 'Choose a future pickup within the listing window and before expiry');
  const expiresAt = new Date(Math.min(input.pickupAt.getTime() + 2 * 3600000, listing.expiryDate?.getTime() ?? Infinity));
  return { ...input, id: randomUUID(), claimedAt: now, expiresAt, completedAt: null, status: 'reserved' };
}
export function transition(listing: FoodListing, claim: Claim, actor: string, action: Action, now = new Date()) {
  const donor = actor === listing.donorId, recipient = actor === claim.claimerId;
  if (action !== 'expire' && !donor && !recipient) throw new WorkflowError(403, 'Only the donor or recipient can access this reservation');
  const expired = claim.status === 'reserved' && !!claim.expiresAt && claim.expiresAt <= now;
  if (action === 'expire') {
    if (!expired) throw new WorkflowError(409, 'Reservation is not due to expire');
    return { claim: { ...claim, status: 'expired' }, listingStatus: listing.expiryDate && listing.expiryDate <= now ? 'expired' : 'available' };
  }
  if (expired) throw new WorkflowError(409, 'Reservation has expired');
  if (action === 'cancel' && ['reserved'].includes(claim.status)) return { claim: { ...claim, status: 'cancelled' }, listingStatus: listing.expiryDate && listing.expiryDate <= now ? 'expired' : 'available' };
  if (action === 'picked_up' && recipient && claim.status === 'reserved') return { claim: { ...claim, status: 'picked_up' }, listingStatus: 'picked_up' };
  if (action === 'complete' && donor && claim.status === 'picked_up') return { claim: { ...claim, status: 'completed', completedAt: now }, listingStatus: 'completed' };
  throw new WorkflowError(409, 'Invalid reservation transition or actor');
}
