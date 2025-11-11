import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, real, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const foodListings = pgTable("food_listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  quantity: text("quantity").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  cost: text("cost"),
  location: text("location").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  expiryDate: timestamp("expiry_date"),
  pickupTimeStart: timestamp("pickup_time_start"),
  pickupTimeEnd: timestamp("pickup_time_end"),
  freshnessScore: integer("freshness_score").notNull(),
  qualityScore: integer("quality_score").notNull(),
  defectsDetected: text("defects_detected").array(),
  aiAnalysis: jsonb("ai_analysis"),
  status: text("status").notNull().default("available"),
  donorId: varchar("donor_id").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const sensorData = pgTable("sensor_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").notNull(),
  temperature: real("temperature").notNull(),
  humidity: real("humidity").notNull(),
  timestamp: timestamp("timestamp").notNull().default(sql`now()`),
});

export const claims = pgTable("claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").notNull(),
  claimerName: text("claimer_name").notNull(),
  claimerContact: text("claimer_contact").notNull(),
  claimedAt: timestamp("claimed_at").notNull().default(sql`now()`),
  status: text("status").notNull().default("pending"),
});

export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone").notNull(),
  website: text("website"),
  imageUrl: text("image_url"),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const supplierRatings = pgTable("supplier_ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: varchar("supplier_id").notNull().references(() => users.id),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  overallRating: real("overall_rating").notNull(),
  googleReviewScore: real("google_review_score"),
  foodSafetyCertified: boolean("food_safety_certified").notNull().default(false),
  reliabilityScore: real("reliability_score").notNull(),
  qualityScore: real("quality_score").notNull(),
  totalDonations: integer("total_donations").notNull().default(0),
  aiAnalysis: jsonb("ai_analysis"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertFoodListingSchema = createInsertSchema(foodListings).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertSensorDataSchema = createInsertSchema(sensorData).omit({
  id: true,
  timestamp: true,
});

export const insertClaimSchema = createInsertSchema(claims).omit({
  id: true,
  claimedAt: true,
  status: true,
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
});

export const insertSupplierRatingSchema = createInsertSchema(supplierRatings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type FoodListing = typeof foodListings.$inferSelect;
export type InsertFoodListing = z.infer<typeof insertFoodListingSchema>;
export type SensorData = typeof sensorData.$inferSelect;
export type InsertSensorData = z.infer<typeof insertSensorDataSchema>;
export type Claim = typeof claims.$inferSelect;
export type InsertClaim = z.infer<typeof insertClaimSchema>;
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type SupplierRating = typeof supplierRatings.$inferSelect;
export type InsertSupplierRating = z.infer<typeof insertSupplierRatingSchema>;
