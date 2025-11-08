'use client';

import { Suspense } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { useIsAdmin } from '@/lib/use-admin';
import { Card } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

function DocumentationContent() {
  const { isLoaded, isSignedIn } = useUser();
  const isAdmin = useIsAdmin();
  const router = useRouter();

  // Redirect if not signed in
  if (isLoaded && !isSignedIn) {
    router.push('/sign-in');
    return null;
  }

  // Redirect if not admin
  if (isLoaded && isSignedIn && !isAdmin) {
    router.push('/');
    return null;
  }

  if (!isLoaded) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-navy/10 rounded-lg">
              <BookOpen className="h-6 w-6 text-navy" />
            </div>
            <h1 className="text-3xl font-bold text-navy">Developer Documentation</h1>
          </div>
          <p className="text-gray-600 text-lg">Comprehensive guide to the Windows USA Scheduler application</p>
        </div>

        <Card className="p-8 bg-white">
          <div className="prose prose-lg max-w-none">
            <DocumentationMarkdown />
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

function DocumentationMarkdown() {
  return (
    <div className="space-y-8">
      {/* Table of Contents */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-bold text-navy mb-4">Table of Contents</h2>
        <ul className="space-y-2 text-sm">
          <li><a href="#overview" className="text-navy hover:underline">1. Overview</a></li>
          <li><a href="#tech-stack" className="text-navy hover:underline">2. Technology Stack</a></li>
          <li><a href="#architecture" className="text-navy hover:underline">3. System Architecture</a></li>
          <li><a href="#data-structures" className="text-navy hover:underline">4. Data Structures</a></li>
          <li><a href="#features" className="text-navy hover:underline">5. Features & Functionality</a></li>
          <li><a href="#algorithms" className="text-navy hover:underline">6. Algorithms & Calculations</a></li>
          <li><a href="#components" className="text-navy hover:underline">7. Components</a></li>
          <li><a href="#apis" className="text-navy hover:underline">8. APIs & Data Sources</a></li>
          <li><a href="#authentication" className="text-navy hover:underline">9. Authentication & Authorization</a></li>
          <li><a href="#deployment" className="text-navy hover:underline">10. Deployment & Configuration</a></li>
        </ul>
      </div>

      {/* Overview */}
      <section id="overview" className="scroll-mt-8">
        <h2 className="text-2xl font-bold text-navy mb-4">1. Overview</h2>
        <p className="mb-4">
          The Windows USA Scheduler is an intelligent appointment scheduling system designed for in-home sales appointments. 
          It uses geographic proximity algorithms to match customers with available sales representatives based on location, 
          availability, and routing efficiency.
        </p>
        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">Purpose</h3>
        <p className="mb-4">
          The system aggregates capacity across multiple sales reps to show available time slots without requiring customers 
          to select specific representatives. It automatically assigns the closest available rep when an appointment is booked.
        </p>
        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">Key Capabilities</h3>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li>Address-based availability search with geocoding</li>
          <li>5-day calendar view with three time slots per day (10am, 2pm, 7pm)</li>
          <li>Intelligent rep assignment using anchor point routing</li>
          <li>Interactive map visualization with Leaflet.js</li>
          <li>Rep availability management interface</li>
          <li>Serviceable zip code management</li>
          <li>Lead demographics and filtering</li>
          <li>Admin-only settings and configuration</li>
        </ul>
      </section>

      {/* Technology Stack */}
      <section id="tech-stack" className="scroll-mt-8">
        <h2 className="text-2xl font-bold text-navy mb-4">2. Technology Stack</h2>
        
        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">Core Framework</h3>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><strong>Next.js 14+</strong> - React framework with App Router for server-side rendering and routing</li>
          <li><strong>React 18.2.0</strong> - UI library with hooks and component-based architecture</li>
          <li><strong>TypeScript 5.0+</strong> - Type-safe JavaScript with static type checking</li>
        </ul>

        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">Styling & UI</h3>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><strong>Tailwind CSS 3.3.0</strong> - Utility-first CSS framework for styling</li>
          <li><strong>shadcn/ui</strong> - Pre-built accessible React components (Button, Card, Dialog, Input, Select, etc.)</li>
          <li><strong>Radix UI</strong> - Headless UI primitives (Checkbox, Dialog, Label, Select, Slot)</li>
          <li><strong>Lucide React</strong> - Icon library with 1000+ icons</li>
          <li><strong>class-variance-authority</strong> - For component variant management</li>
          <li><strong>clsx & tailwind-merge</strong> - Utility functions for conditional class names</li>
        </ul>

        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">Maps & Geocoding</h3>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><strong>Leaflet 1.9.4</strong> - Open-source JavaScript library for interactive maps</li>
          <li><strong>React-Leaflet 4.2.1</strong> - React components for Leaflet maps</li>
          <li><strong>Google Maps API</strong> (Optional) - For address autocomplete and geocoding</li>
        </ul>

        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">Date & Time</h3>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><strong>date-fns 2.30.0</strong> - Modern JavaScript date utility library for date formatting and manipulation</li>
        </ul>

        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">Authentication</h3>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><strong>Clerk 6.34.4</strong> - Complete authentication and user management solution with organization support</li>
        </ul>

        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">Development Tools</h3>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><strong>ESLint</strong> - Code linting and quality checks</li>
          <li><strong>PostCSS & Autoprefixer</strong> - CSS processing and vendor prefixing</li>
          <li><strong>TypeScript Compiler</strong> - Type checking and compilation</li>
        </ul>
      </section>

      {/* System Architecture */}
      <section id="architecture" className="scroll-mt-8">
        <h2 className="text-2xl font-bold text-navy mb-4">3. System Architecture</h2>
        
        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">Project Structure</h3>
        <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm mb-4">
{`wusa_scheduler/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                 # Main booking interface (/)
│   ├── layout.tsx               # Root layout with Clerk provider
│   ├── globals.css              # Global styles and Tailwind imports
│   ├── appointments/            # Appointments list page
│   │   └── page.tsx
│   ├── availability/            # Rep availability management
│   │   └── page.tsx
│   ├── map/                     # Geographic visualization
│   │   └── page.tsx
│   ├── serviceable-zips/        # Zip code management
│   │   └── page.tsx
│   ├── zip-demographics/        # Census demographics
│   │   └── page.tsx
│   ├── settings/                # Admin settings (admin only)
│   │   └── page.tsx
│   ├── documentation/           # Developer docs (admin only)
│   │   └── page.tsx
│   ├── sign-in/                 # Clerk sign-in page
│   │   └── [[...sign-in]]/
│   ├── sign-up/                 # Clerk sign-up page
│   │   └── [[...sign-up]]/
│   └── api/                     # API routes
│       └── appointments/
│           └── route.ts         # GET/POST appointments
├── components/                   # React components
│   ├── booking/                 # Booking flow components
│   │   ├── AddressSearch.tsx   # Address input with autocomplete
│   │   ├── AvailabilityGrid.tsx # 5-day calendar grid
│   │   ├── SlotCard.tsx         # Individual time slot card
│   │   ├── BookingModal.tsx    # Booking confirmation modal
│   │   ├── CustomerInfoForm.tsx # Customer details form
│   │   ├── EnhancedScheduleMap.tsx # Map with routing
│   │   ├── AddressMap.tsx      # Address visualization
│   │   └── CensusStats.tsx     # Demographics display
│   ├── layout/                  # Layout components
│   │   ├── AppLayout.tsx        # Main app layout wrapper
│   │   └── Sidebar.tsx          # Navigation sidebar
│   ├── map/                     # Map page components
│   │   ├── MapPageView.tsx      # Main map view
│   │   └── ScheduleMap.tsx      # Schedule map component
│   └── ui/                      # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── checkbox.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       └── textarea.tsx
├── lib/                          # Core logic & utilities
│   ├── availability.ts          # Scheduling algorithm
│   ├── distance.ts              # Haversine distance calculations
│   ├── geocoding.ts             # Address geocoding utilities
│   ├── data-loader.ts           # Data loading functions
│   ├── serviceable-zips.ts      # Zip code management
│   ├── map-settings.ts          # Map visibility settings
│   ├── use-admin.ts             # Admin check hook
│   ├── auth.ts                  # Server-side auth utilities
│   └── utils.ts                 # General utilities
├── types/                        # TypeScript type definitions
│   ├── index.ts                 # Main type definitions
│   └── serviceable-zips.ts      # Zip code types
├── data/                         # JSON data files (source)
│   ├── reps.json                # Sales rep profiles
│   ├── appointments.json        # Scheduled appointments
│   ├── availability.json        # Weekly availability templates
│   ├── leads.json               # Lead data
│   └── serviceable-zips.json    # Serviceable zip codes
├── public/                       # Static assets
│   ├── data/                    # Public JSON data (served to client)
│   │   ├── appointments.json
│   │   ├── availability.json
│   │   ├── leads.json
│   │   ├── reps.json
│   │   └── serviceable-zips.json
│   └── windowsusa-logo.png      # Company logo
├── scripts/                      # Data generation scripts
│   ├── generate-appointments.js
│   ├── generate-leads.js
│   ├── generate-zip-codes.js
│   └── process-csv.js
├── middleware.ts                 # Next.js middleware (Clerk auth)
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.ts            # Tailwind CSS configuration
└── next.config.js                # Next.js configuration`}
        </pre>

        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">Data Flow</h3>
        <ol className="list-decimal pl-6 space-y-2 mb-4">
          <li><strong>User Input:</strong> Customer enters address on booking page</li>
          <li><strong>Geocoding:</strong> Address is converted to lat/lng coordinates (Google Maps API or manual parsing)</li>
          <li><strong>Availability Calculation:</strong> System checks all reps for each time slot:
            <ul className="list-disc pl-6 mt-2">
              <li>Checks if rep is available on that day/time</li>
              <li>Checks for appointment conflicts</li>
              <li>Calculates anchor point (home, previous appointment, or next appointment)</li>
              <li>Calculates distance from anchor to customer using Haversine formula</li>
              <li>Verifies customer is within 60-mile drive radius</li>
            </ul>
          </li>
          <li><strong>Aggregation:</strong> Results are aggregated to show total available reps per slot</li>
          <li><strong>Display:</strong> Calendar grid shows availability status (good/limited/none)</li>
          <li><strong>Booking:</strong> When customer selects a slot, closest rep is auto-assigned</li>
          <li><strong>Persistence:</strong> Appointment is saved to JSON file via API route</li>
        </ol>
      </section>

      {/* Data Structures */}
      <section id="data-structures" className="scroll-mt-8">
        <h2 className="text-2xl font-bold text-navy mb-4">4. Data Structures</h2>
        
        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">Core Types</h3>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h4 className="font-semibold text-navy mb-2">Address</h4>
          <pre className="text-sm overflow-x-auto">
{`interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  lat: number;    // Latitude coordinate
  lng: number;    // Longitude coordinate
}`}
          </pre>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h4 className="font-semibold text-navy mb-2">SalesRep</h4>
          <pre className="text-sm overflow-x-auto">
{`interface SalesRep {
  id: string;                    // Unique rep identifier
  name: string;                  // Full name
  email: string;                  // Email address
  phone: string;                  // Phone number
  startingAddress: Address;      // Home/base address
  color: string;                 // Hex color for map visualization
  successScore?: number;         // Optional success score (1-100)
}`}
          </pre>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h4 className="font-semibold text-navy mb-2">Availability</h4>
          <pre className="text-sm overflow-x-auto">
{`interface Availability {
  [repId: string]: {
    monday: TimeSlot[];
    tuesday: TimeSlot[];
    wednesday: TimeSlot[];
    thursday: TimeSlot[];
    friday: TimeSlot[];
    saturday: TimeSlot[];
    sunday: TimeSlot[];
  };
}

type TimeSlot = '10am' | '2pm' | '7pm';`}
          </pre>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h4 className="font-semibold text-navy mb-2">Appointment</h4>
          <pre className="text-sm overflow-x-auto">
{`interface Appointment {
  id: string;                    // Unique appointment ID
  repId?: string;                 // Assigned rep (optional until booked)
  date: string;                   // ISO format: 'YYYY-MM-DD'
  timeSlot: TimeSlot;            // '10am' | '2pm' | '7pm'
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  leadId?: string;                // Link to lead if from Salesforce
  address: Address;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;             // ISO timestamp
}`}
          </pre>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h4 className="font-semibold text-navy mb-2">Lead</h4>
          <pre className="text-sm overflow-x-auto">
{`interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: Address;
  repId?: string;                 // Assigned rep if converted
  status?: 'new' | 'contacted' | 'qualified' | 'converted';
  createdAt: string;
  faradayCreditPropensity?: number;  // 1-100 credit score
  thinkUnlimitedScore?: 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
  efScore?: number;               // 0, 1, or range 640-800
}`}
          </pre>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h4 className="font-semibold text-navy mb-2">SlotAvailability</h4>
          <pre className="text-sm overflow-x-auto">
{`interface SlotAvailability {
  date: string;                   // ISO date string
  timeSlot: TimeSlot;
  availableCount: number;         // Number of available reps
  availableReps: AvailableRep[];  // List of available reps with distances
  status: 'good' | 'limited' | 'none';
}

interface AvailableRep {
  repId: string;
  repName: string;
  distance: number;              // Distance in miles
  anchorPoint: AnchorPoint;       // Starting point for this appointment
}

interface AnchorPoint {
  lat: number;
  lng: number;
  source: 'home' | 'previous-appointment' | 'next-appointment';
  address: Address;
}`}
          </pre>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-8">
        <h2 className="text-2xl font-bold text-navy mb-4">5. Features & Functionality</h2>
        
        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">5.1 Main Booking Page (/)</h3>
        <p className="mb-4">
          The primary interface for customers to book appointments. Features include:
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><strong>Address Search:</strong> Single-line address input with Google Maps autocomplete (if API key configured)</li>
          <li><strong>URL Parameter Support:</strong> Accepts pre-filled customer data via URL params for Salesforce integration</li>
          <li><strong>Availability Grid:</strong> 5-day calendar showing three time slots per day (10am, 2pm, 7pm)</li>
          <li><strong>Week Navigation:</strong> Navigate between weeks to see future availability</li>
          <li><strong>Slot Status Indicators:</strong> Visual indicators for availability (good/limited/none)</li>
          <li><strong>Interactive Map:</strong> Shows customer address, rep locations, and service radii</li>
          <li><strong>Booking Modal:</strong> Customer information form with validation</li>
          <li><strong>Census Statistics:</strong> Displays demographic data for customer&apos;s zip code</li>
        </ul>

        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">5.2 Map Page (/map)</h3>
        <p className="mb-4">
          Geographic visualization of sales coverage, appointments, and leads. Features include:
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><strong>Date/Time Selection:</strong> Filter map view by specific date and time slot</li>
          <li><strong>Rep Visualization:</strong> Shows all sales reps with color-coded markers</li>
          <li><strong>Service Radii:</strong> 60-mile drive radius circles around each rep</li>
          <li><strong>Appointment Markers:</strong> Displays scheduled appointments on the map</li>
          <li><strong>Lead Filtering:</strong> Filter leads by EF score (640+, 1, 0) and creation date</li>
          <li><strong>Admin vs Member Views:</strong> Admins see all leads; members see filtered view based on settings</li>
          <li><strong>Lead Details:</strong> Click on lead markers to see customer information and scores</li>
          <li><strong>Address Search:</strong> Optional customer address input to see coverage for specific location</li>
        </ul>

        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">5.3 Rep Availability Page (/availability)</h3>
        <p className="mb-4">
          Management interface for viewing and managing sales rep schedules. Features include:
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><strong>Rep List:</strong> View all sales representatives</li>
          <li><strong>Weekly Schedule:</strong> See each rep&apos;s availability for each day of the week</li>
          <li><strong>Time Slot Toggles:</strong> Enable/disable specific time slots for each rep</li>
          <li><strong>Appointment List:</strong> View all upcoming appointments for each rep</li>
          <li><strong>Rep Details:</strong> View rep contact information and base address</li>
        </ul>

        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">5.4 Appointments Page (/appointments)</h3>
        <p className="mb-4">
          List view of all scheduled appointments. Features include:
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><strong>Appointment List:</strong> Chronological list of all appointments</li>
          <li><strong>Status Filtering:</strong> Filter by status (scheduled/completed/cancelled)</li>
          <li><strong>Rep Assignment:</strong> See which rep is assigned to each appointment</li>
          <li><strong>Customer Information:</strong> View customer details and address</li>
          <li><strong>Date Navigation:</strong> Filter appointments by date range</li>
        </ul>

        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">5.5 Serviceable Zip Codes Page (/serviceable-zips)</h3>
        <p className="mb-4">
          Management interface for serviceable zip codes. Features include:
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><strong>Zip Code List:</strong> View all serviceable zip codes</li>
          <li><strong>Search & Filter:</strong> Search zip codes by code, city, or state</li>
          <li><strong>Exclusion Management:</strong> Mark zip codes as excluded from service</li>
          <li><strong>Notes:</strong> Add notes to zip codes for reference</li>
          <li><strong>Bulk Operations:</strong> Import/export zip code lists</li>
        </ul>

        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">5.6 Zip Demographics Page (/zip-demographics)</h3>
        <p className="mb-4">
          View census demographic data for zip codes. Features include:
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><strong>Demographic Data:</strong> Census statistics for zip codes</li>
          <li><strong>Search:</strong> Search by zip code to view demographics</li>
          <li><strong>Data Display:</strong> Population, income, housing, and other census variables</li>
        </ul>

        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">5.7 Settings Page (/settings) - Admin Only</h3>
        <p className="mb-4">
          Administrative settings for configuring application defaults. Features include:
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><strong>Map Visibility Settings:</strong> Configure default lead filters for non-admin users</li>
          <li><strong>EF Score Filters:</strong> Set default EF score filters (640+, 1, 0)</li>
          <li><strong>Days Ago Filter:</strong> Set default date range for lead filtering</li>
          <li><strong>User Management:</strong> Placeholder for future user management features</li>
        </ul>
      </section>

      {/* Algorithms */}
      <section id="algorithms" className="scroll-mt-8">
        <h2 className="text-2xl font-bold text-navy mb-4">6. Algorithms & Calculations</h2>
        
        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">6.1 Haversine Distance Calculation</h3>
        <p className="mb-4">
          The system uses the Haversine formula to calculate the great-circle distance between two points on Earth. 
          This is used to determine if a customer is within a rep&apos;s service radius.
        </p>
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <pre className="text-sm overflow-x-auto">
{`function calculateDistance(lat1, lng1, lat2, lng2): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
    Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in miles
}`}
          </pre>
        </div>
        <p className="mb-4">
          <strong>Key Constants:</strong>
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><strong>R = 3959 miles:</strong> Earth&apos;s mean radius in miles</li>
          <li><strong>Drive Radius:</strong> 60 miles - Maximum distance a rep can travel for an appointment</li>
        </ul>

        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">6.2 Anchor Point Calculation</h3>
        <p className="mb-4">
          The anchor point algorithm determines where a rep will start their journey to a customer&apos;s appointment. 
          This optimizes routing by considering existing appointments on the same day.
        </p>
        <p className="mb-4">
          <strong>Priority Order:</strong>
        </p>
        <ol className="list-decimal pl-6 space-y-2 mb-4">
          <li><strong>Previous Appointment:</strong> If rep has an earlier appointment on the same day, use that location as the anchor point</li>
          <li><strong>Next Appointment:</strong> If no earlier appointment, use the next appointment&apos;s location</li>
          <li><strong>Home Address:</strong> If no appointments on that day, use rep&apos;s home/base address</li>
        </ol>
        <p className="mb-4">
          This ensures reps can efficiently route between multiple appointments in a single day, reducing travel time 
          and maximizing the number of appointments they can handle.
        </p>

        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">6.3 Availability Calculation Algorithm</h3>
        <p className="mb-4">
          For each time slot, the system checks all sales reps to determine availability:
        </p>
        <ol className="list-decimal pl-6 space-y-2 mb-4">
          <li><strong>Day/Time Availability Check:</strong> Verify rep has this day/time slot in their weekly availability</li>
          <li><strong>Conflict Check:</strong> Check if rep already has an appointment at this exact date/time</li>
          <li><strong>Anchor Point Calculation:</strong> Determine rep&apos;s starting point for this appointment</li>
          <li><strong>Distance Calculation:</strong> Calculate distance from anchor point to customer address</li>
          <li><strong>Radius Check:</strong> Verify customer is within 60-mile drive radius</li>
          <li><strong>Aggregation:</strong> Count total available reps and determine status:
            <ul className="list-disc pl-6 mt-2">
              <li><strong>Good:</strong> 3+ available reps</li>
              <li><strong>Limited:</strong> 1-2 available reps</li>
              <li><strong>None:</strong> 0 available reps</li>
            </ul>
          </li>
        </ol>

        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">6.4 Rep Assignment Algorithm</h3>
        <p className="mb-4">
          When a customer books an appointment, the system automatically assigns the closest available rep:
        </p>
        <ol className="list-decimal pl-6 space-y-2 mb-4">
          <li>Get list of available reps for the selected time slot</li>
          <li>Sort reps by distance (closest first)</li>
          <li>Assign the first rep (closest) to the appointment</li>
          <li>Create appointment record with assigned repId</li>
        </ol>

        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">6.5 Time Slot Ordering</h3>
        <p className="mb-4">
          Time slots are ordered numerically for comparison:
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><strong>10am:</strong> Order 1 (earliest)</li>
          <li><strong>2pm:</strong> Order 2 (middle)</li>
          <li><strong>7pm:</strong> Order 3 (latest)</li>
        </ul>
        <p className="mb-4">
          This ordering is used to determine &quot;earlier&quot; and &quot;later&quot; appointments when calculating anchor points.
        </p>
      </section>

      {/* Components */}
      <section id="components" className="scroll-mt-8">
        <h2 className="text-2xl font-bold text-navy mb-4">7. Components</h2>
        
        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">7.1 Booking Components</h3>
        
        <div className="mb-4">
          <h4 className="font-semibold text-navy mb-2">AddressSearch</h4>
          <p className="mb-2">Single-line address input with Google Maps autocomplete support.</p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li><strong>Props:</strong> value, onChange, onSelect</li>
            <li><strong>Features:</strong> Google Places autocomplete, manual address parsing, URL parameter support</li>
          </ul>
        </div>

        <div className="mb-4">
          <h4 className="font-semibold text-navy mb-2">AvailabilityGrid</h4>
          <p className="mb-2">5-day calendar grid displaying time slot availability.</p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li><strong>Props:</strong> availability, onSlotSelect, weekOffset, onWeekChange</li>
            <li><strong>Features:</strong> Week navigation, slot status indicators, responsive grid layout</li>
          </ul>
        </div>

        <div className="mb-4">
          <h4 className="font-semibold text-navy mb-2">SlotCard</h4>
          <p className="mb-2">Individual time slot card showing availability status.</p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li><strong>Props:</strong> slot, onSelect, isSelected</li>
            <li><strong>Features:</strong> Status badges (good/limited/none), rep count display, click handling</li>
          </ul>
        </div>

        <div className="mb-4">
          <h4 className="font-semibold text-navy mb-2">BookingModal</h4>
          <p className="mb-2">Modal dialog for booking confirmation and customer information.</p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li><strong>Props:</strong> slot, customerAddress, isOpen, onClose, onConfirm</li>
            <li><strong>Features:</strong> Customer info form, validation, appointment creation</li>
          </ul>
        </div>

        <div className="mb-4">
          <h4 className="font-semibold text-navy mb-2">CustomerInfoForm</h4>
          <p className="mb-2">Form for collecting customer information during booking.</p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li><strong>Props:</strong> initialData, onSubmit, onCancel</li>
            <li><strong>Features:</strong> Name, email, phone inputs, URL parameter pre-fill, validation</li>
          </ul>
        </div>

        <div className="mb-4">
          <h4 className="font-semibold text-navy mb-2">EnhancedScheduleMap</h4>
          <p className="mb-2">Interactive map showing customer address, rep locations, and service radii.</p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li><strong>Props:</strong> customerAddress, reps, appointments, selectedSlot</li>
            <li><strong>Features:</strong> Leaflet map, rep markers, service radius circles, appointment markers</li>
          </ul>
        </div>

        <div className="mb-4">
          <h4 className="font-semibold text-navy mb-2">CensusStats</h4>
          <p className="mb-2">Displays census demographic data for a zip code.</p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li><strong>Props:</strong> zipCode</li>
            <li><strong>Features:</strong> Census data fetching, demographic statistics display</li>
          </ul>
        </div>

        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">7.2 Layout Components</h3>
        
        <div className="mb-4">
          <h4 className="font-semibold text-navy mb-2">AppLayout</h4>
          <p className="mb-2">Main layout wrapper providing sidebar and content area.</p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li><strong>Props:</strong> children</li>
            <li><strong>Features:</strong> Sidebar integration, responsive layout, content area</li>
          </ul>
        </div>

        <div className="mb-4">
          <h4 className="font-semibold text-navy mb-2">Sidebar</h4>
          <p className="mb-2">Navigation sidebar with menu items and user info.</p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li><strong>Features:</strong> Navigation links, user authentication display, admin-only links, sign out</li>
            <li><strong>Admin Links:</strong> Documentation, Settings (only visible to Windows USA org admins)</li>
          </ul>
        </div>

        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">7.3 Map Components</h3>
        
        <div className="mb-4">
          <h4 className="font-semibold text-navy mb-2">MapPageView</h4>
          <p className="mb-2">Main map page component with filtering and controls.</p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li><strong>Features:</strong> Date/time selection, lead filtering, rep visualization, appointment display</li>
          </ul>
        </div>

        <div className="mb-4">
          <h4 className="font-semibold text-navy mb-2">ScheduleMap</h4>
          <p className="mb-2">Leaflet map component for schedule visualization.</p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li><strong>Features:</strong> Rep markers, service radii, appointment markers, lead markers</li>
          </ul>
        </div>
      </section>

      {/* APIs */}
      <section id="apis" className="scroll-mt-8">
        <h2 className="text-2xl font-bold text-navy mb-4">8. APIs & Data Sources</h2>
        
        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">8.1 Internal API Routes</h3>
        
        <div className="mb-4">
          <h4 className="font-semibold text-navy mb-2">GET /api/appointments</h4>
          <p className="mb-2">Retrieves all appointments from the JSON file.</p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li><strong>Method:</strong> GET</li>
            <li><strong>Response:</strong> Array of Appointment objects</li>
            <li><strong>Data Source:</strong> public/data/appointments.json</li>
          </ul>
        </div>

        <div className="mb-4">
          <h4 className="font-semibold text-navy mb-2">POST /api/appointments</h4>
          <p className="mb-2">Creates a new appointment and saves it to the JSON file.</p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li><strong>Method:</strong> POST</li>
            <li><strong>Body:</strong> Appointment object</li>
            <li><strong>Response:</strong> {`{ success: true, appointment: Appointment }`}</li>
            <li><strong>Data Storage:</strong> public/data/appointments.json</li>
          </ul>
        </div>

        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">8.2 External APIs</h3>
        
        <div className="mb-4">
          <h4 className="font-semibold text-navy mb-2">Google Maps API (Optional)</h4>
          <p className="mb-2">Used for address autocomplete and geocoding.</p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li><strong>Services:</strong> Places API (autocomplete), Geocoding API</li>
            <li><strong>Configuration:</strong> NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable</li>
            <li><strong>Fallback:</strong> Manual address parsing if API key not configured</li>
          </ul>
        </div>

        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">8.3 Data Sources</h3>
        
        <div className="mb-4">
          <h4 className="font-semibold text-navy mb-2">JSON Data Files</h4>
          <p className="mb-2">All data is stored in JSON files in the public/data directory:</p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li><strong>reps.json:</strong> Sales rep profiles with addresses and contact info</li>
            <li><strong>appointments.json:</strong> All scheduled appointments</li>
            <li><strong>availability.json:</strong> Weekly availability templates for each rep</li>
            <li><strong>leads.json:</strong> Lead data with scores and demographics</li>
            <li><strong>serviceable-zips.json:</strong> List of serviceable zip codes with metadata</li>
          </ul>
        </div>

        <div className="mb-4">
          <h4 className="font-semibold text-navy mb-2">Census Data</h4>
          <p className="mb-2">Demographic data for zip codes (see CENSUS_VARIABLES.md for details).</p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li><strong>Source:</strong> U.S. Census Bureau data</li>
            <li><strong>Variables:</strong> Population, income, housing, education, etc.</li>
            <li><strong>Usage:</strong> Displayed on booking page and zip demographics page</li>
          </ul>
        </div>

        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">8.4 Data Loading</h3>
        <p className="mb-4">
          Data is loaded client-side using the data-loader utility functions:
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><strong>loadReps():</strong> Fetches reps.json from /data/reps.json</li>
          <li><strong>loadAvailability():</strong> Fetches availability.json from /data/availability.json</li>
          <li><strong>getAllAppointments():</strong> Fetches appointments via GET /api/appointments</li>
          <li><strong>loadLeads():</strong> Fetches leads.json from /data/leads.json</li>
          <li><strong>loadServiceableZips():</strong> Fetches serviceable-zips.json with caching</li>
        </ul>
      </section>

      {/* Authentication */}
      <section id="authentication" className="scroll-mt-8">
        <h2 className="text-2xl font-bold text-navy mb-4">9. Authentication & Authorization</h2>
        
        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">9.1 Clerk Authentication</h3>
        <p className="mb-4">
          The application uses Clerk for authentication and user management. Clerk provides:
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li>User sign-up and sign-in</li>
          <li>Organization management</li>
          <li>Role-based access control (RBAC)</li>
          <li>Session management</li>
          <li>User profile management</li>
        </ul>

        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">9.2 Admin Access Control</h3>
        <p className="mb-4">
          Admin access is restricted to users who are members of the &quot;Windows USA&quot; organization with the &quot;org:admin&quot; role.
        </p>
        <p className="mb-4">
          <strong>Admin Check Logic:</strong>
        </p>
        <ol className="list-decimal pl-6 space-y-2 mb-4">
          <li>Check if user is in an organization</li>
          <li>Verify organization name/slug matches &quot;Windows USA&quot; (case-insensitive, various formats)</li>
          <li>Verify user has &quot;org:admin&quot; role</li>
          <li>Return true only if all conditions are met</li>
        </ol>

        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h4 className="font-semibold text-navy mb-2">Client-Side Hook: useIsAdmin()</h4>
          <pre className="text-sm overflow-x-auto">
{`// lib/use-admin.ts
export function useIsAdmin(): boolean {
  const { organization, membership } = useOrganization();
  const { organizationList } = useOrganizationList();
  
  // Checks if user is in Windows USA org with org:admin role
  // Returns true if admin, false otherwise
}`}
          </pre>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h4 className="font-semibold text-navy mb-2">Server-Side Function: isAdmin()</h4>
          <pre className="text-sm overflow-x-auto">
{`// lib/auth.ts
export async function isAdmin(): Promise<boolean> {
  const { userId, orgId, orgRole, orgSlug } = await auth();
  // Checks orgSlug and orgRole for admin access
}`}
          </pre>
        </div>

        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">9.3 Protected Routes</h3>
        <p className="mb-4">
          Routes are protected using Next.js middleware with Clerk:
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><strong>Protected Routes:</strong> /availability, /map, /appointments, /serviceable-zips, /zip-demographics, /settings</li>
          <li><strong>Public Routes:</strong> /, /sign-in, /sign-up</li>
          <li><strong>Admin-Only Routes:</strong> /settings, /documentation</li>
        </ul>

        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">9.4 Organization Matching</h3>
        <p className="mb-4">
          The system matches &quot;Windows USA&quot; organization using multiple variations:
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li>Exact match: &quot;windows usa&quot;</li>
          <li>Hyphenated: &quot;windows-usa&quot;</li>
          <li>No spaces: &quot;windowsusa&quot;</li>
          <li>Underscore: &quot;windows_usa&quot;</li>
          <li>Partial match: Contains both &quot;windows&quot; and &quot;usa&quot;</li>
        </ul>
      </section>

      {/* Deployment */}
      <section id="deployment" className="scroll-mt-8">
        <h2 className="text-2xl font-bold text-navy mb-4">10. Deployment & Configuration</h2>
        
        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">10.1 Environment Variables</h3>
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <pre className="text-sm overflow-x-auto">
{`# Required for Clerk authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Optional: Google Maps API (for address autocomplete)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here`}
          </pre>
        </div>

        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">10.2 Build & Deploy</h3>
        <p className="mb-4">
          <strong>Development:</strong>
        </p>
        <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm mb-4">
{`npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server`}
        </pre>

        <p className="mb-4">
          <strong>Vercel Deployment:</strong>
        </p>
        <ol className="list-decimal pl-6 space-y-2 mb-4">
          <li>Push code to GitHub repository</li>
          <li>Connect repository to Vercel</li>
          <li>Configure environment variables in Vercel dashboard</li>
          <li>Deploy automatically on push to main branch</li>
        </ol>

        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">10.3 Clerk Setup</h3>
        <p className="mb-4">
          See CLERK_SETUP.md for detailed Clerk configuration instructions:
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li>Create Clerk application</li>
          <li>Configure organization settings</li>
          <li>Set up &quot;Windows USA&quot; organization</li>
          <li>Assign admin roles to users</li>
          <li>Configure sign-in/sign-up pages</li>
        </ul>

        <h3 className="text-xl font-semibold text-navy mt-6 mb-3">10.4 Data Management</h3>
        <p className="mb-4">
          <strong>JSON Files:</strong> Data files in public/data/ are served statically and can be updated by:
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li>Direct file edits (development)</li>
          <li>API routes (appointments)</li>
          <li>Scripts in /scripts directory (data generation)</li>
        </ul>

        <p className="mb-4">
          <strong>Future Migration:</strong> The system is designed to migrate from JSON files to a database (PostgreSQL/Supabase) 
          in future versions. The data-loader functions abstract the data source, making migration easier.
        </p>
      </section>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          This documentation is maintained for the Windows USA Scheduler application. 
          For questions or updates, contact the development team.
        </p>
      </div>
    </div>
  );
}

export default function DocumentationPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </AppLayout>
    }>
      <DocumentationContent />
    </Suspense>
  );
}

