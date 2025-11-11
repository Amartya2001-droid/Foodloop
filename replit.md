# FoodLoop AI - Food Waste Reduction Platform

## Overview

FoodLoop AI is a real-time platform that connects food donors with recipients to reduce food waste through intelligent redistribution. The application uses AI-powered computer vision for quality assessment, IoT sensor monitoring for food safety, and an intelligent matching system to facilitate the donation and claiming of surplus food. The platform emphasizes food safety, mobile-first design, and data transparency to build trust between donors and recipients.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript running on Vite

**UI Component System**: 
- shadcn/ui components built on Radix UI primitives
- Material Design 3 principles for data-dense interfaces
- Tailwind CSS for styling with custom design tokens
- Component library emphasizes elevation, containment, and state feedback

**Routing**: 
- Wouter for lightweight client-side routing
- Main routes: HomePage (/) and MapPage (/map)

**State Management**:
- TanStack Query (React Query) for server state and API data fetching
- Local component state via React hooks
- Custom hooks for mobile responsiveness and UI interactions

**Key Design Decisions**:
- Mobile-first responsive design with breakpoints at md: (768px) and lg: (1024px)
- Custom typography using Inter for UI and JetBrains Mono for data values
- Material Icons integration for consistent iconography
- Theme system supporting light/dark modes with CSS variables

### Backend Architecture

**Runtime**: Node.js with Express.js

**API Design**:
- RESTful API endpoints under `/api` prefix
- Express middleware for request logging and error handling
- Multer for file upload handling (food images)
- Session-based architecture setup (connect-pg-simple integration)

**Key Routes**:
- Food listings CRUD operations
- Sensor data endpoints
- AI chat assistant endpoint with OpenAI integration
- Image upload and processing

**Development Environment**:
- Vite dev server in middleware mode for HMR
- Replit-specific plugins for development experience
- Custom logging with timestamp formatting

### Data Architecture

**ORM**: Drizzle ORM with PostgreSQL dialect

**Database Schema**:
- `users` table: Authentication and user management
- `food_listings` table: Core food donation records with location, quality scores, AI analysis, and status tracking
- `sensor_data` table: IoT sensor readings (temperature, humidity) linked to listings

**Key Features**:
- UUID primary keys with database-generated defaults
- JSONB storage for flexible AI analysis data
- Timestamp tracking for creation and sensor readings
- Status field for listing lifecycle management (available, claimed)
- Geolocation support with latitude/longitude fields

**Schema Validation**: Zod schemas derived from Drizzle tables for runtime validation

### External Dependencies

**Database**: 
- Neon PostgreSQL (serverless)
- WebSocket support for real-time connections
- Connection pooling via @neondatabase/serverless

**AI Services**:
- OpenAI API for chat assistant functionality
- Computer vision integration for food quality inspection
- Rate limiting implemented (10 requests per minute per IP)

**Third-party UI Libraries**:
- Radix UI for accessible component primitives
- Lucide React for additional icons
- date-fns for date manipulation
- cmdk for command palette functionality

**Development Tools**:
- ESBuild for production builds
- TypeScript for type safety
- Drizzle Kit for database migrations

**Image Handling**:
- Multer for multipart form uploads
- Static asset serving via Express
- Generated images stored in attached_assets directory

**Key Architectural Patterns**:
- Storage abstraction layer (IStorage interface) allowing for memory or database implementations
- Lazy initialization pattern for OpenAI client
- Type-safe API layer with shared schema definitions
- Middleware pattern for request processing and logging
- Component composition with shadcn/ui design system