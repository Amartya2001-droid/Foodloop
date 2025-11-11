import { db } from "./db";
import { users, foodListings, organizations, supplierRatings } from "@shared/schema";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database with demo data...");

  // Clear existing data
  await db.delete(supplierRatings);
  await db.delete(foodListings);
  await db.delete(organizations);
  await db.delete(users);

  // Create demo users
  const demoUsers = await db.insert(users).values([
    {
      username: "hope_food_bank",
      password: "demo123",
    },
    {
      username: "green_grocers_halifax",
      password: "demo123",
    },
    {
      username: "sarah_baker",
      password: "demo123",
    },
    {
      username: "marios_restaurant",
      password: "demo123",
    },
  ]).returning();

  console.log(`✅ Created ${demoUsers.length} demo users`);

  // Halifax locations for diverse map coverage
  const locations = [
    { name: "Hope Food Bank - Downtown", lat: 44.6488, lng: -63.5752, address: "1234 Barrington St, Downtown Halifax" },
    { name: "Green Grocers - North End", lat: 44.6650, lng: -63.5820, address: "567 Gottingen St, North End" },
    { name: "Community Kitchen - Dartmouth", lat: 44.6710, lng: -63.5683, address: "890 Portland St, Dartmouth" },
    { name: "Mario's Italian Restaurant - Clayton Park", lat: 44.6580, lng: -63.6350, address: "234 Lacewood Dr, Clayton Park" },
    { name: "Fresh Start Market - Bedford", lat: 44.7350, lng: -63.6800, address: "456 Bedford Hwy, Bedford" },
    { name: "Spring Garden Bakery", lat: 44.6430, lng: -63.5770, address: "789 Spring Garden Rd, Halifax" },
    { name: "Quinpool Cafe", lat: 44.6450, lng: -63.6020, address: "321 Quinpool Rd, Halifax" },
    { name: "Hydrostone Market", lat: 44.6720, lng: -63.5950, address: "123 Young St, North End" },
  ];

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Create diverse food listings
  const listings = [];

  // NGO - Hope Food Bank listings
  listings.push({
    title: "Fresh Organic Vegetables",
    description: "Assorted fresh vegetables including carrots, broccoli, lettuce, and tomatoes. Donated from local farms, all organic and in excellent condition. Perfect for families or community meals.",
    quantity: "50 lbs",
    category: "produce",
    location: locations[0].address,
    latitude: locations[0].lat,
    longitude: locations[0].lng,
    pickupTimeStart: new Date(tomorrow.setHours(9, 0, 0)),
    pickupTimeEnd: new Date(tomorrow.setHours(17, 0, 0)),
    freshnessScore: 95,
    qualityScore: 95,
    defectsDetected: [],
    aiAnalysis: null,
    donorId: demoUsers[0].id,
    cost: "Free",
  });

  listings.push({
    title: "Whole Wheat Bread Loaves",
    description: "20 loaves of fresh whole wheat bread from local bakery donations. Baked this morning, soft and nutritious. Great for sandwiches or toast.",
    quantity: "20 loaves",
    category: "bakery",
    location: locations[0].address,
    latitude: locations[0].lat,
    longitude: locations[0].lng,
    pickupTimeStart: new Date(tomorrow.setHours(10, 0, 0)),
    pickupTimeEnd: new Date(tomorrow.setHours(18, 0, 0)),
    freshnessScore: 90,
    qualityScore: 92,
    defectsDetected: [],
    aiAnalysis: null,
    donorId: demoUsers[0].id,
    cost: "Free",
  });

  // Green Grocers - Halifax North End
  listings.push({
    title: "Mixed Fruit Basket",
    description: "Beautiful assortment of ripe fruits including apples, bananas, oranges, and pears. Slightly overripe but still delicious and nutritious. Perfect for smoothies or fresh eating.",
    quantity: "30 lbs",
    category: "produce",
    location: locations[1].address,
    latitude: locations[1].lat,
    longitude: locations[1].lng,
    pickupTimeStart: new Date(tomorrow.setHours(15, 0, 0)),
    pickupTimeEnd: new Date(tomorrow.setHours(20, 0, 0)),
    freshnessScore: 80,
    qualityScore: 85,
    defectsDetected: ["minor bruising"],
    aiAnalysis: null,
    donorId: demoUsers[1].id,
    cost: "$5",
  });

  listings.push({
    title: "Fresh Salad Greens",
    description: "Premium mixed greens including romaine, spinach, and arugula. Harvested today from our vertical farm. Crisp, clean, and ready to eat.",
    quantity: "15 bags",
    category: "produce",
    location: locations[1].address,
    latitude: locations[1].lat,
    longitude: locations[1].lng,
    pickupTimeStart: new Date(tomorrow.setHours(14, 0, 0)),
    pickupTimeEnd: new Date(tomorrow.setHours(19, 0, 0)),
    freshnessScore: 98,
    qualityScore: 98,
    defectsDetected: [],
    aiAnalysis: null,
    donorId: demoUsers[1].id,
    cost: "$3",
  });

  // Sarah's Bakery
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  listings.push({
    title: "Artisan Sourdough Bread",
    description: "5 loaves of handcrafted sourdough bread. Made with organic flour and traditional fermentation. Slightly day-old but perfect for toasting or making croutons.",
    quantity: "5 loaves",
    category: "bakery",
    location: locations[5].address,
    latitude: locations[5].lat,
    longitude: locations[5].lng,
    pickupTimeStart: new Date(dayAfter.setHours(16, 0, 0)),
    pickupTimeEnd: new Date(dayAfter.setHours(21, 0, 0)),
    freshnessScore: 85,
    qualityScore: 90,
    defectsDetected: [],
    aiAnalysis: null,
    donorId: demoUsers[2].id,
    cost: "$2 per loaf",
  });

  listings.push({
    title: "Assorted Pastries",
    description: "Mix of croissants, danishes, and muffins from this morning's batch. All made with butter and fresh ingredients. Great for breakfast or afternoon snack.",
    quantity: "24 pieces",
    category: "bakery",
    location: locations[5].address,
    latitude: locations[5].lat,
    longitude: locations[5].lng,
    pickupTimeStart: new Date(dayAfter.setHours(17, 0, 0)),
    pickupTimeEnd: new Date(dayAfter.setHours(21, 0, 0)),
    freshnessScore: 88,
    qualityScore: 92,
    defectsDetected: [],
    aiAnalysis: null,
    donorId: demoUsers[2].id,
    cost: "$10 for all",
  });

  // Mario's Restaurant
  const today = new Date();
  listings.push({
    title: "Prepared Pasta Dishes",
    description: "10 servings of fresh pasta with marinara sauce. Made today with organic ingredients. Fully cooked and ready to reheat. Contains: tomatoes, basil, olive oil, pasta.",
    quantity: "10 servings",
    category: "prepared",
    location: locations[3].address,
    latitude: locations[3].lat,
    longitude: locations[3].lng,
    pickupTimeStart: new Date(today.setHours(20, 0, 0)),
    pickupTimeEnd: new Date(today.setHours(22, 0, 0)),
    freshnessScore: 92,
    qualityScore: 95,
    defectsDetected: [],
    aiAnalysis: null,
    donorId: demoUsers[3].id,
    cost: "Free",
  });

  listings.push({
    title: "Fresh Mozzarella Cheese",
    description: "Homemade mozzarella cheese, made this afternoon. Soft, creamy, and perfect for caprese salad or pizza. Must be picked up today for best quality.",
    quantity: "3 lbs",
    category: "dairy",
    location: locations[3].address,
    latitude: locations[3].lat,
    longitude: locations[3].lng,
    pickupTimeStart: new Date(today.setHours(19, 30, 0)),
    pickupTimeEnd: new Date(today.setHours(22, 0, 0)),
    freshnessScore: 96,
    qualityScore: 98,
    defectsDetected: [],
    aiAnalysis: null,
    donorId: demoUsers[3].id,
    cost: "$8",
  });

  // Additional listings for map diversity
  listings.push({
    title: "Canned Goods Variety Pack",
    description: "Assorted canned vegetables, beans, and soups. All unexpired with best-by dates 6+ months away. Great for food pantries or emergency supplies.",
    quantity: "40 cans",
    category: "packaged",
    location: locations[2].address,
    latitude: locations[2].lat,
    longitude: locations[2].lng,
    pickupTimeStart: new Date(tomorrow.setHours(11, 0, 0)),
    pickupTimeEnd: new Date(tomorrow.setHours(16, 0, 0)),
    freshnessScore: 100,
    qualityScore: 95,
    defectsDetected: [],
    aiAnalysis: null,
    donorId: demoUsers[0].id,
    cost: "Free",
  });

  listings.push({
    title: "Fresh Eggs - Cage Free",
    description: "5 dozen fresh cage-free eggs from local farm. Gathered this week, stored properly at proper temperature. Perfect for cooking or baking.",
    quantity: "60 eggs",
    category: "dairy",
    location: locations[4].address,
    latitude: locations[4].lat,
    longitude: locations[4].lng,
    pickupTimeStart: new Date(tomorrow.setHours(8, 0, 0)),
    pickupTimeEnd: new Date(tomorrow.setHours(14, 0, 0)),
    freshnessScore: 94,
    qualityScore: 96,
    defectsDetected: [],
    aiAnalysis: null,
    donorId: demoUsers[1].id,
    cost: "$15",
  });

  listings.push({
    title: "Rice and Pasta Mix",
    description: "Bulk dry goods including white rice, brown rice, and various pasta shapes. All sealed and unexpired. Perfect for large families or community kitchens.",
    quantity: "25 lbs total",
    category: "packaged",
    location: locations[6].address,
    latitude: locations[6].lat,
    longitude: locations[6].lng,
    pickupTimeStart: new Date(tomorrow.setHours(12, 0, 0)),
    pickupTimeEnd: new Date(tomorrow.setHours(18, 0, 0)),
    freshnessScore: 100,
    qualityScore: 100,
    defectsDetected: [],
    aiAnalysis: null,
    donorId: demoUsers[0].id,
    cost: "Free",
  });

  listings.push({
    title: "Prepared Vegetarian Meals",
    description: "8 portions of vegetarian curry with rice. Made with chickpeas, vegetables, and aromatic spices. Fully cooked, ready to reheat. Vegan-friendly.",
    quantity: "8 servings",
    category: "prepared",
    location: locations[7].address,
    latitude: locations[7].lat,
    longitude: locations[7].lng,
    pickupTimeStart: new Date(today.setHours(18, 0, 0)),
    pickupTimeEnd: new Date(today.setHours(21, 0, 0)),
    freshnessScore: 90,
    qualityScore: 93,
    defectsDetected: [],
    aiAnalysis: null,
    donorId: demoUsers[3].id,
    cost: "Free",
  });

  const createdListings = await db.insert(foodListings).values(listings).returning();

  console.log(`✅ Created ${listings.length} demo food listings`);

  // Create demo claims
  const { claims } = await import("@shared/schema");
  const demoClaims = [
    {
      listingId: createdListings[0].id, // Fresh Organic Vegetables
      claimerName: "Sarah Johnson",
      claimerContact: "902-555-0123",
      status: "confirmed",
    },
    {
      listingId: createdListings[0].id,
      claimerName: "Community Kitchen Halifax",
      claimerContact: "902-555-0456",
      status: "pending",
    },
    {
      listingId: createdListings[1].id, // Bread Loaves
      claimerName: "Michael Chen",
      claimerContact: "902-555-0789",
      status: "confirmed",
    },
    {
      listingId: createdListings[6].id, // Prepared Pasta
      claimerName: "Halifax Shelter",
      claimerContact: "902-555-0321",
      status: "confirmed",
    },
    {
      listingId: createdListings[6].id,
      claimerName: "Emma Wilson",
      claimerContact: "902-555-0654",
      status: "pending",
    },
    {
      listingId: createdListings[2].id, // Mixed Fruit
      claimerName: "David Martinez",
      claimerContact: "902-555-0987",
      status: "confirmed",
    },
  ];

  await db.insert(claims).values(demoClaims);
  console.log(`✅ Created ${demoClaims.length} demo claims`);

  // Create organizations (NGOs, Food Banks)
  const demoOrganizations = await db.insert(organizations).values([
    {
      name: "Halifax Regional Food Bank",
      type: "Food Bank",
      description: "Halifax's largest food bank serving thousands of families across HRM. We work with local suppliers to redistribute surplus food and reduce waste while fighting hunger.",
      location: "3792 Kempt Rd, Halifax, NS",
      latitude: 44.6680,
      longitude: -63.6150,
      contactEmail: "info@halifaxfoodbank.org",
      contactPhone: "902-457-1400",
      website: "https://halifaxfoodbank.org",
      verified: true,
    },
    {
      name: "Feed Nova Scotia",
      type: "NGO",
      description: "A province-wide organization connecting surplus food with communities in need. We coordinate food rescue operations and support local food security initiatives.",
      location: "61 Troop Ave, Dartmouth, NS",
      latitude: 44.6820,
      longitude: -63.5630,
      contactEmail: "contact@feednovascotia.ca",
      contactPhone: "902-457-1552",
      website: "https://feednovascotia.ca",
      verified: true,
    },
    {
      name: "Hope Cottage Community Center",
      type: "Community Center",
      description: "Community-based organization providing meals and support services to those experiencing food insecurity in North End Halifax.",
      location: "2736 Agricola St, Halifax, NS",
      latitude: 44.6630,
      longitude: -63.5890,
      contactEmail: "hopecottage@halifax.ca",
      contactPhone: "902-422-8324",
      verified: true,
    },
    {
      name: "Souls Harbour Rescue Mission",
      type: "Rescue Mission",
      description: "Faith-based organization serving hot meals daily and accepting food donations from local businesses and farms to support vulnerable populations.",
      location: "26 Seymour St, Halifax, NS",
      latitude: 44.6505,
      longitude: -63.5745,
      contactEmail: "info@soulsharbour.ca",
      contactPhone: "902-423-4767",
      website: "https://soulsharbour.ca",
      verified: true,
    },
    {
      name: "Parker Street Food & Furniture Bank",
      type: "Food Bank",
      description: "Dartmouth-based food bank providing emergency food assistance and household items to families in need. We partner with local suppliers for fresh produce and prepared foods.",
      location: "2 Irishtown Rd, Dartmouth, NS",
      latitude: 44.6780,
      longitude: -63.5470,
      contactEmail: "info@parkerstreet.org",
      contactPhone: "902-479-3190",
      website: "https://parkerstreet.org",
      verified: true,
    },
    {
      name: "Metro Turning Point",
      type: "Shelter",
      description: "Emergency shelter and outreach program accepting prepared meals and fresh food donations to serve vulnerable youth and families.",
      location: "60 Almon St, Halifax, NS",
      latitude: 44.6570,
      longitude: -63.5980,
      contactEmail: "info@metroturningpoint.ca",
      contactPhone: "902-423-4782",
      verified: false,
    },
  ]).returning();

  console.log(`✅ Created ${demoOrganizations.length} organizations`);

  // Create AI-based supplier ratings
  // AI Analysis structure: { reasoning, factors, confidence }
  const demoRatings = [
    // Hope Food Bank ratings
    {
      supplierId: demoUsers[0].id, // hope_food_bank
      organizationId: demoOrganizations[0].id, // Halifax Regional Food Bank
      overallRating: 4.8,
      googleReviewScore: 4.7,
      foodSafetyCertified: true,
      reliabilityScore: 4.9,
      qualityScore: 4.8,
      totalDonations: 127,
      aiAnalysis: {
        reasoning: "Exceptional supplier with consistent quality and reliability. Strong Google presence (4.7 stars, 245 reviews) and verified food safety certification. High-quality organic produce donations.",
        factors: {
          googleReviewScore: 4.7,
          foodSafetyCertified: true,
          reliabilityScore: 4.9,
          qualityScore: 4.8,
          totalDonations: 127
        },
        confidence: 0.95
      }
    },
    {
      supplierId: demoUsers[1].id, // green_grocers_halifax
      organizationId: demoOrganizations[0].id,
      overallRating: 4.6,
      googleReviewScore: 4.5,
      foodSafetyCertified: true,
      reliabilityScore: 4.7,
      qualityScore: 4.6,
      totalDonations: 89,
      aiAnalysis: {
        reasoning: "Reliable local supplier with excellent food safety practices. Google reviews (4.5 stars, 128 reviews) highlight fresh produce quality. Certified by Nova Scotia Health Authority.",
        factors: {
          googleReviewScore: 4.5,
          foodSafetyCertified: true,
          reliabilityScore: 4.7,
          qualityScore: 4.6,
          totalDonations: 89
        },
        confidence: 0.92
      }
    },
    {
      supplierId: demoUsers[3].id, // marios_restaurant
      organizationId: demoOrganizations[0].id,
      overallRating: 4.4,
      googleReviewScore: 4.6,
      foodSafetyCertified: true,
      reliabilityScore: 4.3,
      qualityScore: 4.5,
      totalDonations: 62,
      aiAnalysis: {
        reasoning: "Well-established restaurant (4.6 stars, 312 reviews) with food safety certification. Prepared meals are high quality but donation schedule can be irregular.",
        factors: {
          googleReviewScore: 4.6,
          foodSafetyCertified: true,
          reliabilityScore: 4.3,
          qualityScore: 4.5,
          totalDonations: 62
        },
        confidence: 0.88
      }
    },
    // Feed Nova Scotia ratings
    {
      supplierId: demoUsers[1].id, // green_grocers_halifax
      organizationId: demoOrganizations[1].id,
      overallRating: 4.7,
      googleReviewScore: 4.5,
      foodSafetyCertified: true,
      reliabilityScore: 4.8,
      qualityScore: 4.7,
      totalDonations: 103,
      aiAnalysis: {
        reasoning: "Top-tier supplier for Feed Nova Scotia with exceptional reliability. Consistent weekly deliveries of fresh produce. Strong community reputation.",
        factors: {
          googleReviewScore: 4.5,
          foodSafetyCertified: true,
          reliabilityScore: 4.8,
          qualityScore: 4.7,
          totalDonations: 103
        },
        confidence: 0.94
      }
    },
    {
      supplierId: demoUsers[2].id, // sarah_baker
      organizationId: demoOrganizations[1].id,
      overallRating: 4.5,
      googleReviewScore: 4.8,
      foodSafetyCertified: true,
      reliabilityScore: 4.4,
      qualityScore: 4.6,
      totalDonations: 45,
      aiAnalysis: {
        reasoning: "Artisan baker with outstanding product quality (4.8 stars, 89 reviews). Smaller donation volume but exceptional freshness and taste. Food safety certified.",
        factors: {
          googleReviewScore: 4.8,
          foodSafetyCertified: true,
          reliabilityScore: 4.4,
          qualityScore: 4.6,
          totalDonations: 45
        },
        confidence: 0.89
      }
    },
    // Hope Cottage ratings
    {
      supplierId: demoUsers[3].id, // marios_restaurant
      organizationId: demoOrganizations[2].id,
      overallRating: 4.3,
      googleReviewScore: 4.6,
      foodSafetyCertified: true,
      reliabilityScore: 4.2,
      qualityScore: 4.4,
      totalDonations: 38,
      aiAnalysis: {
        reasoning: "Good quality prepared meals suitable for immediate serving. Restaurant has strong reviews but donation timing requires coordination.",
        factors: {
          googleReviewScore: 4.6,
          foodSafetyCertified: true,
          reliabilityScore: 4.2,
          qualityScore: 4.4,
          totalDonations: 38
        },
        confidence: 0.85
      }
    },
    {
      supplierId: demoUsers[0].id, // hope_food_bank
      organizationId: demoOrganizations[4].id, // Parker Street
      overallRating: 4.7,
      googleReviewScore: 4.7,
      foodSafetyCertified: true,
      reliabilityScore: 4.8,
      qualityScore: 4.7,
      totalDonations: 95,
      aiAnalysis: {
        reasoning: "Highly dependable supplier network with verified practices. Excellent coordination and communication. Organic certification adds value.",
        factors: {
          googleReviewScore: 4.7,
          foodSafetyCertified: true,
          reliabilityScore: 4.8,
          qualityScore: 4.7,
          totalDonations: 95
        },
        confidence: 0.93
      }
    },
  ];

  await db.insert(supplierRatings).values(demoRatings);
  console.log(`✅ Created ${demoRatings.length} supplier ratings`);

  console.log("\n📍 Demo Data Summary:");
  console.log("  - Hope Food Bank (NGO) - 4 listings");
  console.log("  - Green Grocers Halifax - 3 listings");
  console.log("  - Sarah Baker - 2 listings");
  console.log("  - Mario's Restaurant - 3 listings");
  console.log("\n📞 Demo Claims:");
  console.log("  - 6 claims from various community members");
  console.log("\n🏢 Demo Organizations:");
  console.log("  - 6 Halifax NGOs and food banks with verified status");
  console.log("\n⭐ Supplier Ratings:");
  console.log("  - 7 AI-analyzed ratings based on Google reviews, certifications, and reliability");
  console.log("\n🎉 Database seeded successfully!");
  console.log("\nDemo Credentials:");
  console.log("  - hope_food_bank / demo123");
  console.log("  - green_grocers_halifax / demo123");
  console.log("  - sarah_baker / demo123");
  console.log("  - marios_restaurant / demo123");
}

seed()
  .then(() => {
    console.log("✅ Seed completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
