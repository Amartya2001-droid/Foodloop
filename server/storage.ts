import { type User, type InsertUser, type FoodListing, type InsertFoodListing, type SensorData, type InsertSensorData, type Claim, type InsertClaim, type Organization, type InsertOrganization, type SupplierRating, type InsertSupplierRating, users, foodListings, sensorData, claims, organizations, supplierRatings } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Food Listings
  getFoodListing(id: string): Promise<FoodListing | undefined>;
  getAllFoodListings(): Promise<FoodListing[]>;
  getAvailableFoodListings(): Promise<FoodListing[]>;
  createFoodListing(listing: InsertFoodListing): Promise<FoodListing>;
  updateFoodListing(id: string, listing: Partial<FoodListing>): Promise<FoodListing | undefined>;
  deleteFoodListing(id: string): Promise<boolean>;
  
  // Sensor Data
  getSensorDataForListing(listingId: string): Promise<SensorData[]>;
  createSensorData(data: InsertSensorData): Promise<SensorData>;
  
  // Claims
  getClaimsForListing(listingId: string): Promise<Claim[]>;
  createClaim(claim: InsertClaim): Promise<Claim>;
  
  // Organizations
  getAllOrganizations(): Promise<Organization[]>;
  getOrganization(id: string): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  
  // Supplier Ratings
  getRatingsForOrganization(organizationId: string): Promise<SupplierRating[]>;
  getRatingsForSupplier(supplierId: string): Promise<SupplierRating[]>;
  createSupplierRating(rating: InsertSupplierRating): Promise<SupplierRating>;
  getListingsByDonor(donorId: string): Promise<FoodListing[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private foodListings: Map<string, FoodListing>;
  private sensorData: Map<string, SensorData>;
  private claims: Map<string, Claim>;
  private organizations: Map<string, Organization>;
  private supplierRatings: Map<string, SupplierRating>;

  constructor() {
    this.users = new Map();
    this.foodListings = new Map();
    this.sensorData = new Map();
    this.claims = new Map();
    this.organizations = new Map();
    this.supplierRatings = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getFoodListing(id: string): Promise<FoodListing | undefined> {
    return this.foodListings.get(id);
  }

  async getAllFoodListings(): Promise<FoodListing[]> {
    return Array.from(this.foodListings.values());
  }

  async getAvailableFoodListings(): Promise<FoodListing[]> {
    return Array.from(this.foodListings.values()).filter(
      listing => listing.status === "available"
    );
  }

  async createFoodListing(insertListing: InsertFoodListing): Promise<FoodListing> {
    const id = randomUUID();
    const listing: FoodListing = {
      ...insertListing,
      cost: insertListing.cost ?? null,
      imageUrl: insertListing.imageUrl ?? null,
      defectsDetected: insertListing.defectsDetected ?? null,
      expiryDate: insertListing.expiryDate ?? null,
      pickupTimeStart: insertListing.pickupTimeStart ?? null,
      pickupTimeEnd: insertListing.pickupTimeEnd ?? null,
      aiAnalysis: insertListing.aiAnalysis ?? null,
      id,
      status: "available",
      createdAt: new Date(),
    };
    this.foodListings.set(id, listing);
    return listing;
  }

  async updateFoodListing(id: string, updates: Partial<FoodListing>): Promise<FoodListing | undefined> {
    const existing = this.foodListings.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.foodListings.set(id, updated);
    return updated;
  }

  async deleteFoodListing(id: string): Promise<boolean> {
    return this.foodListings.delete(id);
  }

  async getSensorDataForListing(listingId: string): Promise<SensorData[]> {
    return Array.from(this.sensorData.values()).filter(
      data => data.listingId === listingId
    ).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async createSensorData(insertData: InsertSensorData): Promise<SensorData> {
    const id = randomUUID();
    const data: SensorData = {
      ...insertData,
      id,
      timestamp: new Date(),
    };
    this.sensorData.set(id, data);
    return data;
  }

  async getClaimsForListing(listingId: string): Promise<Claim[]> {
    return Array.from(this.claims.values()).filter(
      claim => claim.listingId === listingId
    );
  }

  async createClaim(insertClaim: InsertClaim): Promise<Claim> {
    const id = randomUUID();
    const claim: Claim = {
      ...insertClaim,
      id,
      claimedAt: new Date(),
      status: "pending",
    };
    this.claims.set(id, claim);
    return claim;
  }

  async getAllOrganizations(): Promise<Organization[]> {
    return Array.from(this.organizations.values());
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }

  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    const id = randomUUID();
    const org: Organization = {
      ...insertOrg,
      imageUrl: insertOrg.imageUrl ?? null,
      website: insertOrg.website ?? null,
      verified: insertOrg.verified ?? false,
      id,
      createdAt: new Date(),
    };
    this.organizations.set(id, org);
    return org;
  }

  async getRatingsForOrganization(organizationId: string): Promise<SupplierRating[]> {
    return Array.from(this.supplierRatings.values()).filter(
      rating => rating.organizationId === organizationId
    );
  }

  async getRatingsForSupplier(supplierId: string): Promise<SupplierRating[]> {
    return Array.from(this.supplierRatings.values()).filter(
      rating => rating.supplierId === supplierId
    );
  }

  async createSupplierRating(insertRating: InsertSupplierRating): Promise<SupplierRating> {
    const id = randomUUID();
    const rating: SupplierRating = {
      ...insertRating,
      googleReviewScore: insertRating.googleReviewScore ?? null,
      aiAnalysis: insertRating.aiAnalysis ?? null,
      foodSafetyCertified: insertRating.foodSafetyCertified ?? false,
      totalDonations: insertRating.totalDonations ?? 0,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.supplierRatings.set(id, rating);
    return rating;
  }

  async getListingsByDonor(donorId: string): Promise<FoodListing[]> {
    return Array.from(this.foodListings.values()).filter(
      listing => listing.donorId === donorId
    );
  }
}

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
    return await db.select().from(foodListings).where(eq(foodListings.status, "available"));
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
    const result = await db.delete(foodListings).where(eq(foodListings.id, id)).returning();
    return result.length > 0;
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

export const storage = new DatabaseStorage();
