import type { SalesRep, Appointment, Availability } from '@/types';

/**
 * Load data from JSON files
 * In production, this would fetch from an API or database
 */

let cachedReps: SalesRep[] | null = null;
let cachedAvailability: Availability | null = null;
let cachedAppointments: Appointment[] | null = null;

// Function to clear appointments cache (useful for development)
export function clearAppointmentsCache(): void {
  cachedAppointments = null;
}

export async function loadReps(): Promise<SalesRep[]> {
  if (cachedReps) {
    return cachedReps;
  }
  
  try {
    const response = await fetch('/data/reps.json');
    const data = await response.json();
    cachedReps = data;
    return data;
  } catch (error) {
    console.error('Error loading reps:', error);
    return [];
  }
}

export async function loadAvailability(): Promise<Availability> {
  if (cachedAvailability) {
    return cachedAvailability;
  }
  
  try {
    const response = await fetch('/data/availability.json');
    const data = await response.json();
    cachedAvailability = data;
    return data;
  } catch (error) {
    console.error('Error loading availability:', error);
    return {};
  }
}

export async function loadAppointments(): Promise<Appointment[]> {
  // Always fetch fresh data (disable cache for now to ensure we get latest)
  try {
    const response = await fetch('/data/appointments.json', { 
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to load appointments: ${response.status}`);
    }
    const data = await response.json();
    cachedAppointments = data;
    console.log(`Loaded ${data.length} appointments from JSON file`);
    return data;
  } catch (error) {
    console.error('Error loading appointments:', error);
    return [];
  }
}

/**
 * Save appointments (for MVP, uses localStorage)
 * In production, this would POST to an API
 */
export function saveAppointment(appointment: Appointment): void {
  if (typeof window === 'undefined') return;
  
  const appointments = loadAppointmentsFromStorage();
  appointments.push(appointment);
  localStorage.setItem('appointments', JSON.stringify(appointments));
  
  // Invalidate cache
  cachedAppointments = null;
}

export function loadAppointmentsFromStorage(): Appointment[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem('appointments');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading appointments from storage:', error);
  }
  
  return [];
}

/**
 * Get all appointments (combines JSON file + localStorage)
 */
export async function getAllAppointments(): Promise<Appointment[]> {
  const jsonAppointments = await loadAppointments();
  const storedAppointments = loadAppointmentsFromStorage();
  
  // Combine and deduplicate by ID
  const allAppointments = [...jsonAppointments, ...storedAppointments];
  const uniqueAppointments = Array.from(
    new Map(allAppointments.map(apt => [apt.id, apt])).values()
  );
  
  return uniqueAppointments;
}

