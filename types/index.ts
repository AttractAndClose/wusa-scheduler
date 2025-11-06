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

