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
  successScore?: number; // Success score from 1-100
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
  repId?: string; // Optional - not assigned until later
  date: string; // ISO format: 'YYYY-MM-DD'
  timeSlot: TimeSlot;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  leadId?: string;
  address: Address;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface AnchorPoint {
  lat: number;
  lng: number;
  source: 'home' | 'previous-appointment' | 'next-appointment';
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

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: Address;
  repId?: string; // Optional - assigned rep if lead is converted
  status?: 'new' | 'contacted' | 'qualified' | 'converted';
  createdAt: string;
  faradayCreditPropensity?: number; // 1-100
  thinkUnlimitedScore?: 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
  efScore?: number; // 0, 1, or range 640-800
  leadSource?: 'Referral' | 'Affiliate';
  leadSourceDetails?: string; // Specific source details based on leadSource
  // Referral-specific fields
  refererName?: string; // Name of the person who referred this lead
  refererPhone?: string; // Phone number of the referer
  refererAddress?: Address; // Address of the referer
  refererRelationship?: 'Friend' | 'Family'; // Relationship to the lead
}

