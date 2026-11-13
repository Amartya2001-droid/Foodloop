import type { Express, Response } from 'express';
import { z } from 'zod';
import { storage } from './storage';
import { requireUser, userId } from './auth';
import { insertOrganizationSchema } from '@shared/schema';
export async function supplierSummaries(organizationId?: string) {
  const all = await storage.getAllFoodListings();
  const listings = organizationId ? all.filter(item => item.organizationId === organizationId) : all;
  const claims = await storage.getAllClaims();
  return Promise.all([...new Set(listings.map(item => item.donorId))].map(async id => {
    const items = listings.filter(item => item.donorId === id);
    const completed = claims.filter(claim => claim.status === 'completed' && items.some(item => item.id === claim.listingId));
    return { supplierId: id, supplierName: (await storage.getUser(id))?.username ?? 'Unknown', totalListings: items.length, activeListings: items.filter(item => item.status === 'available' && (!item.expiryDate || item.expiryDate > new Date())).length, completedPickups: completed.length, source: 'recorded_activity' };
  }));
}
const fail = (res: Response, error: unknown) => res.status(error instanceof z.ZodError ? 400 : 500).json({ error: error instanceof z.ZodError ? 'Invalid details' : 'Data service unavailable' });
export function installDataRoutes(app: Express) {
  app.get('/api/impact', async (_req, res) => {
    try {
      const listings = await storage.getAllFoodListings();
      const claims = await storage.getAllClaims();
      const completed = claims.filter(claim => claim.status === 'completed');
      const weights = completed.map(claim => listings.find(item => item.id === claim.listingId)?.weightKg).filter((weight): weight is number => weight != null);
      const days = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(); date.setUTCDate(date.getUTCDate() - 6 + index); const day = date.toISOString().slice(0, 10);
        return { day, completedPickups: completed.filter(claim => claim.completedAt?.toISOString().startsWith(day)).length };
      });
      res.json({ completedPickups: completed.length, activeReservations: claims.filter(claim => claim.status === 'reserved').length, donorCount: new Set(completed.map(claim => listings.find(item => item.id === claim.listingId)?.donorId).filter(Boolean)).size, reportedWeightKg: Math.round(weights.reduce((a, b) => a + b, 0) * 1000) / 1000, pickupsWithReportedWeight: weights.length, days, source: 'donor_confirmed_pickups', weightSource: 'donor_reported_listing_weight', mealsProvided: null, co2Prevented: null });
    } catch (error) { fail(res, error); }
  });
  app.get('/api/suppliers', async (_req, res) => {
    try { res.json(await supplierSummaries()); } catch (error) { fail(res, error); }
  });
  app.post('/api/organizations', requireUser, async (req, res) => {
    try {
      const validated = insertOrganizationSchema.extend({ name: z.string().trim().min(1).max(150), type: z.enum(['food_bank', 'community_fridge', 'ngo', 'other']), description: z.string().trim().min(1).max(2000), location: z.string().trim().min(1).max(300), latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), contactEmail: z.string().email().max(200), contactPhone: z.string().max(100), website: z.string().url().max(500).nullable().optional() }).parse({ ...req.body, ownerId: userId(res), verified: false });
      res.status(201).json(await storage.createOrganization(validated));
    } catch (error) { fail(res, error); }
  });
  app.post('/api/food-listings/:id/quality', requireUser, async (req, res) => {
    try {
      const listing = await storage.getFoodListing(req.params.id);
      if (!listing) return res.status(404).json({ error: 'Listing not found' });
      if (listing.donorId !== userId(res)) return res.status(403).json({ error: 'Only the donor may report quality' });
      const body = z.object({ notes: z.string().trim().min(1).max(2000), defects: z.array(z.string().trim().min(1).max(200)).max(20).default([]) }).parse(req.body);
      const analysis = { source: 'donor_observation', observedAt: new Date().toISOString(), notes: body.notes, defects: body.defects, disclaimer: 'Self-reported observation, not food safety certification' };
      res.json(await storage.updateFoodListing(listing.id, { aiAnalysis: analysis, defectsDetected: body.defects }));
    } catch (error) { fail(res, error); }
  });
}
