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
const DRIVE_RADIUS_MILES = 60; // Increased to 60 miles to cover areas like Tom Bean, TX

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
    apt => apt.repId && apt.repId === rep.id && apt.date === date && apt.status === 'scheduled'
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
  
  // Find appointments after this time slot
  const laterAppointments = todaysAppointments.filter(
    apt => TIME_SLOT_ORDER[apt.timeSlot] > TIME_SLOT_ORDER[timeSlot]
  );
  
  // Priority 1: Use the latest earlier appointment if available
  if (earlierAppointments.length > 0) {
    const latestAppointment = earlierAppointments.sort(
      (a, b) => TIME_SLOT_ORDER[b.timeSlot] - TIME_SLOT_ORDER[a.timeSlot]
    )[0];
    
    return {
      lat: latestAppointment.address.lat,
      lng: latestAppointment.address.lng,
      source: 'previous-appointment',
      address: latestAppointment.address
    };
  }
  
  // Priority 2: Use the earliest later appointment if available
  if (laterAppointments.length > 0) {
    const earliestAppointment = laterAppointments.sort(
      (a, b) => TIME_SLOT_ORDER[a.timeSlot] - TIME_SLOT_ORDER[b.timeSlot]
    )[0];
    
    return {
      lat: earliestAppointment.address.lat,
      lng: earliestAppointment.address.lng,
      source: 'next-appointment',
      address: earliestAppointment.address
    };
  }
  
  // No earlier or later appointments, use home address
  return {
    lat: rep.startingAddress.lat,
    lng: rep.startingAddress.lng,
    source: 'home',
    address: rep.startingAddress
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
  
  // Debug logging
  if (reps.length === 0) {
    console.warn('No reps loaded for availability calculation');
  }
  if (Object.keys(availability).length === 0) {
    console.warn('No availability data loaded');
  }
  
  for (const rep of reps) {
    // Check 1: Is rep available this day/time?
    const repAvailability = availability[rep.id];
    if (!repAvailability || !repAvailability[dayOfWeek].includes(timeSlot)) {
      continue; // Rep doesn't work this day/time
    }
    
    // Check 2: Does rep have a conflict?
    const hasConflict = appointments.some(
      apt =>
        apt.repId &&
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
    
    // Debug: Log first few reps and distances
    if (availableReps.length < 3) {
      console.log(`Rep ${rep.name} (${rep.startingAddress.city}): distance=${distance.toFixed(1)} miles, available=${distance <= DRIVE_RADIUS_MILES}`);
    }
    
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

