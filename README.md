# Sales Appointment Scheduler - MVP

An intelligent appointment scheduling system based on geographic proximity and sales rep availability.

## 🚀 Development Environment Setup

### Prerequisites
- ✅ Node.js v22.17.0 (v18+ required)
- ✅ npm 10.9.2

### Technology Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui
- **Maps:** Leaflet.js + React-Leaflet
- **Date Handling:** date-fns
- **Icons:** Lucide React

### Project Structure
```
wusa_scheduler/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Main booking interface
│   ├── availability/      # Rep availability manager
│   ├── map/               # Geographic visualization
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── booking/          # Booking flow components
│   ├── availability/     # Rep management components
│   ├── map/              # Map visualization components
│   └── ui/               # shadcn/ui components
├── lib/                   # Core logic & utilities
│   ├── availability.ts   # Scheduling algorithm
│   ├── distance.ts       # Haversine calculations
│   ├── geocoding.ts      # Address geocoding
│   └── utils.ts          # Helper functions
├── data/                  # JSON data files
│   ├── reps.json         # Sales rep profiles
│   ├── appointments.json # Scheduled appointments
│   ├── availability.json # Weekly availability templates
│   └── zipcodes.json     # Service area zip codes
└── types/                 # TypeScript interfaces
    └── index.ts
```

## 📦 Installation

Dependencies are already installed. To reinstall:

```bash
npm install
```

## 🏃 Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Build

```bash
npm run build
npm start
```

## ✅ Completed Features

### Core Functionality
- ✅ Address search and geocoding (approximate)
- ✅ Availability calculation algorithm with anchor points
- ✅ 5-day calendar view with time slots (10am, 2pm, 7pm)
- ✅ Booking modal and confirmation
- ✅ Rep availability manager page
- ✅ Interactive map visualization with Leaflet

### Data Files
- ✅ `data/reps.json` - 98 sales reps with geocoded addresses
- ✅ `data/availability.json` - Weekly availability templates
- ✅ `data/appointments.json` - Sample appointments

### Pages
- ✅ `/` - Main booking interface
- ✅ `/availability` - Rep availability management
- ✅ `/map` - Geographic coverage visualization

## 🎯 How to Use

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Book an appointment:**
   - Go to the home page
   - Enter a customer address (street, city, state, zip)
   - Click "Find Available Times"
   - Select an available time slot
   - Fill in customer details and confirm booking

3. **View rep availability:**
   - Navigate to `/availability`
   - See all reps with their schedules and upcoming appointments

4. **View geographic coverage:**
   - Navigate to `/map`
   - Select a date and time slot
   - Optionally enter a customer address to see coverage
   - See rep locations, service radii, and appointments on the map

## 📝 Notes

- All data is stored in JSON files (no database for MVP)
- Uses Haversine formula for distance calculations (no API needed)
- Leaflet.js for maps (no API key required)
- Ready for Vercel deployment

## 🔗 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Leaflet.js Documentation](https://leafletjs.com)
- [MVP Plan](./sales-scheduler-mvp-plan.md)

