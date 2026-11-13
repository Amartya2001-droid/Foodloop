import { installDataRoutes, supplierSummaries } from "./data-routes";
import { inspectImage } from "./inspections";
import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFoodListingSchema, insertSensorDataSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
import OpenAI from "openai";
import { z } from "zod";
import { WorkflowError } from "./reservations";
import { installAuth, requireUser, userId } from "./auth";

// Lazy initialization of OpenAI client
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      ...(process.env.OPENAI_BASE_URL ? { baseURL: process.env.OPENAI_BASE_URL } : {}),
      timeout: 20000, maxRetries: 0,
    });
  }
  return openai;
}

// Chat message validation schema
const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(2000),
});

const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(20),
});

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count++;
  return true;
}

const upload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), "uploads");
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed!"));
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  installAuth(app);
  app.use('/api', async (_req, res, next) => {
    try { await storage.expireReservations(); next(); }
    catch { res.status(503).json({ error: 'Reservation storage unavailable' }); }
  });
  installDataRoutes(app);
  const workflowFailure = (res: express.Response, error: unknown) => {
    res.status(error instanceof WorkflowError ? error.status : error instanceof z.ZodError ? 400 : 500).json({ error: error instanceof WorkflowError ? error.message : error instanceof z.ZodError ? 'Invalid reservation details' : 'Reservation service unavailable' });
  };
  app.post('/api/food-listings/:id/reservations', requireUser, async (req, res) => {
    try {
      const body = z.object({ pickupAt: z.coerce.date(), contact: z.string().trim().min(3).max(200), notes: z.string().trim().max(1000).default('') }).parse(req.body);
      const claim = await storage.reserveListing({ listingId: req.params.id, claimerId: userId(res), claimerName: res.locals.user.username, claimerContact: body.contact, pickupAt: body.pickupAt, pickupNotes: body.notes });
      res.status(201).json(claim);
    } catch (error) { workflowFailure(res, error); }
  });
  app.get('/api/reservations', requireUser, async (_req, res) => {
    try {
      const reservations = await storage.getReservationsForUser(userId(res));
      res.json(await Promise.all(reservations.map(async claim => {
        const listing = await storage.getFoodListing(claim.listingId);
        const donor = listing && await storage.getUser(listing.donorId);
        return { ...claim, listing, donorName: donor?.username ?? 'Unknown' };
      })));
    } catch (error) { workflowFailure(res, error); }
  });
  app.post('/api/reservations/:id/actions', requireUser, async (req, res) => {
    try {
      const { action } = z.object({ action: z.enum(['cancel', 'picked_up', 'complete']) }).parse(req.body);
      res.json(await storage.transitionReservation(req.params.id, userId(res), action));
    } catch (error) { workflowFailure(res, error); }
  });
  // Food Listings Routes
  
  // Get all available food listings
  app.get("/api/food-listings", async (req, res) => {
    try {
      const listings = await storage.getAvailableFoodListings();
      res.json(listings);
    } catch (error) {
      console.error("Error fetching food listings:", error);
      res.status(500).json({ error: "Failed to fetch food listings" });
    }
  });

  // Get single food listing
  app.get("/api/food-listings/:id", async (req, res) => {
    try {
      const listing = await storage.getFoodListing(req.params.id);
      if (!listing) {
        return res.status(404).json({ error: "Food listing not found" });
      }
      res.json(listing);
    } catch (error) {
      console.error("Error fetching food listing:", error);
      res.status(500).json({ error: "Failed to fetch food listing" });
    }
  });

  // Create new food listing with image upload
  app.post("/api/food-listings", requireUser, upload.single("image"), async (req, res) => {
    try {
      const data = {
        ...req.body,
        donorId: userId(res),
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null,
        weightKg: req.body.weightKg ? Number(req.body.weightKg) : null,
        organizationId: req.body.organizationId || null,
        pickupTimeStart: req.body.pickupTimeStart ? new Date(req.body.pickupTimeStart) : null,
        pickupTimeEnd: req.body.pickupTimeEnd ? new Date(req.body.pickupTimeEnd) : null,
        latitude: parseFloat(req.body.latitude),
        longitude: parseFloat(req.body.longitude),
        freshnessScore: 0,
        qualityScore: 0,
        defectsDetected: req.body.defectsDetected ? JSON.parse(req.body.defectsDetected) : [],
        aiAnalysis: null,
      };

      if (req.file) {
        data.imageUrl = `/uploads/${req.file.filename}`;
      }

      const validated = insertFoodListingSchema.extend({ title: z.string().trim().min(1).max(150), description: z.string().trim().min(1).max(2000), quantity: z.string().trim().min(1).max(100), category: z.enum(['produce', 'bakery', 'dairy', 'prepared', 'packaged', 'other']), location: z.string().trim().min(1).max(300), latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), weightKg: z.number().positive().max(10000).nullable() }).parse(data);
      if (validated.expiryDate && validated.expiryDate <= new Date()) return res.status(400).json({ error: 'Expiry must be in the future' });
      if (validated.pickupTimeStart && validated.pickupTimeEnd && validated.pickupTimeEnd <= validated.pickupTimeStart) return res.status(400).json({ error: 'Pickup end must be after start' });
      if (validated.organizationId) {
        const organization = await storage.getOrganization(validated.organizationId);
        if (!organization || organization.ownerId !== userId(res)) return res.status(403).json({ error: 'Select an organization you own' });
      }
      const listing = await storage.createFoodListing(validated);
      res.status(201).json(listing);
    } catch (error: any) {
      console.error("Error creating food listing:", error);
      res.status(400).json({ error: error.message || "Failed to create food listing" });
    }
  });

  // Update food listing (e.g., claim food)
  app.patch("/api/food-listings/:id", requireUser, async (req, res) => {
    try {
      const existing = await storage.getFoodListing(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Food listing not found' });
      if (existing.donorId !== userId(res)) return res.status(403).json({ error: 'Only the donor may change this listing' });
      return res.status(400).json({ error: 'Use reservation actions to change lifecycle status' });
    } catch (error) {
      console.error("Error updating food listing:", error);
      res.status(500).json({ error: "Failed to update food listing" });
    }
  });

  // Delete food listing
  app.delete("/api/food-listings/:id", requireUser, async (req, res) => {
    try {
      const existing = await storage.getFoodListing(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Food listing not found' });
      if (existing.donorId !== userId(res)) return res.status(403).json({ error: 'Only the donor may change this listing' });
      if (existing.status !== 'available' || (await storage.getClaimsForListing(existing.id)).length) return res.status(409).json({ error: 'Listings with reservation history cannot be deleted' });
      const deleted = await storage.deleteFoodListing(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Food listing not found" });
      }
      res.status(204).send();
    } catch (error) {
      if (error instanceof WorkflowError) return res.status(error.status).json({ error: error.message });
      console.error("Error deleting food listing:", error);
      res.status(500).json({ error: "Failed to delete food listing" });
    }
  });

  // Monitor/Dashboard Route - Get listings with claims for a specific donor
  app.get("/api/my-listings", requireUser, async (req, res) => {
    try {
      const donor = res.locals.user;
      const listings = await storage.getAllFoodListings();
      const donorListings = listings.filter(l => l.donorId === donor.id);
      
      // Fetch claims for each listing
      const listingsWithClaims = await Promise.all(
        donorListings.map(async (listing) => {
          const claims = await storage.getClaimsForListing(listing.id);
          return {
            ...listing,
            claims,
          };
        })
      );

      res.json(listingsWithClaims);
    } catch (error) {
      console.error("Error fetching donor listings:", error);
      res.status(500).json({ error: "Failed to fetch listings" });
    }
  });

  // Sensor Data Routes
  
  // Get sensor data for a listing
  // Get all organizations
  app.get("/api/organizations", async (req, res) => {
    try {
      const orgs = await storage.getAllOrganizations();
      res.json(orgs);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ error: "Failed to fetch organizations" });
    }
  });

  // Get organization detail with suppliers and ratings
  app.get("/api/organizations/:id", async (req, res) => {
    try {
      const org = await storage.getOrganization(req.params.id);
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }

      res.json({ ...org, suppliers: await supplierSummaries(org.id) });
    } catch (error) {
      console.error("Error fetching organization details:", error);
      res.status(500).json({ error: "Failed to fetch organization details" });
    }
  });

  app.get("/api/sensor-data/:listingId", async (req, res) => {
    try {
      const data = await storage.getSensorDataForListing(req.params.listingId);
      res.json(data);
    } catch (error) {
      console.error("Error fetching sensor data:", error);
      res.status(500).json({ error: "Failed to fetch sensor data" });
    }
  });

  app.get('/api/food-listings/:id/readings', async (req, res) => {
    try {
      if (!await storage.getFoodListing(req.params.id)) return res.status(404).json({ error: 'Listing not found' });
      const readings = await storage.getSensorDataForListing(req.params.id);
      const latest = readings[0];
      res.json({ readings, unit: 'celsius', source: 'donor_submitted_measurements', stale: !latest || Date.now() - new Date(latest.timestamp).getTime() > 15 * 60000 });
    } catch { res.status(500).json({ error: 'Could not load readings' }); }
  });
  // Create sensor data reading
  app.post("/api/sensor-data", requireUser, async (req, res) => {
    try {
      const validated = insertSensorDataSchema.extend({ temperature: z.number().min(-80).max(100), humidity: z.number().min(0).max(100) }).parse(req.body);
      const listing = await storage.getFoodListing(validated.listingId);
      if (!listing) return res.status(404).json({ error: 'Food listing not found' });
      if (listing.donorId !== userId(res)) return res.status(403).json({ error: 'Only the donor may submit readings' });
      const data = await storage.createSensorData(validated);
      res.status(201).json(data);
    } catch (error: any) {
      console.error("Error creating sensor data:", error);
      res.status(400).json({ error: error.message || "Failed to create sensor data" });
    }
  });

  // AI Food Detection Route
  app.post("/api/detect-food", requireUser, upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const result = await inspectImage(await fs.readFile(req.file.path), req.file.mimetype);
      res.json(result);
    } catch (error: any) {
      res.status(error.message === 'AI_NOT_CONFIGURED' ? 503 : 502).json({ error: error.message === 'AI_NOT_CONFIGURED' ? 'AI inspection unavailable; configure OPENAI_API_KEY or use manual observations' : 'AI provider returned an unavailable or invalid result' });
    } finally { if (req.file) await fs.unlink(req.file.path).catch(() => {}); }
  });
  app.post('/api/food-listings/:id/inspect', requireUser, upload.single('image'), async (req, res) => {
    try {
      const listing = await storage.getFoodListing(req.params.id);
      if (!listing) return res.status(404).json({ error: 'Listing not found' });
      if (listing.donorId !== userId(res)) return res.status(403).json({ error: 'Only the donor may inspect this listing' });
      if (!req.file) return res.status(400).json({ error: 'Upload an image' });
      const result = await inspectImage(await fs.readFile(req.file.path), req.file.mimetype);
      res.json(await storage.updateFoodListing(listing.id, { aiAnalysis: { source: 'openai', model: 'gpt-4o-mini', observedAt: new Date().toISOString(), notes: result.description, defects: result.defectsDetected, disclaimer: 'Visual model observation, not food safety certification' }, defectsDetected: result.defectsDetected }));
    } catch (error: any) {
      res.status(error.message === 'AI_NOT_CONFIGURED' ? 503 : 502).json({ error: error.message === 'AI_NOT_CONFIGURED' ? 'AI inspection unavailable; configure OPENAI_API_KEY or use manual observations' : 'AI provider returned an unavailable or invalid result' });
    } finally { if (req.file) await fs.unlink(req.file.path).catch(() => {}); }
  });

  // AI Chat Assistant Route
  app.post("/api/chat", requireUser, async (req, res) => {
    try {
      // Check rate limit
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";
      if (!checkRateLimit(clientIp)) {
        return res.status(429).json({ 
          error: "Too many requests. Please try again in a minute." 
        });
      }

      // Validate request body
      const validationResult = chatRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid request format",
          details: validationResult.error.issues 
        });
      }

      const { messages } = validationResult.data;

      // Check if OpenAI is configured
      let client: OpenAI;
      try {
        client = getOpenAIClient();
      } catch (error: any) {
        console.error("OpenAI not configured:", error.message);
        return res.status(503).json({ 
          error: "AI chat service is not available. Please contact support." 
        });
      }

      const systemPrompt = `You are an AI assistant for FoodLoop AI, a platform that reduces food waste by connecting food donors with recipients. 

Your role is to help users:
- Post surplus food listings with proper details
- Understand food quality and freshness scores
- Learn about optimal pickup times and food safety
- Navigate the platform features
- Answer questions about food waste reduction

Key features of FoodLoop AI:
- AI-powered quality inspection using computer vision
- Real-time IoT sensor monitoring (temperature, humidity)
- Smart matching between donors and recipients
- Impact tracking (meals provided, CO2 prevented, pounds saved)

Be helpful, concise, and encouraging. Focus on food waste reduction and community impact.`;

      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const assistantMessage = completion.choices[0].message;
      res.json({ message: assistantMessage });
    } catch (error: any) {
      console.error("Error in chat:", error);
      
      // Handle OpenAI-specific errors
      if (error.status === 401) {
        return res.status(503).json({ error: "AI service authentication failed" });
      }
      if (error.status === 429) {
        return res.status(503).json({ error: "AI service is busy. Please try again." });
      }
      
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  // Serve uploaded images
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads"), {
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
  }));

  const httpServer = createServer(app);

  return httpServer;
}
