# FoodLoop AI - Instructions

## Overview

FoodLoop AI is a real-time platform that reduces food waste by connecting food donors (restaurants, grocery stores, homes) with recipients (community fridges, food banks, individuals) in Halifax. The platform uses AI-powered computer vision for quality assessment, IoT sensor monitoring for food safety, and intelligent matching to facilitate donation and claiming of surplus food.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database (automatically configured in Replit)

### Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Setup**
   The database is automatically configured via Replit's PostgreSQL integration. To seed with demo data:
   ```bash
   npm run db:seed
   ```

3. **Run the Application**
   ```bash
   npm run dev
   ```
   The application will be available at `https://[your-repl-url].repl.co` or `http://localhost:5000`

## Demo Credentials

The platform comes with pre-seeded demo accounts:

| Username | Password | Type | Description |
|----------|----------|------|-------------|
| `hope_food_bank` | `demo123` | Organization | Food bank in downtown Halifax |
| `green_grocers_halifax` | `demo123` | Donor | Grocery store supplier |
| `sarah_baker` | `demo123` | Donor | Local baker supplier |
| `marios_restaurant` | `demo123` | Donor | Restaurant supplier |

## Key Features

### 1. Food Listings & Map View

**Post Food Donations:**
1. Click the **"Post Food"** button in the header or hero section
2. Fill in the form:
   - **Food Title**: Name of the food item
   - **Quantity**: Amount available (e.g., "20 servings")
   - **Location**: Pickup location
   - **Expiry Date**: When the food expires
   - **Upload Image**: (Optional) Photo for AI quality inspection
3. Click **"Post Food"** to submit

**Browse Available Food:**
- **List View**: Grid of food cards showing title, quantity, location, freshness score
- **Map View**: Interactive map with pinned locations of available food
  - Click the **"Map View"** tab in the Available Food section
  - Food bank locations marked with special icons
  - Community fridge locations displayed
  - Active food listings shown on the map

**Claim Food:**
- Click **"Claim Food"** on any listing to reserve it
- Status updates to "Claimed" automatically

### 2. AI Quality Inspection

**Computer Vision Analysis:**
- Upload food images to get instant AI quality assessment
- AI analyzes:
  - Defects detected
  - Color changes
  - Bruising levels
  - Packaging condition
  - Estimated shelf life
  - Overall confidence score

**View Results:**
- Navigate to the AI Quality Inspection section on the homepage
- See sample analysis with visual indicators
- Upload your own photos for real-time analysis

### 3. Top Organizations & Supplier Ratings

**Browse Organizations:**
1. Click **"Top Organizations"** in the navigation or homepage teaser
2. View grid of Halifax NGOs and food banks
3. See verification status and organization types

**View Organization Details:**
1. Click on any organization card
2. See complete information:
   - Organization name, type, and description
   - Contact information (phone, email, website)
   - Location details
   - Verification status

**Supplier Ratings with AI Analysis:**
Each organization page shows a ranked list of trusted suppliers with:
- Overall AI rating (0-5 stars)
- Google review scores
- Food safety certification status
- Reliability and quality metrics
- Total donations and active listings

**View Full AI Analysis:**
1. On any organization detail page, scroll to the supplier roster
2. Click **"View Full AI Analysis"** button on any supplier card
3. Watch the AI animation analyze the supplier in 4 stages:
   - 🧠 Analyzing supplier data...
   - ⭐ Evaluating Google reviews...
   - 🛡️ Verifying food safety certifications...
   - ✨ Calculating reliability metrics...
4. After ~4 seconds, see comprehensive results:
   - **Overall AI Score**: X.X/5.0
   - **Google Reviews**: X.X/5.0
   - **Food Safety**: Certified or Pending
   - **Reliability Score**: X.X/5.0
   - **Quality Score**: X.X/5.0
   - **Certifications**: HACCP, FDA, ISO 22000 badges
   - **AI Reasoning**: Detailed explanation of the rating
   - **Key Factors**: Contributing elements to the score
   - **AI Confidence**: Percentage confidence in the analysis

### 4. IoT Sensor Monitoring

**Real-time Monitoring:**
- View temperature and humidity readings for food storage locations
- Sensors monitor community fridges in real-time
- Status indicators show:
  - Normal: Green (safe storage conditions)
  - Warning: Yellow (borderline conditions)
  - Alert: Red (unsafe conditions)

**Check Sensor Data:**
- Navigate to the homepage
- See the Sensor Monitor Panel showing:
  - Current temperature
  - Current humidity
  - Last update timestamp
  - Status indicator

### 5. Impact Dashboard

