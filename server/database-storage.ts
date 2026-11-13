import { reserve, transition, WorkflowError, type ReserveInput, type Action } from "./reservations";
import { type User, type InsertUser, type FoodListing, type InsertFoodListing, type SensorData, type InsertSensorData, type Claim, type InsertClaim, type Organization, type InsertOrganization, type SupplierRating, type InsertSupplierRating, users, foodListings, sensorData, claims, organizations, supplierRatings } from "@shared/schema";
import type { IStorage } from "./storage";
import { db } from "./db";
import { eq, or, inArray, and, isNull, gt } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getFoodListing(id: string): Promise<FoodListing | undefined> {
    const result = await db.select().from(foodListings).where(eq(foodListings.id, id)).limit(1);
    return result[0];
  }

  async getAllFoodListings(): Promise<FoodListing[]> {
    return await db.select().from(foodListings);
  }

  async getAvailableFoodListings(): Promise<FoodListing[]> {
    return await db.select().from(foodListings).where(and(eq(foodListings.status, "available"), or(isNull(foodListings.expiryDate), gt(foodListings.expiryDate, new Date()))));
  }

  async createFoodListing(insertListing: InsertFoodListing): Promise<FoodListing> {
    const result = await db.insert(foodListings).values(insertListing).returning();
    return result[0];
  }

  async updateFoodListing(id: string, updates: Partial<FoodListing>): Promise<FoodListing | undefined> {
    const result = await db.update(foodListings)
      .set(updates)
      .where(eq(foodListings.id, id))
      .returning();
    return result[0];
  }

  async deleteFoodListing(id: string): Promise<boolean> {
    return db.transaction(async tx => {
      const listing = (await tx.select().from(foodListings).where(eq(foodListings.id, id)).for('update'))[0];
      if (!listing) return false;
      const history = await tx.select().from(claims).where(eq(claims.listingId, id)).limit(1);
      if (listing.status !== 'available' || history.length) throw new WorkflowError(409, 'Listings with reservation history cannot be deleted');
      await tx.delete(foodListings).where(eq(foodListings.id, id));
      return true;
    });
  }

  async getSensorDataForListing(listingId: string): Promise<SensorData[]> {
    return await db.select().from(sensorData)
      .where(eq(sensorData.listingId, listingId))
      .orderBy(sensorData.timestamp);
  }

  async createSensorData(insertData: InsertSensorData): Promise<SensorData> {
    const result = await db.insert(sensorData).values(insertData).returning();
    return result[0];
  }

  async getClaimsForListing(listingId: string): Promise<Claim[]> {
    return await db.select().from(claims).where(eq(claims.listingId, listingId));
  }

  async createClaim(insertClaim: InsertClaim): Promise<Claim> {
    const result = await db.insert(claims).values(insertClaim).returning();
    return result[0];
  }

  async getReservation(id: string) {
    return (await db.select().from(claims).where(eq(claims.id, id)))[0];
  }
  async getReservationsForUser(userId: string) {
    const owned = db.select({ id: foodListings.id }).from(foodListings).where(eq(foodListings.donorId, userId));
    return db.select().from(claims).where(or(eq(claims.claimerId, userId), inArray(claims.listingId, owned)));
  }
  async reserveListing(input: ReserveInput) {
    return db.transaction(async tx => {
      const listing = (await tx.select().from(foodListings).where(eq(foodListings.id, input.listingId)).for('update'))[0];
      const claim = reserve(listing, input);
      await tx.update(foodListings).set({ status: 'reserved' }).where(eq(foodListings.id, input.listingId));
      return (await tx.insert(claims).values(claim).returning())[0];
    });
  }
  async transitionReservation(id: string, actor: string, action: Action, now = new Date()) {
    const initial = await this.getReservation(id);
    if (!initial) throw new WorkflowError(404, 'Reservation not found');
    return db.transaction(async tx => {
      // Always lock listing first, including expiry, to serialize lifecycle actions.
      const listing = (await tx.select().from(foodListings).where(eq(foodListings.id, initial.listingId)).for('update'))[0];
      const claim = (await tx.select().from(claims).where(eq(claims.id, id)).for('update'))[0];
      const result = transition(listing, claim, actor, action, now);
      await tx.update(foodListings).set({ status: result.listingStatus }).where(eq(foodListings.id, listing.id));
      return (await tx.update(claims).set({ status: result.claim.status, completedAt: result.claim.completedAt }).where(eq(claims.id, id)).returning())[0];
    });
  }
  async expireReservations(now = new Date()) {
    const pending = await db.select().from(claims).where(eq(claims.status, 'reserved'));
    for (const claim of pending) if (claim.expiresAt && claim.expiresAt <= now) {
      try { await this.transitionReservation(claim.id, '', 'expire', now); }
      catch (error) { if (!(error instanceof WorkflowError && error.status === 409)) throw error; }
    }
  }

  async getAllOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations);
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    const result = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
    return result[0];
  }

  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    const result = await db.insert(organizations).values(insertOrg).returning();
    return result[0];
  }

  async getRatingsForOrganization(organizationId: string): Promise<SupplierRating[]> {
    return await db.select().from(supplierRatings).where(eq(supplierRatings.organizationId, organizationId));
  }

  async getRatingsForSupplier(supplierId: string): Promise<SupplierRating[]> {
    return await db.select().from(supplierRatings).where(eq(supplierRatings.supplierId, supplierId));
  }

  async createSupplierRating(insertRating: InsertSupplierRating): Promise<SupplierRating> {
    const result = await db.insert(supplierRatings).values(insertRating).returning();
    return result[0];
  }

  async getListingsByDonor(donorId: string): Promise<FoodListing[]> {
    return await db.select().from(foodListings).where(eq(foodListings.donorId, donorId));
  }
}

