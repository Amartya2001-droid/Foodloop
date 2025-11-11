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

// Lazy initialization of OpenAI client
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
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
  app.post("/api/food-listings", upload.single("image"), async (req, res) => {
    try {
      const data = {
        ...req.body,
        pickupTimeStart: new Date(req.body.pickupTimeStart),
        pickupTimeEnd: new Date(req.body.pickupTimeEnd),
        latitude: parseFloat(req.body.latitude),
        longitude: parseFloat(req.body.longitude),
        freshnessScore: parseInt(req.body.freshnessScore) || 85,
        qualityScore: parseInt(req.body.qualityScore) || 85,
        defectsDetected: req.body.defectsDetected ? JSON.parse(req.body.defectsDetected) : [],
        aiAnalysis: req.body.aiAnalysis ? JSON.parse(req.body.aiAnalysis) : null,
      };

      if (req.file) {
        data.imageUrl = `/uploads/${req.file.filename}`;
      }

      const validated = insertFoodListingSchema.parse(data);
      const listing = await storage.createFoodListing(validated);
      res.status(201).json(listing);
    } catch (error: any) {
      console.error("Error creating food listing:", error);
      res.status(400).json({ error: error.message || "Failed to create food listing" });
    }
  });

  // Update food listing (e.g., claim food)
  app.patch("/api/food-listings/:id", async (req, res) => {
    try {
      // Only allow updating specific fields to prevent uncontrolled updates
      const allowedUpdates = ["status"];
      const updates: any = {};
      
      for (const key of allowedUpdates) {
        if (req.body[key] !== undefined) {
          updates[key] = req.body[key];
        }
      }

      const updated = await storage.updateFoodListing(req.params.id, updates);
      if (!updated) {
        return res.status(404).json({ error: "Food listing not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating food listing:", error);
      res.status(500).json({ error: "Failed to update food listing" });
    }
  });

  // Delete food listing
  app.delete("/api/food-listings/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteFoodListing(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Food listing not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting food listing:", error);
      res.status(500).json({ error: "Failed to delete food listing" });
    }
  });

  // Monitor/Dashboard Route - Get listings with claims for a specific donor
  app.get("/api/my-listings", async (req, res) => {
    try {
      // For demo, use hope_food_bank as the donor
      const donorUsername = "hope_food_bank";
      const donor = await storage.getUserByUsername(donorUsername);
      
      if (!donor) {
        return res.status(404).json({ error: "Donor not found" });
      }

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

      // Get all ratings for this organization
      const ratings = await storage.getRatingsForOrganization(req.params.id);
      
      // Get supplier details for each rating
      const suppliersWithRatings = await Promise.all(
        ratings.map(async (rating) => {
          const user = await storage.getUser(rating.supplierId);
          const listings = await storage.getListingsByDonor(rating.supplierId);
          return {
            ...rating,
            supplierName: user?.username || "Unknown",
            activeListings: listings.filter(l => l.status === "available").length,
            totalListings: listings.length,
          };
        })
      );

      res.json({
        ...org,
        suppliers: suppliersWithRatings,
      });
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

  // Create sensor data reading
  app.post("/api/sensor-data", async (req, res) => {
    try {
      const validated = insertSensorDataSchema.parse(req.body);
      const data = await storage.createSensorData(validated);
      res.status(201).json(data);
    } catch (error: any) {
      console.error("Error creating sensor data:", error);
      res.status(400).json({ error: error.message || "Failed to create sensor data" });
    }
  });

  // AI Food Detection Route
  app.post("/api/detect-food", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Check if OpenAI is configured
      let client: OpenAI;
      try {
        client = getOpenAIClient();
      } catch (error: any) {
        console.error("OpenAI not configured:", error.message);
        return res.status(503).json({ 
          error: "AI detection service is not available." 
        });
      }

      // Read the uploaded image file and convert to base64
      const imagePath = req.file.path;
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;

      // Use OpenAI Vision API to analyze the food
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this food image and provide detailed information in the following JSON format:
{
  "title": "concise food name (e.g., 'Fresh Organic Apples', 'Mixed Salad Greens')",
  "category": "one of: produce, bakery, dairy, prepared, packaged, other",
  "description": "detailed description including type, appearance, condition, estimated freshness, and any notable features (50-100 words)",
  "quantity": "estimated quantity with unit (e.g., '5 lbs', '10 servings', '2 loaves')",
  "freshnessScore": number between 60-100 based on visual appearance,
  "defectsDetected": array of any visible defects like ["bruising", "discoloration", "wilting"] or empty array if none
}

Be specific and practical. Focus on helping donors accurately describe their surplus food.`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        return res.status(500).json({ error: "No response from AI" });
      }

      // Parse the JSON response
      try {
        const foodData = JSON.parse(content);
        res.json(foodData);
      } catch (parseError) {
        console.error("Failed to parse AI response:", content);
        res.status(500).json({ error: "Failed to parse AI response" });
      }
    } catch (error: any) {
      console.error("Error in food detection:", error);
      
      if (error.status === 429) {
        return res.status(503).json({ error: "AI service is busy. Please try again." });
      }
      
      res.status(500).json({ error: "Failed to detect food" });
    }
  });

  // AI Chat Assistant Route
  app.post("/api/chat", async (req, res) => {
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