**Track Your Impact:**
View community-wide statistics:
- **Meals Provided**: Total meals created from rescued food
- **Pounds Saved**: Weight of food diverted from waste
- **CO₂ Prevented**: Environmental impact in pounds
- **Items Rescued**: Total food listings claimed

**Access the Dashboard:**
- Visible on the homepage below the food listings
- Real-time updates as food is posted and claimed

### 6. AI Chatbot Assistant

**Get Help:**
1. Click the **chat bubble icon** in the header
2. Ask questions about:
   - How to post or claim food
   - Food safety guidelines
   - Best practices for donation
   - Platform features and usage
3. Powered by GPT-4o-mini for intelligent responses
4. Rate limiting: 10 requests per minute per IP

## Navigation Guide

### Main Navigation Menu
- **Find Food**: Browse available food listings with map view
- **Post Food**: Upload new food donations
- **Monitor**: View IoT sensor data (feature page)
- **Impact**: See impact dashboard (feature page)
- **Top Organizations**: View NGOs and their supplier ratings

### Mobile Menu
- Click the **hamburger menu** (☰) on mobile devices
- Access all main navigation features
- Optimized for smaller screens

## Technical Features

### AI-Powered Capabilities
1. **Computer Vision**: Food quality inspection from images
2. **Supplier Analysis**: Multi-factor rating system based on:
   - Google reviews
   - Food safety certifications
   - Reliability metrics
   - Quality scores
   - Donation history
3. **Chatbot**: Conversational AI assistant for user support

### Real-time Features
- WebSocket support for live updates
- IoT sensor data streaming
- Instant food listing updates

### Data Transparency
- All AI ratings include:
  - Detailed reasoning
  - Contributing factors
  - Confidence scores
- Supplier analysis is explainable and auditable

## Database Schema

### Key Tables
- **users**: User accounts (donors, recipients, organizations)
- **foodListings**: Available food donations with AI analysis
- **organizations**: NGOs and food banks
- **supplierRatings**: AI-analyzed ratings for suppliers
- **sensorData**: IoT sensor readings linked to locations

### Data Relationships
- Organizations have many supplier ratings
- Suppliers (users) can have multiple food listings
- Food listings can have associated sensor data
- AI analysis stored in JSONB for flexibility

## API Endpoints

### Food Listings
- `GET /api/food-listings` - Get all available food
- `POST /api/food-listings` - Create new listing
- `PATCH /api/food-listings/:id` - Update listing (claim, etc.)

### Organizations
- `GET /api/organizations` - List all organizations
- `GET /api/organizations/:id` - Get organization with supplier ratings

### Sensor Data
- `GET /api/sensor-data/:listingId` - Get sensor readings for location
- `POST /api/sensor-data` - Create new sensor reading

### AI Features
- `POST /api/detect-food` - Upload image for quality inspection
- `POST /api/chat` - Send message to AI assistant

## Troubleshooting

### Common Issues

**Database Connection:**
- Ensure PostgreSQL is running
- Check `DATABASE_URL` environment variable is set
- Run `npm run db:push` to sync schema

**Missing Seed Data:**
- Run `npm run db:seed` to populate demo organizations and ratings
- Verify 6 organizations and 7 supplier ratings are created

**AI Features Not Working:**
- Check `OPENAI_API_KEY` is configured in secrets
- Rate limit is 10 requests/minute per IP
- Ensure images are under 4MB for quality inspection

**Map Not Showing:**
- Verify food listings have valid latitude/longitude coordinates
- Check browser console for JavaScript errors
- Ensure map component is loaded

## Environment Variables

Required secrets (automatically configured in Replit):
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API for AI features
- `SESSION_SECRET` - Session encryption key

## Security Notes

- All passwords are hashed before storage
- API rate limiting prevents abuse
- Image uploads validated for file type and size
- SQL injection prevention via Drizzle ORM
- CORS configured for same-origin requests

## Support & Feedback

For issues or feature requests:
1. Check this documentation first
2. Use the AI chatbot for quick questions
3. Review the codebase in `replit.md` for technical details

## Development

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express
- **Database**: PostgreSQL + Drizzle ORM
- **UI**: shadcn/ui + Tailwind CSS + Material Design 3
- **AI**: OpenAI GPT-4o-mini
- **Real-time**: WebSockets

### Key Files
- `shared/schema.ts` - Database schema and types
- `server/routes.ts` - API endpoints
- `server/storage.ts` - Data access layer
- `client/src/pages/` - React pages
- `client/src/components/` - Reusable UI components

### Running Tests
```bash
# Run the application
npm run dev

# Database operations
npm run db:push      # Sync schema to database
npm run db:seed      # Populate with demo data
```

## License & Credits

FoodLoop AI - Reducing food waste through AI-powered redistribution.
Built for Halifax communities to connect surplus food with those in need.
