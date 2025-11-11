# Design Guidelines: AI Food Waste Reduction Platform

## Design Approach

**Selected System:** Material Design 3 (Material You)  
**Rationale:** Material Design excels at data-dense applications requiring real-time feedback, status indicators, and complex information hierarchies. Its emphasis on elevation, containment, and state changes perfectly suits our IoT monitoring, quality assessment, and safety-critical workflow needs.

**Core Principles:**
1. **Trust through Clarity** - Food safety is paramount; every quality score, sensor reading, and compliance indicator must be instantly readable
2. **Mobile-First Urgency** - Donors and recipients act quickly; design for rapid posting and claiming on smartphones
3. **Data Transparency** - AI assessments and IoT readings must be presented with confidence scores and visual clarity

---

## Typography

**Font Family:** Inter (via Google Fonts CDN)  
- Primary: Inter (400, 500, 600, 700)
- Monospace: JetBrains Mono for sensor data, timestamps, quality scores

**Hierarchy:**
- **Hero/Page Titles:** text-4xl to text-5xl, font-bold (quality scores, impact metrics)
- **Section Headers:** text-2xl to text-3xl, font-semibold
- **Card Titles:** text-lg, font-semibold
- **Body Text:** text-base, font-normal (food descriptions, instructions)
- **Captions/Metadata:** text-sm, font-medium (timestamps, locations, sensor readings)
- **Data Values:** text-xl to text-3xl, font-bold in monospace (temperature: 38°F, freshness: 94%)

---

## Layout System

**Spacing Primitives:** Tailwind units of **2, 4, 8, 12, 16**  
- Tight spacing: `p-2`, `gap-2` (sensor data chips, status badges)
- Standard spacing: `p-4`, `gap-4` (cards, form fields)
- Section spacing: `p-8`, `py-12` (dashboard sections, list items)
- Large spacing: `p-16`, `py-20` (page sections, hero areas)

**Grid Structure:**
- Mobile: Single column, full-width cards
- Tablet (md:): 2-column grids for food listings, sensor panels
- Desktop (lg:): 3-column food grid, 2-column dashboard layout (main feed + sidebar monitoring panel)

**Container Widths:**
- Map/Listings View: `max-w-7xl` with full-width map option
- Dashboard: `max-w-6xl` 
- Forms: `max-w-2xl`

---

## Component Library

### Navigation
**Top App Bar** (Material Design pattern)
- Fixed header with logo, search bar (NLP-powered), notification bell (real-time alerts), user avatar
- Mobile: Hamburger menu revealing drawer with navigation links
- Desktop: Horizontal nav with "Post Food", "Find Food", "Monitor", "Impact" links

### Core Components

**Food Listing Cards** (Elevated Material cards)
- Photo thumbnail (large, 16:9 ratio)
- Freshness score badge (top-right overlay: "94% Fresh" with AI confidence indicator)
- Food title, quantity, pickup location
- Real-time sensor status chips (temperature, humidity with live indicators)
- Quality assessment tags (AI-detected: "No Defects", "Good Packaging")
- Action button: "Claim Food" or "View Details"

**IoT Monitoring Panel** (Fixed sidebar on desktop, collapsible on mobile)
- Live sensor readings in cards with trend graphs
- Temperature gauge with safe/warning zones
- Humidity meter
- Time since last update
- Alert badges for anomalies

**Visual Inspection Results Display**
- Uploaded photo with AI overlay annotations (defect detection boxes)
- Quality breakdown: Defects (0), Color Change (Low), Bruising (None)
- Compliance checklist with checkmarks/warnings
- Shelf life estimate with countdown timer

**Interactive Map** (Mapbox GL JS)
- Clustered markers for community fridges, food banks, active posts
- Marker icons: food emoji with freshness color intensity
- Info cards on marker click with quick claim button

**Posting Flow** (Stepped form)
- Step 1: Photo upload with instant AI analysis feedback
- Step 2: Food details (quantity, category, dietary tags)
- Step 3: Pickup location and time window
- Step 4: Review with quality score preview
- Camera interface with guides for optimal food photography

**Recipient Dashboard**
- Filter chips: distance radius, dietary preferences, freshness threshold
- Sorted feed of available food (freshness-first algorithm)
- Map/List toggle view
- Save preferences for notification matching

**Impact Dashboard** (Data visualization focus)
- Hero stats: meals provided, pounds saved, CO2 prevented (large, bold numbers)
- Time-series graphs showing waste reduction trends
- Compliance rate indicators
- Leaderboard of top donor locations

**Chat Assistant** (Floating action button)
- Bottom-right FAB opening chat drawer
- AI avatar with typing indicators
- Quick action chips: "How to post?", "Quality guidelines", "Safety info"

### Forms
- Text inputs with floating labels (Material Design pattern)
- Autocomplete for location (Google Places API integration)
- File upload with drag-and-drop zone, thumbnail previews
- Toggle switches for notification preferences
- Segmented buttons for category selection

### Overlays
**Modals:** Food detail view, sensor history, quality report  
**Bottom Sheets:** Quick actions on mobile, filter options  
**Snackbars:** Success confirmations, real-time alerts  
**Tooltips:** Explain AI confidence scores, sensor readings

---

## Icons

**Library:** Material Icons (via Google Fonts CDN)
- Navigation: menu, search, notifications, account_circle
- Food actions: camera_alt, add_photo, check_circle, warning
- Sensors: thermostat, water_drop, schedule
- Map: location_on, directions, map
- Quality: verified, report_problem, science

---

## Images

**Hero Section:** Full-width photo of community fridge being stocked with fresh produce (warm, human-centric)  
**Food Cards:** User-uploaded photos with AI overlay indicators  
**Dashboard:** Iconographic illustrations for empty states (no food nearby, no posts yet)  
**Quality Reports:** Before/after comparison images showing freshness assessment  
**Impact Section:** Infographic-style visuals showing waste reduction metrics

**Hero Buttons:** Blurred glass-morphism backgrounds (backdrop-blur-md with semi-transparent background) for "Post Surplus Food" and "Find Food Nearby" CTAs

---

## Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation for entire posting flow
- Screen reader announcements for real-time sensor updates
- High contrast ratios for sensor warnings/alerts
- Focus indicators on all form inputs
- Alt text for AI-analyzed food photos describing detected items and quality