import { reserve, transition, WorkflowError, type ReserveInput, type Action } from "./reservations";
import { type User, type InsertUser, type FoodListing, type InsertFoodListing, type SensorData, type InsertSensorData, type Claim, type InsertClaim, type Organization, type InsertOrganization, type SupplierRating, type InsertSupplierRating, users, foodListings, sensorData, claims, organizations, supplierRatings } from "@shared/schema";
import { randomUUID } from "crypto";

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
  
  getAllClaims(): Promise<Claim[]>;
  getReservation(id: string): Promise<Claim | undefined>;
  getReservationsForUser(userId: string): Promise<Claim[]>;
  reserveListing(input: ReserveInput): Promise<Claim>;
  transitionReservation(id: string, actor: string, action: Action, now?: Date): Promise<Claim>;
  expireReservations(now?: Date): Promise<void>;
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
    if (Array.from(this.users.values()).some(user => user.username === insertUser.username)) throw new Error("Username unavailable");
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
      listing => listing.status === "available" && (!listing.expiryDate || listing.expiryDate > new Date())
    );
  }

  async createFoodListing(insertListing: InsertFoodListing): Promise<FoodListing> {
    const id = randomUUID();
    const listing: FoodListing = {
      ...insertListing,
      cost: insertListing.cost ?? null,
      weightKg: insertListing.weightKg ?? null, organizationId: insertListing.organizationId ?? null,
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
    const listing = this.foodListings.get(id);
    if (listing && (listing.status !== 'available' || [...this.claims.values()].some(claim => claim.listingId === id))) throw new WorkflowError(409, 'Listings with reservation history cannot be deleted');
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
      claimerId: insertClaim.claimerId ?? null, pickupAt: insertClaim.pickupAt ?? null, expiresAt: insertClaim.expiresAt ?? null, pickupNotes: insertClaim.pickupNotes ?? null, completedAt: null,
      status: "pending",
    };
    this.claims.set(id, claim);
    return claim;
  }

  async getAllClaims() { return [...this.claims.values()]; }
  async getReservation(id: string) { return this.claims.get(id); }
  async getReservationsForUser(userId: string) {
    return [...this.claims.values()].filter(claim => claim.claimerId === userId || this.foodListings.get(claim.listingId)?.donorId === userId);
  }
  async reserveListing(input: ReserveInput) {
    // No await between decision and writes: atomic within the memory process.
    const listing = this.foodListings.get(input.listingId);
    const claim = reserve(listing, input);
    this.foodListings.set(input.listingId, { ...listing!, status: 'reserved' });
    this.claims.set(claim.id, claim);
    return claim;
  }
  async transitionReservation(id: string, actor: string, action: Action, now = new Date()) {
    const claim = this.claims.get(id);
    if (!claim) throw new WorkflowError(404, 'Reservation not found');
    const listing = this.foodListings.get(claim.listingId)!;
    const result = transition(listing, claim, actor, action, now);
    this.claims.set(id, result.claim);
    this.foodListings.set(listing.id, { ...listing, status: result.listingStatus });
    return result.claim;
  }
  async expireReservations(now = new Date()) {
    for (const claim of this.claims.values()) {
      if (claim.status === 'reserved' && claim.expiresAt && claim.expiresAt <= now) await this.transitionReservation(claim.id, '', 'expire', now);
    }
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
      ownerId: insertOrg.ownerId ?? null,
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

if (process.env.STORAGE_MODE && process.env.STORAGE_MODE !== "memory" && process.env.STORAGE_MODE !== "database") {
  throw new Error("STORAGE_MODE must be memory or database");
}

// Explicit local-only mode reuses the existing store; never silently fall back.
export const storage: IStorage = process.env.STORAGE_MODE === "memory"
  ? new MemStorage()
  : new (await import("./database-storage")).DatabaseStorage();
