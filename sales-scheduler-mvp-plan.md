# In-Home Sales Appointment Scheduler - MVP Documentation

**Version:** 1.0  
**Date:** November 6, 2025  
**Project Type:** Standalone Demo (Pre-Salesforce Integration)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Core Concept](#core-concept)
3. [System Architecture](#system-architecture)
4. [Technical Specifications](#technical-specifications)
5. [Data Structures](#data-structures)
6. [Availability Algorithm](#availability-algorithm)
7. [User Interface Design](#user-interface-design)
8. [Development Timeline](#development-timeline)
9. [Deployment Instructions](#deployment-instructions)
10. [Future Enhancements](#future-enhancements)

---

## Executive Summary

### Purpose
Build a standalone MVP that demonstrates intelligent appointment scheduling based on geographic proximity and sales rep availability. The system aggregates capacity across multiple reps to show available time slots without requiring customers to select specific representatives.

### Key Features
- **Address-based availability search** - Enter full customer address
- **5-day calendar view** - Shows 10am, 2pm, 7pm slots
- **Aggregate capacity display** - Combines all rep availability
- **Intelligent rep assignment** - Auto-assigns closest available rep
- **Geographic visualization** - Interactive map showing coverage
- **Rep management interface** - Configure schedules and view appointments

### Success Metrics
- Demonstrates geographic routing logic
- Proves capacity-based scheduling works
- Provides visual proof-of-concept for stakeholders
- Establishes foundation for Salesforce integration

---

## Core Concept

### How It Works

**The Capacity-Based Scheduling Model:**

1. **Customer enters address** → System geocodes to lat/lng
2. **For each day/time slot** → System checks all sales reps:
   - Is rep working this day/time? (availability template)
   - Does rep already have appointment? (conflict check)
   - Where is rep's "anchor point"? (latest appointment or home)
   - Is customer within drive radius? (45 miles from anchor)
3. **Aggregate results** → Count available reps per slot
4. **Display capacity** → Show as Available/Limited/Unavailable
5. **On booking** → Auto-assign closest available rep

### Key Innovation: Anchor Points

**Anchor Point Logic:**
- If rep has appointments before this time slot → use **latest previous appointment address**
- If rep has no appointments today → use **home/starting address**
- This ensures reps get clustered territories and minimizes drive time

**Example:**
```
John's Schedule - Thursday Nov 7:
├─ 10am: Appointment at 123 Main St (85001)
├─ 2pm:  Appointment at 456 Oak Ave (85003)
└─ 7pm:  Available
         Anchor Point = 456 Oak Ave (his 2pm location)
         Can serve customers within 45 miles of 85003
```

---

## System Architecture

### Technology Stack

**Frontend Framework:**
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui component library

**State Management:**
- React hooks (useState, useEffect)
- No complex state library needed for MVP

**Mapping:**
- Leaflet.js (open source, no API key)
- React-Leaflet wrapper

**Data Storage:**
- JSON files (no database for MVP)
- Browser localStorage for temporary state

**Deployment:**
- Vercel (one-click deployment)
- GitHub for version control

**No External APIs Required:**
- Haversine formula for distance calculation
- Pre-geocoded addresses
- All data self-contained

### File Structure

```
sales-scheduler/
├── app/
│   ├── page.tsx                      # Main booking interface
│   ├── availability/page.tsx         # Rep availability manager
│   ├── map/page.tsx                  # Geographic visualization
│   ├── layout.tsx                    # Root layout with branding
│   └── globals.css                   # Tailwind + custom styles
│
├── components/
│   ├── booking/
│   │   ├── AddressSearch.tsx         # Customer address input
│   │   ├── AvailabilityGrid.tsx      # 5-day calendar display
│   │   ├── SlotCard.tsx              # Individual time slot
│   │   └── BookingModal.tsx          # Confirmation dialog
│   │
│   ├── availability/
│   │   ├── RepList.tsx               # List of all reps
│   │   ├── RepCard.tsx               # Single rep schedule editor
│   │   └── AppointmentList.tsx       # Current appointments
│   │
│   ├── map/
│   │   ├── ScheduleMap.tsx           # Interactive Leaflet map
│   │   ├── RepMarker.tsx             # Rep location pins
│   │   └── RadiusCircle.tsx          # Service area circles
│   │
│   └── ui/
│       └── [shadcn components]       # Button, Card, Input, etc.
│
├── lib/
│   ├── availability.ts               # Core scheduling algorithm
│   ├── distance.ts                   # Haversine calculation
│   ├── geocoding.ts                  # Address to lat/lng
│   ├── data-loader.ts                # Load JSON files
│   └── utils.ts                      # Helper functions
│
├── data/
│   ├── reps.json                     # Sales rep profiles
│   ├── appointments.json             # Scheduled appointments
│   ├── availability.json             # Weekly availability templates
│   └── zipcodes.json                 # Service area zip codes
│
├── types/
│   └── index.ts                      # TypeScript interfaces
│
└── public/
    └── [static assets]
```

---

## Technical Specifications

### Requirements

**Node.js:** v18+ recommended  
**Package Manager:** npm or yarn  
**Browser Support:** Modern browsers (Chrome, Firefox, Safari, Edge)  
**Mobile:** Responsive design, touch-friendly

### Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "date-fns": "^2.30.0",
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "lucide-react": "^0.294.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/leaflet": "^1.9.0"
  }
}
```

### Environment Variables

```bash
# .env.local (none required for MVP!)

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=

# Optional: Map tile server (defaults to OpenStreetMap)
NEXT_PUBLIC_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

---

## Data Structures

### TypeScript Interfaces

```typescript
// types/index.ts

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
}

export interface SalesRep {
  id: string;
  name: string;
  email: string;
  phone: string;
  startingAddress: Address;
  color: string; // For map visualization
}

export interface Availability {
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

export type TimeSlot = '10am' | '2pm' | '7pm';

export interface Appointment {
  id: string;
  repId: string;
  date: string; // ISO format: 'YYYY-MM-DD'
  timeSlot: TimeSlot;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  address: Address;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface AnchorPoint {
  lat: number;
  lng: number;
  source: 'home' | 'appointment';
  address: Address;
}

export interface AvailableRep {
  repId: string;
  repName: string;
  distance: number;
  anchorPoint: AnchorPoint;
}

export interface SlotAvailability {
  date: string;
  timeSlot: TimeSlot;
  availableCount: number;
  availableReps: AvailableRep[];
  status: 'good' | 'limited' | 'none';
}

export interface ZipCode {
  zip: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
}
```

### JSON File Examples

#### data/reps.json

```json
[
  {
    "id": "rep1",
    "name": "John Smith",
    "email": "john.smith@company.com",
    "phone": "602-555-0101",
    "startingAddress": {
      "street": "123 Main St",
      "city": "Phoenix",
      "state": "AZ",
      "zip": "85001",
      "lat": 33.4484,
      "lng": -112.0740
    },
    "color": "#2563EB"
  },
  {
    "id": "rep2",
    "name": "Sarah Johnson",
    "email": "sarah.johnson@company.com",
    "phone": "602-555-0102",
    "startingAddress": {
      "street": "456 Oak Ave",
      "city": "Scottsdale",
      "state": "AZ",
      "zip": "85251",
      "lat": 33.4942,
      "lng": -111.9261
    },
    "color": "#10B981"
  },
  {
    "id": "rep3",
    "name": "Mike Williams",
    "email": "mike.williams@company.com",
    "phone": "602-555-0103",
    "startingAddress": {
      "street": "789 Elm Rd",
      "city": "Tempe",
      "state": "AZ",
      "zip": "85281",
      "lat": 33.4255,
      "lng": -111.9400
    },
    "color": "#F59E0B"
  }
]
```

#### data/availability.json

```json
{
  "rep1": {
    "monday": ["10am", "2pm", "7pm"],
    "tuesday": ["10am", "2pm", "7pm"],
    "wednesday": ["10am", "2pm", "7pm"],
    "thursday": ["2pm", "7pm"],
    "friday": ["10am", "2pm", "7pm"],
    "saturday": [],
    "sunday": []
  },
  "rep2": {
    "monday": ["2pm", "7pm"],
    "tuesday": ["10am", "2pm", "7pm"],
    "wednesday": ["10am", "2pm", "7pm"],
    "thursday": ["10am", "2pm"],
    "friday": ["10am", "2pm", "7pm"],
    "saturday": ["10am", "2pm"],
    "sunday": []
  },
  "rep3": {
    "monday": ["10am", "2pm", "7pm"],
    "tuesday": ["10am", "2pm"],
    "wednesday": ["10am", "2pm", "7pm"],
    "thursday": ["10am", "2pm", "7pm"],
    "friday": ["10am", "2pm"],
    "saturday": [],
    "sunday": []
  }
}
```

#### data/appointments.json

```json
[
  {
    "id": "apt1",
    "repId": "rep1",
    "date": "2025-11-07",
    "timeSlot": "10am",
    "customerName": "Mike Davis",
    "customerPhone": "602-555-1001",
    "customerEmail": "mike.davis@email.com",
    "address": {
      "street": "321 Pine St",
      "city": "Phoenix",
      "state": "AZ",
      "zip": "85003",
      "lat": 33.4500,
      "lng": -112.0667
    },
    "status": "scheduled",
    "createdAt": "2025-11-05T10:30:00Z"
  },
  {
    "id": "apt2",
    "repId": "rep1",
    "date": "2025-11-07",
    "timeSlot": "2pm",
    "customerName": "Lisa Brown",
    "customerPhone": "602-555-1002",
    "address": {
      "street": "654 Maple Ave",
      "city": "Phoenix",
      "state": "AZ",
      "zip": "85006",
      "lat": 33.4650,
      "lng": -112.0550
    },
    "status": "scheduled",
    "createdAt": "2025-11-05T14:15:00Z"
  },
  {
    "id": "apt3",
    "repId": "rep2",
    "date": "2025-11-07",
    "timeSlot": "10am",
    "customerName": "Tom Wilson",
    "customerPhone": "602-555-1003",
    "address": {
      "street": "987 Cedar Ln",
      "city": "Scottsdale",
      "state": "AZ",
      "zip": "85250",
      "lat": 33.4900,
      "lng": -111.9100
    },
    "status": "scheduled",
    "createdAt": "2025-11-05T09:45:00Z"
  }
]
```

---

## Availability Algorithm

### Core Logic Implementation

#### lib/distance.ts

```typescript
/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in miles
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
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
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if location is within drive radius
 */
export function isWithinRadius(
  centerLat: number,
  centerLng: number,
  targetLat: number,
  targetLng: number,
  radiusMiles: number = 45
): boolean {
  const distance = calculateDistance(centerLat, centerLng, targetLat, targetLng);
  return distance <= radiusMiles;
}
```

#### lib/availability.ts

```typescript
import { format, addDays, parseISO } from 'date-fns';
import { calculateDistance } from './distance';
import type {
  SalesRep,
  Appointment,
  Availability,
  Address,
  TimeSlot,
  AnchorPoint,
  AvailableRep,
  SlotAvailability
} from '@/types';

const TIME_SLOTS: TimeSlot[] = ['10am', '2pm', '7pm'];
const DRIVE_RADIUS_MILES = 45;

// Map time slots to numeric order for comparison
const TIME_SLOT_ORDER: Record<TimeSlot, number> = {
  '10am': 1,
  '2pm': 2,
  '7pm': 3
};

/**
 * Get rep's anchor point for a specific date and time slot
 */
function getRepAnchorPoint(
  rep: SalesRep,
  date: string,
  timeSlot: TimeSlot,
  appointments: Appointment[]
): AnchorPoint {
  // Find all appointments for this rep on this date
  const todaysAppointments = appointments.filter(
    apt => apt.repId === rep.id && apt.date === date && apt.status === 'scheduled'
  );
  
  if (todaysAppointments.length === 0) {
    // No appointments today, use home address
    return {
      lat: rep.startingAddress.lat,
      lng: rep.startingAddress.lng,
      source: 'home',
      address: rep.startingAddress
    };
  }
  
  // Find appointments before this time slot
  const earlierAppointments = todaysAppointments.filter(
    apt => TIME_SLOT_ORDER[apt.timeSlot] < TIME_SLOT_ORDER[timeSlot]
  );
  
  if (earlierAppointments.length === 0) {
    // No earlier appointments, use home address
    return {
      lat: rep.startingAddress.lat,
      lng: rep.startingAddress.lng,
      source: 'home',
      address: rep.startingAddress
    };
  }
  
  // Use the latest earlier appointment
  const latestAppointment = earlierAppointments.sort(
    (a, b) => TIME_SLOT_ORDER[b.timeSlot] - TIME_SLOT_ORDER[a.timeSlot]
  )[0];
  
  return {
    lat: latestAppointment.address.lat,
    lng: latestAppointment.address.lng,
    source: 'appointment',
    address: latestAppointment.address
  };
}

/**
 * Calculate availability for a specific time slot
 */
function calculateSlotAvailability(
  customerAddress: Address,
  date: string,
  timeSlot: TimeSlot,
  reps: SalesRep[],
  availability: Availability,
  appointments: Appointment[]
): SlotAvailability {
  const dayOfWeek = format(parseISO(date), 'EEEE').toLowerCase() as keyof Availability[string];
  const availableReps: AvailableRep[] = [];
  
  for (const rep of reps) {
    // Check 1: Is rep available this day/time?
    const repAvailability = availability[rep.id];
    if (!repAvailability || !repAvailability[dayOfWeek].includes(timeSlot)) {
      continue; // Rep doesn't work this day/time
    }
    
    // Check 2: Does rep have a conflict?
    const hasConflict = appointments.some(
      apt =>
        apt.repId === rep.id &&
        apt.date === date &&
        apt.timeSlot === timeSlot &&
        apt.status === 'scheduled'
    );
    if (hasConflict) {
      continue; // Rep already booked
    }
    
    // Check 3: Calculate anchor point
    const anchorPoint = getRepAnchorPoint(rep, date, timeSlot, appointments);
    
    // Check 4: Calculate distance from anchor to customer
    const distance = calculateDistance(
      anchorPoint.lat,
      anchorPoint.lng,
      customerAddress.lat,
      customerAddress.lng
    );
    
    // Check 5: Is customer within drive radius?
    if (distance <= DRIVE_RADIUS_MILES) {
      availableReps.push({
        repId: rep.id,
        repName: rep.name,
        distance: distance,
        anchorPoint: anchorPoint
      });
    }
  }
  
  // Sort by distance (closest first)
  availableReps.sort((a, b) => a.distance - b.distance);
  
  // Determine status
  let status: 'good' | 'limited' | 'none';
  if (availableReps.length >= 3) {
    status = 'good';
  } else if (availableReps.length >= 1) {
    status = 'limited';
  } else {
    status = 'none';
  }
  
  return {
    date,
    timeSlot,
    availableCount: availableReps.length,
    availableReps,
    status
  };
}

/**
 * Calculate availability grid for 5 days
 */
export function calculateAvailabilityGrid(
  customerAddress: Address,
  startDate: Date,
  reps: SalesRep[],
  availability: Availability,
  appointments: Appointment[],
  numDays: number = 5
): SlotAvailability[][] {
  const results: SlotAvailability[][] = [];
  
  for (let dayOffset = 0; dayOffset < numDays; dayOffset++) {
    const targetDate = addDays(startDate, dayOffset);
    const dateString = format(targetDate, 'yyyy-MM-dd');
    const dayResults: SlotAvailability[] = [];
    
    for (const timeSlot of TIME_SLOTS) {
      const slotAvailability = calculateSlotAvailability(
        customerAddress,
        dateString,
        timeSlot,
        reps,
        availability,
        appointments
      );
      dayResults.push(slotAvailability);
    }
    
    results.push(dayResults);
  }
  
  return results;
}

/**
 * Book an appointment (assigns closest available rep)
 */
export function bookAppointment(
  slotAvailability: SlotAvailability,
  customerName: string,
  customerAddress: Address,
  customerPhone?: string,
  customerEmail?: string
): Appointment | null {
  if (slotAvailability.availableCount === 0) {
    return null; // No availability
  }
  
  // Assign closest rep
  const assignedRep = slotAvailability.availableReps[0];
  
  const appointment: Appointment = {
    id: `apt-${Date.now()}`,
    repId: assignedRep.repId,
    date: slotAvailability.date,
    timeSlot: slotAvailability.timeSlot,
    customerName,
    customerPhone,
    customerEmail,
    address: customerAddress,
    status: 'scheduled',
    createdAt: new Date().toISOString()
  };
  
  return appointment;
}
```

### Algorithm Complexity

**Time Complexity:**  
O(D × T × R) where:
- D = number of days (5)
- T = number of time slots (3)
- R = number of reps (5-8)

**Total operations:** ~75-120 calculations per search  
**Performance:** <50ms on modern hardware

---

## User Interface Design

### Design System

**Color Palette:**
```css
/* Primary Colors */
--primary-blue: #2563EB;      /* Buttons, links, available slots */
--primary-red: #DC2626;       /* Unavailable, warnings, delete */

/* Backgrounds */
--bg-white: #FFFFFF;          /* Main background */
--bg-gray-50: #F9FAFB;        /* Card backgrounds */
--bg-gray-100: #F3F4F6;       /* Disabled states */

/* Text Colors */
--text-gray-900: #111827;     /* Primary text */
--text-gray-600: #4B5563;     /* Secondary text */
--text-gray-400: #9CA3AF;     /* Tertiary text */

/* Status Colors */
--status-green: #10B981;      /* Good availability (3+ reps) */
--status-yellow: #F59E0B;     /* Limited availability (1-2 reps) */
--status-red: #DC2626;        /* No availability */

/* Borders */
--border-gray-200: #E5E7EB;
--border-gray-300: #D1D5DB;
```

**Typography:**
```css
/* Font Family */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

**Spacing:**
```css
/* Consistent spacing scale (Tailwind defaults) */
--spacing-1: 0.25rem;   /* 4px */
--spacing-2: 0.5rem;    /* 8px */
--spacing-3: 0.75rem;   /* 12px */
--spacing-4: 1rem;      /* 16px */
--spacing-6: 1.5rem;    /* 24px */
--spacing-8: 2rem;      /* 32px */
--spacing-12: 3rem;     /* 48px */
```

### Screen Layouts

#### 1. Main Booking Interface

**Layout Structure:**
```
┌─────────────────────────────────────────────────┐
│ Header: Logo + Navigation                       │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌───────────────────────────────────────────┐ │
│  │ Enter Customer Address                    │ │
│  │ ┌─────────────────────────────────────┐  │ │
│  │ │ Street Address                       │  │ │
│  │ └─────────────────────────────────────┘  │ │
│  │ ┌──────┐ ┌────┐ ┌──────┐               │ │
│  │ │ City │ │ ST │ │ Zip  │               │ │
│  │ └──────┘ └────┘ └──────┘               │ │
│  │                                          │ │
│  │ [Find Available Times →]                │ │
│  └───────────────────────────────────────────┘ │
│                                                  │
│  ┌───────────────────────────────────────────┐ │
│  │ Available Appointments                    │ │
│  │                                           │ │
│  │ ┌────┬────┬────┬────┬────┐             │ │
│  │ │Thu │Fri │Sat │Sun │Mon │             │ │
│  │ │Nov7│Nov8│Nov9│10  │11  │             │ │
│  │ ├────┼────┼────┼────┼────┤             │ │
│  │ │10am│10am│ -- │ -- │10am│             │ │
│  │ │ 🟢 │ 🟡 │    │    │ 🟢 │             │ │
│  │ │ 3  │ 1  │    │    │ 4  │             │ │
│  │ ├────┼────┼────┼────┼────┤             │ │
│  │ │2pm │2pm │ -- │ -- │2pm │             │ │
│  │ │ 🟢 │ 🟢 │    │    │ 🟡 │             │ │
│  │ │ 5  │ 3  │    │    │ 1  │             │ │
│  │ ├────┼────┼────┼────┼────┤             │ │
│  │ │7pm │7pm │ -- │ -- │7pm │             │ │
│  │ │ 🟢 │ 🔴 │    │    │ 🟢 │             │ │
│  │ │ 4  │ 0  │    │    │ 2  │             │ │
│  │ └────┴────┴────┴────┴────┘             │ │
│  │                                           │ │
│  │ 🟢 Good (3+)  🟡 Limited (1-2)  🔴 None │ │
│  └───────────────────────────────────────────┘ │
│                                                  │
│  [View Coverage Map →]                          │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Interactions:**
- Click any green/yellow slot → Opens booking modal
- Click red slot → Shows "No availability" message
- Hover slot → Shows tooltip with rep count

#### 2. Booking Confirmation Modal

```
┌──────────────────────────────────────┐
│ Confirm Appointment                  │
├──────────────────────────────────────┤
│                                      │
│ Customer Address:                    │
│ 789 Elm St, Phoenix, AZ 85003       │
│                                      │
│ ┌──────────────────────────────────┐│
│ │ Thursday, November 7, 2025       ││
│ │ 10:00 AM                         ││
│ └──────────────────────────────────┘│
│                                      │
│ Assigned Rep: John Smith            │
│ Distance: 3.2 miles from base       │
│                                      │
│ Customer Name:                       │
│ ┌──────────────────────────────────┐│
│ │                                  ││
│ └──────────────────────────────────┘│
│                                      │
│ Phone Number:                        │
│ ┌──────────────────────────────────┐│
│ │                                  ││
│ └──────────────────────────────────┘│
│                                      │
│ Email (optional):                    │
│ ┌──────────────────────────────────┐│
│ │                                  ││
│ └──────────────────────────────────┘│
│                                      │
│ [Cancel]         [Book Appointment] │
│                                      │
└──────────────────────────────────────┘
```

#### 3. Rep Availability Manager

```
┌─────────────────────────────────────────────────┐
│ Sales Rep Availability Management               │
├─────────────────────────────────────────────────┤
│                                                  │
│ ┌────────────────────────────────────────────┐ │
│ │ 🔵 John Smith                              │ │
│ │ Phoenix, AZ 85001 • 602-555-0101          │ │
│ │                                            │ │
│ │ Weekly Availability:                       │ │
│ │ ┌────────────────────────────────────────┐│ │
│ │ │ Mon  [✓]10am [✓]2pm [✓]7pm           ││ │
│ │ │ Tue  [✓]10am [✓]2pm [✓]7pm           ││ │
│ │ │ Wed  [✓]10am [✓]2pm [✓]7pm           ││ │
│ │ │ Thu  [ ]10am [✓]2pm [✓]7pm           ││ │
│ │ │ Fri  [✓]10am [✓]2pm [✓]7pm           ││ │
│ │ │ Sat  [ ]10am [ ]2pm [ ]7pm           ││ │
│ │ │ Sun  [ ]10am [ ]2pm [ ]7pm           ││ │
│ │ └────────────────────────────────────────┘│ │
│ │                                            │ │
│ │ Current Appointments: 3 this week          │ │
│ │ [View Schedule →]                          │ │
│ └────────────────────────────────────────────┘ │
│                                                  │
│ ┌────────────────────────────────────────────┐ │
│ │ 🟢 Sarah Johnson                           │ │
│ │ Scottsdale, AZ 85251 • 602-555-0102       │ │
│ │ ...                                        │ │
│ └────────────────────────────────────────────┘ │
│                                                  │
└─────────────────────────────────────────────────┘
```

#### 4. Map View

```
┌─────────────────────────────────────────────────┐
│ Geographic Coverage                             │
├─────────────────────────────────────────────────┤
│                                                  │
│ Select Date: [Nov 7, 2025 ▼]  Time: [2pm ▼]   │
│                                                  │
│ ┌───────────────────────────────────────────┐  │
│ │                                           │  │
│ │         Interactive Map                   │  │
│ │                                           │  │
│ │   🔵 John (Home: 85001)                  │  │
│ │     📍 10am apt (85003)                  │  │
│ │        ⭕ 45mi radius                    │  │
│ │        ✅ Available at 2pm               │  │
│ │                                           │  │
│ │   🟢 Sarah (Home: 85251)                 │  │
│ │     📍 10am apt (85250)                  │  │
│ │        ⭕ 45mi radius                    │  │
│ │        ❌ Customer out of range          │  │
│ │                                           │  │
│ │   🟡 Mike (Home: 85281)                  │  │
│ │     ⭕ 45mi radius                       │  │
│ │     ✅ Available at 2pm                  │  │
│ │                                           │  │
│ │   ⭐ Customer (789 Elm St, 85003)        │  │
│ │                                           │  │
│ └───────────────────────────────────────────┘  │
│                                                  │
│ Legend:                                          │
│ 🔵🟢🟡 Rep Starting Location                    │
│ 📍 Scheduled Appointment                         │
│ ⭕ Service Radius (45 miles)                    │
│ ⭐ Customer Location                             │
│                                                  │
│ Available Reps for This Slot:                   │
│ ✅ John Smith - 3.2 miles                       │
│ ✅ Mike Williams - 8.5 miles                    │
│ ❌ Sarah Johnson - 52 miles (out of range)     │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Responsive Design

**Breakpoints:**
```css
/* Mobile First */
sm: 640px   /* Small devices */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
```

**Mobile Adaptations:**
- Calendar grid stacks vertically
- Larger touch targets (minimum 44×44px)
- Simplified map view
- Bottom sheet modals instead of centered

---

## Development Timeline

### One-Day Build Schedule

**Total Time:** 7-9 hours

#### Hour 1: Setup (9:00 AM - 10:00 AM)
- [x] Create Next.js project
- [x] Install dependencies
- [x] Configure Tailwind CSS
- [x] Add shadcn/ui components
- [x] Set up file structure
- [x] Create TypeScript interfaces

**Commands:**
```bash
npx create-next-app@latest sales-scheduler --typescript --tailwind --app
cd sales-scheduler
npm install date-fns leaflet react-leaflet lucide-react
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input select dialog
```

#### Hour 2: Data Generation (10:00 AM - 11:00 AM)
- [x] Process rep address CSV
- [x] Geocode all addresses
- [x] Generate rep profiles with fake names/contacts
- [x] Create realistic availability templates
- [x] Generate sample appointments (50% booking density)
- [x] Create Phoenix zip code database

**Output:** All JSON files in `/data` folder

#### Hour 3: Core Logic (11:00 AM - 12:00 PM)
- [x] Implement Haversine distance function
- [x] Build anchor point calculation
- [x] Create availability checker
- [x] Implement slot aggregation algorithm
- [x] Write unit tests for core logic

**Files:** `lib/distance.ts`, `lib/availability.ts`

#### Hour 4: Booking Interface - Part 1 (1:00 PM - 2:00 PM)
- [x] Build AddressSearch component
- [x] Implement geocoding (pre-computed or API)
- [x] Create AvailabilityGrid component
- [x] Build SlotCard component
- [x] Add loading states

**Files:** `components/booking/*`, `app/page.tsx`

#### Hour 5: Booking Interface - Part 2 (2:00 PM - 3:00 PM)
- [x] Create BookingModal component
- [x] Implement booking flow
- [x] Add form validation
- [x] Create confirmation screen
- [x] Wire up state management

#### Hour 6: Rep Manager (3:00 PM - 4:00 PM)
- [x] Build RepList component
- [x] Create RepCard with availability toggles
- [x] Implement AppointmentList
- [x] Add basic CRUD operations (localStorage)

**Files:** `components/availability/*`, `app/availability/page.tsx`

#### Hour 7: Map View (4:00 PM - 5:00 PM)
- [x] Set up Leaflet map
- [x] Plot rep locations with markers
- [x] Draw radius circles
- [x] Add customer location pin
- [x] Create interactive legend

**Files:** `components/map/*`, `app/map/page.tsx`

#### Hour 8: Polish (5:00 PM - 6:00 PM)
- [x] Add responsive design tweaks
- [x] Implement loading spinners
- [x] Add error handling
- [x] Create navigation between pages
- [x] Add branding (logo, colors)
- [x] Test on mobile devices

#### Hour 9: Deploy (6:00 PM - 7:00 PM)
- [x] Git initialization and commit
- [x] Push to GitHub
- [x] Connect to Vercel
- [x] Deploy to production
- [x] Test live URL
- [x] Create basic README

**Output:** Live URL at `https://sales-scheduler-xyz.vercel.app`

---

## Deployment Instructions

### Prerequisites
- GitHub account
- Vercel account (free tier)
- Git installed locally

### Step-by-Step Deployment

#### 1. Initialize Git Repository

```bash
# In project directory
git init
git add .
git commit -m "Initial commit: Sales Scheduler MVP"
```

#### 2. Create GitHub Repository

```bash
# Create repo on GitHub.com, then:
git remote add origin https://github.com/YOUR-USERNAME/sales-scheduler.git
git branch -M main
git push -u origin main
```

#### 3. Deploy to Vercel

**Option A: Vercel CLI (Recommended)**
```bash
npm i -g vercel
vercel login
vercel

# Follow prompts:
# Set up and deploy? Yes
# Which scope? Your account
# Link to existing project? No
# Project name? sales-scheduler
# Directory? ./
# Override settings? No

# Production deployment:
vercel --prod
```

**Option B: Vercel Dashboard**
1. Go to vercel.com/new
2. Import your GitHub repository
3. Configure:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. Click "Deploy"

#### 4. Environment Variables

For MVP, no environment variables are required! Everything runs on static data.

#### 5. Custom Domain (Optional)

```bash
# In Vercel dashboard:
# Settings → Domains → Add Domain
# Follow DNS configuration instructions
```

### Deployment Checklist

- [ ] All data files present in `/data` folder
- [ ] TypeScript builds without errors (`npm run build`)
- [ ] No console errors in development
- [ ] Mobile responsive tested
- [ ] All three pages accessible
- [ ] Map loads correctly
- [ ] Git repository pushed to GitHub
- [ ] Vercel deployment successful
- [ ] Production URL tested

### Vercel Deployment Settings

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

---

## Future Enhancements

### Post-MVP Roadmap

#### Phase 1: Salesforce Integration (Weeks 1-3)
- OAuth connection to Salesforce
- Real-time data sync (Platform Events)
- Custom button on Lead/Contact objects
- Appointment write-back to SF
- User authentication with SF credentials

#### Phase 2: Advanced Features (Weeks 4-6)
- SMS/Email confirmations (Twilio + Resend)
- Automated reminders 24 hours before appointment
- Rep mobile app for schedule management
- Real-time drive time calculations (Google Maps API)
- Waiting list for fully booked slots

#### Phase 3: Analytics & Optimization (Weeks 7-9)
- Dashboard with booking metrics
- Conversion rate tracking
- Geographic heat maps
- Rep performance analytics
- AI-powered slot recommendations

#### Phase 4: Scale & Polish (Weeks 10-12)
- Multi-territory support
- Custom business hours per rep
- Holiday/blackout date management
- Route optimization suggestions
- Calendar integrations (Google, Outlook)

### Technical Debt to Address

**Database Migration:**
- Move from JSON to Supabase PostgreSQL
- Implement proper caching layer (Redis)
- Add connection pooling

**Authentication:**
- Implement role-based access control
- Add multi-factor authentication
- Create audit logging

**Performance:**
- Implement server-side caching
- Add database indexes
- Optimize map rendering

**Testing:**
- Unit tests for all core logic
- Integration tests for booking flow
- End-to-end tests with Playwright
- Load testing for scalability

---

## Appendix

### A. Sample Test Scenarios

#### Test Case 1: Customer in Dense Area
```
Input:
- Customer Address: 321 Pine St, Phoenix, AZ 85003
- Date: Thursday, Nov 7, 2025
- Time: 2pm

Expected Output:
- Available Reps: 3-4 reps
- Status: Good availability
- Closest Rep: John Smith (3.2 miles)
```

#### Test Case 2: Customer at Edge of Service Area
```
Input:
- Customer Address: 15234 N Cave Creek Rd, Phoenix, AZ 85032
- Date: Friday, Nov 8, 2025
- Time: 7pm

Expected Output:
- Available Reps: 0-1 rep
- Status: Limited or none
- Message: "Limited availability for this location"
```

#### Test Case 3: Peak Booking Time
```
Input:
- Date: Monday (all reps working)
- Time: 2pm (most popular)

Expected Output:
- Multiple slots showing good availability
- Balanced rep assignment across appointments
```

### B. Troubleshooting Guide

**Issue:** Map not displaying
```
Solution:
1. Check Leaflet CSS is imported in layout.tsx
2. Verify all coordinates are valid numbers
3. Check browser console for errors
```

**Issue:** Distance calculations seem wrong
```
Solution:
1. Verify lat/lng are not swapped (lat first!)
2. Check Haversine formula implementation
3. Confirm radius is in correct units (miles)
```

**Issue:** No availability showing
```
Solution:
1. Check date range (must be future dates)
2. Verify rep availability templates
3. Ensure appointments are in correct date format
4. Check drive radius is reasonable (45 miles)
```

### C. Data Generation Scripts

**Geocoding Addresses:**
```typescript
async function geocodeAddresses(addresses: string[]) {
  const results = [];
  
  for (const address of addresses) {
    const query = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`
    );
    const data = await response.json();
    
    if (data[0]) {
      results.push({
        address,
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      });
    }
    
    // Rate limit: 1 request per second
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}
```

**Generating Fake Rep Data:**
```typescript
const firstNames = ['John', 'Sarah', 'Mike', 'Emily', 'David', 'Lisa'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'];

function generateRepName(): string {
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${first} ${last}`;
}

function generatePhoneNumber(): string {
  const area = '602';
  const exchange = Math.floor(Math.random() * 900) + 100;
  const number = Math.floor(Math.random() * 9000) + 1000;
  return `${area}-555-${String(exchange).padStart(4, '0')}`;
}
```

### D. Keyboard Shortcuts (Future Enhancement)

```
/ - Focus address search
Esc - Close modal
← → - Navigate between days
1, 2, 3 - Select time slot (10am, 2pm, 7pm)
Enter - Confirm booking
```

### E. API Documentation (For Future SF Integration)

**Endpoint:** `POST /api/availability`

**Request:**
```json
{
  "address": {
    "street": "123 Main St",
    "city": "Phoenix",
    "state": "AZ",
    "zip": "85001"
  },
  "startDate": "2025-11-07",
  "numDays": 5
}
```

**Response:**
```json
{
  "availability": [
    [
      {
        "date": "2025-11-07",
        "timeSlot": "10am",
        "availableCount": 3,
        "status": "good"
      },
      // ... more time slots
    ],
    // ... more days
  ]
}
```

---

## Credits & Resources

**Technologies Used:**
- [Next.js](https://nextjs.org) - React framework
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS
- [shadcn/ui](https://ui.shadcn.com) - Component library
- [Leaflet](https://leafletjs.com) - Interactive maps
- [date-fns](https://date-fns.org) - Date manipulation
- [Lucide Icons](https://lucide.dev) - Icon library

**Learning Resources:**
- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Haversine Formula Explained](https://en.wikipedia.org/wiki/Haversine_formula)
- [Leaflet.js Tutorial](https://leafletjs.com/examples.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)

---

## Document Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 6, 2025 | Initial MVP documentation |

---

## Contact & Support

**For Questions:**
- Review this documentation thoroughly
- Check troubleshooting section
- Test in development before production

**Success Metrics:**
- ✅ MVP deployed and accessible
- ✅ All core features working
- ✅ Mobile responsive
- ✅ Map visualization functional
- ✅ Ready for stakeholder demo

---

**End of Documentation**
