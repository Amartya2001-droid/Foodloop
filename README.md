# 🌱 FoodLoop AI

**Real-Time AI Platform for Food Waste Reduction**

FoodLoop AI connects food donors with community organizations in Halifax to reduce food waste through intelligent redistribution. Using AI-powered computer vision, IoT monitoring, and smart matching algorithms, we make food donation safer, easier, and more impactful.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue)](https://neon.tech/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-purple)](https://openai.com/)

---

## 📸 Screenshots

### Homepage & Food Listings
![FoodLoop AI Homepage](attached_assets/generated_images/FoodLoop_AI_homepage_hero_cf34cc49.png)
*Browse available food donations with an interactive map showing real-time locations*

### Organizations Directory
![Organizations Page](attached_assets/generated_images/Organizations_list_page_view_3b6e0403.png)
*Discover verified NGOs and food banks across Halifax*

### AI Supplier Analysis
![Supplier Ratings](attached_assets/generated_images/Supplier_ratings_AI_analysis_68f5ad49.png)
*View comprehensive AI-powered supplier ratings based on reviews, certifications, and reliability*

### Real-Time AI Analysis
![AI Analysis Modal](attached_assets/generated_images/AI_analysis_loading_modal_dd394acf.png)
*Watch as AI analyzes supplier data with animated loading stages*

### Impact Dashboard
![Impact Dashboard](attached_assets/generated_images/Impact_metrics_dashboard_view_f6b49ab0.png)
*Track community impact with real-time statistics and visualizations*

---

## ✨ Key Features

### 🤖 AI-Powered Features
- **Computer Vision Quality Inspection**: Upload food images for instant AI quality assessment
- **GPT-4o-mini Chatbot**: Get instant help and recommendations
- **Supplier Intelligence**: AI-generated ratings analyzing Google reviews, certifications, and reliability
- **Animated Analysis**: 4-stage loading sequence showing AI processing in real-time

### 🗺️ Food Distribution
- **Interactive Map**: Real-time view of available food donations across Halifax
- **Smart Matching**: Connects donors with nearby recipients
- **Food Listings**: Post and claim surplus food with detailed descriptions
- **Status Tracking**: Monitor donations from posting to claim

### 🏢 Organization Features
- **Verified Organizations**: Browse 6+ Halifax NGOs and food banks
- **Supplier Roster**: Organizations can view and rate their food suppliers
- **Trust Metrics**: Transparency through AI-calculated reliability scores
- **Comprehensive Profiles**: Contact info, location, and impact statistics

### 📊 Monitoring & Impact
- **IoT Sensor Integration**: Real-time temperature and humidity monitoring
- **Food Safety Tracking**: Ensure donations meet safety standards
- **Impact Dashboard**: Community-wide statistics on food waste reduction
- **Data Transparency**: Track kg saved, active donors, and organization participation

---

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for lightning-fast development
- **Wouter** for lightweight routing
- **TanStack Query** (React Query) for server state management
- **shadcn/ui** + **Radix UI** for accessible components
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Lucide React** for icons

### Backend
- **Node.js** with **Express.js**
- **TypeScript** for type safety
- **Drizzle ORM** for database operations
- **PostgreSQL** (Neon) for data persistence
- **Passport.js** for authentication
- **Multer** for file uploads

### AI & External Services
- **OpenAI GPT-4o-mini** for chatbot and analysis
- **Computer Vision API** for food quality inspection
- **Zod** for schema validation

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20.x or higher
- **PostgreSQL** database (or use Neon serverless)
- **OpenAI API Key**

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd foodloop-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file or set these in your Replit Secrets:
   ```env
   DATABASE_URL=your_postgresql_connection_string
   OPENAI_API_KEY=your_openai_api_key
   SESSION_SECRET=your_random_session_secret
   ```

4. **Initialize the database**
   ```bash
   npm run db:push
   ```

5. **Seed demo data**
   ```bash
   tsx server/seed.ts
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   
   Navigate to `http://localhost:5000`

---

## 👤 Demo Credentials

Try the platform with these pre-configured accounts:

| Username | Password | Role | Description |
|----------|----------|------|-------------|
| `hope_food_bank` | `demo123` | NGO | Hope Food Bank with 4 active listings |
| `green_grocers_halifax` | `demo123` | Supplier | Green Grocers with 3 food donations |
| `sarah_baker` | `demo123` | Supplier | Sarah's Bakery with 2 listings |
| `marios_restaurant` | `demo123` | Supplier | Mario's Restaurant with 3 listings |

---

## 📖 Usage Guide

### For Food Donors

1. **Register/Login** with your credentials
2. **Post Food**: Click "Post Food" and fill in details
3. **Upload Photo**: AI will assess quality (optional)
4. **Add IoT Sensors**: Monitor food safety in real-time (optional)
5. **Track Claims**: See who claimed your donations

### For Organizations (NGOs)

1. **Browse Suppliers**: Visit `/organizations` to see verified NGOs
2. **View Ratings**: Click on any organization to see supplier ratings
3. **AI Analysis**: Click "View Full AI Analysis" on suppliers for comprehensive metrics
4. **Contact Donors**: Use contact info to coordinate pickups

### For Recipients

1. **Explore Map**: View available food donations on the interactive map
2. **Filter Listings**: Browse by food type, location, or quality
3. **Claim Food**: Click "Claim" on any listing
4. **Get Directions**: Use the map to navigate to pickup location

### Using the AI Chatbot

1. Click the **chat icon** in the bottom-right corner
2. Ask questions like:
   - "How do I post food?"
   - "What are the food safety guidelines?"
   - "Find me bakery donations near downtown"
3. Get instant AI-powered responses

---

## 🗂️ Project Structure

```
foodloop-ai/
├── client/                  # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utilities and configurations
│   │   └── hooks/          # Custom React hooks
│   └── index.html
├── server/                  # Backend Express application
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Database abstraction layer
│   ├── seed.ts             # Database seeding script
│   └── vite.ts             # Vite dev server middleware
├── shared/                  # Shared types and schemas
│   └── schema.ts           # Drizzle database schema
├── attached_assets/         # User uploads and generated images
├── INSTRUCTIONS.md          # Detailed feature documentation
└── README.md               # This file
```

---

## 🔌 API Endpoints

### Food Listings
- `GET /api/food-listings` - Get all available food listings
- `POST /api/food-listings` - Create a new listing
- `PATCH /api/food-listings/:id` - Update a listing
- `DELETE /api/food-listings/:id` - Delete a listing

### Organizations
- `GET /api/organizations` - Get all verified organizations
- `GET /api/organizations/:id` - Get organization details with suppliers

### Supplier Ratings
- `GET /api/organizations/:id/suppliers` - Get supplier ratings for an organization
- `POST /api/supplier-ratings` - Create a new supplier rating

### AI Features
- `POST /api/chat` - Send message to AI chatbot (rate-limited)
- `POST /api/analyze-food` - AI quality inspection via image upload

### IoT Monitoring
- `GET /api/sensor-data/:listingId` - Get sensor readings for a listing
- `POST /api/sensor-data` - Log new sensor data

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/user` - Get current user

### Claims
- `POST /api/claims` - Claim a food listing
- `GET /api/donors/:username/listings` - Get donor's listings with claims

---

## 🎨 Design System

FoodLoop AI uses a custom design system built on Material Design 3 principles:

- **Color Palette**: Green primary (sustainability), blue accents (trust)
- **Typography**: Inter for UI, JetBrains Mono for data values
- **Components**: shadcn/ui with custom theming
- **Responsive**: Mobile-first design with breakpoints at 768px and 1024px
- **Dark Mode**: Full theme support (coming soon)

---

## 🔒 Security Features

- **Session-based Authentication**: Secure user sessions with PostgreSQL storage
- **Password Hashing**: bcrypt for password security
- **Rate Limiting**: API protection against abuse (10 req/min for AI endpoints)
- **Input Validation**: Zod schema validation on all inputs
- **CORS Protection**: Configured for production environments
- **SQL Injection Prevention**: Drizzle ORM parameterized queries

---

## 🌟 Unique Features

### AI Supplier Analysis Modal
When viewing an organization's suppliers, click "View Full AI Analysis" to see:
- **Stage 1**: Analyzing supplier data 🧠
- **Stage 2**: Evaluating reviews ⭐
- **Stage 3**: Verifying certifications 🛡️
- **Stage 4**: Calculating reliability ✨

Each stage takes ~1 second with pulsing animations and color-coded progress indicators.

### Real-Time IoT Integration
Monitor food safety with live sensor data:
- **Temperature**: Ensure cold chain compliance
- **Humidity**: Track storage conditions
- **Alerts**: Get notified of safety violations
- **Historical Graphs**: View trends over time

---

## 📊 Database Schema

### Core Tables
- **users** - Donor and recipient accounts
- **food_listings** - Available food donations
- **organizations** - Verified NGOs and food banks
- **supplier_ratings** - AI-generated supplier assessments
- **sensor_data** - IoT monitoring readings
- **claims** - Food claim transactions

See `shared/schema.ts` for complete schema definitions.

---

## 🧪 Testing

The application includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- OrganizationsPage

# Watch mode
npm test -- --watch
```

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use shadcn/ui components when possible
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- **Halifax Regional Municipality** - For supporting food waste reduction initiatives
- **Feed Nova Scotia** - For inspiration and guidance
- **OpenAI** - For GPT-4o-mini API
- **Neon** - For serverless PostgreSQL hosting
- **shadcn** - For the beautiful UI component library

---

## 📞 Contact & Support

- **Documentation**: See [INSTRUCTIONS.md](INSTRUCTIONS.md) for detailed feature guide
- **Issues**: Report bugs via GitHub Issues
- **Email**: support@foodloop.ai (demo)
- **Website**: https://foodloop.replit.app (demo)

---

## 🎯 Roadmap

### Coming Soon
- [ ] Mobile app (React Native)
- [ ] SMS notifications for claims
- [ ] Blockchain donation tracking
- [ ] Multi-city expansion
- [ ] Volunteer coordination
- [ ] Donation tax receipts
- [ ] Advanced analytics dashboard
- [ ] Integration with food banks' existing systems

---

## 💡 Why FoodLoop AI?

Every year, **40% of food produced is wasted** while millions face food insecurity. FoodLoop AI bridges this gap by:

✅ Making food donation as easy as posting on social media  
✅ Building trust through AI-powered quality verification  
✅ Ensuring food safety with IoT monitoring  
✅ Connecting donors with vetted organizations  
✅ Providing transparency through impact metrics  

**Together, we can create a zero-waste future.** 🌍

---

Made with ❤️ in Halifax, Nova Scotia
