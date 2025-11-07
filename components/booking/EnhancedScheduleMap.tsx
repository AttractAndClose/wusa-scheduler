'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import type { Address, Appointment, SalesRep, Availability, TimeSlot } from '@/types';
import { format, parseISO, startOfWeek, addDays, isSameWeek, getDay } from 'date-fns';
import { calculateDistance } from '@/lib/distance';

// Fix for default marker icons in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

// Day colors for appointment pins
const DAY_COLORS: Record<number, string> = {
  1: '#3B82F6', // Monday - Blue
  2: '#10B981', // Tuesday - Green
  3: '#F59E0B', // Wednesday - Orange
  4: '#8B5CF6', // Thursday - Purple
  5: '#EF4444', // Friday - Red
  6: '#EC4899', // Saturday - Pink
  0: '#06B6D4', // Sunday - Cyan
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface EnhancedScheduleMapProps {
  customerAddress: Address;
  appointments: Appointment[];
  reps: SalesRep[];
  availability: Availability;
}

// Component to update map view and zoom
function MapUpdater({ customerAddress }: { customerAddress: Address }) {
  const map = useMap();

  useEffect(() => {
    // Calculate bounds for 75 miles radius and set view
    const updateMap = () => {
      // Calculate the radius in degrees
      // 1 degree latitude ≈ 69 miles
      // For 75 miles radius, we need 75/69 ≈ 1.087 degrees
      const latRadius = 75 / 69; // ~1.087 degrees latitude
      const lngRadius = 75 / (69 * Math.cos(customerAddress.lat * Math.PI / 180)); // Adjust for longitude
      
      // Create bounds for 75 miles radius (150 miles total width/height)
      const bounds = L.latLngBounds(
        [customerAddress.lat - latRadius, customerAddress.lng - lngRadius],
        [customerAddress.lat + latRadius, customerAddress.lng + lngRadius]
      );
      
      // Use fitBounds with minimal padding to show exactly 75 miles radius
      map.fitBounds(bounds, { padding: [0, 0] });
    };

    // Use a small timeout to ensure map tiles are loaded
    const timer = setTimeout(() => {
      updateMap();
    }, 100);

    return () => clearTimeout(timer);
  }, [customerAddress, map]);

  return null;
}

export function EnhancedScheduleMap({
  customerAddress,
  appointments,
  reps,
  availability
}: EnhancedScheduleMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [dayOffset, setDayOffset] = useState(0); // For scrolling through days
  // Get today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = format(today, 'yyyy-MM-dd');
  
  // Default to today
  const [selectedDay, setSelectedDay] = useState<string | null>(todayStr);

  // Generate day buttons (today + next 4 days) with offset support
  const generateDayButtons = () => {
    const startDate = addDays(today, dayOffset);
    return [
      { label: 'All Appointments', date: null },
      { label: format(startDate, 'EEE, MMM d'), date: format(startDate, 'yyyy-MM-dd') },
      { label: format(addDays(startDate, 1), 'EEE, MMM d'), date: format(addDays(startDate, 1), 'yyyy-MM-dd') },
      { label: format(addDays(startDate, 2), 'EEE, MMM d'), date: format(addDays(startDate, 2), 'yyyy-MM-dd') },
      { label: format(addDays(startDate, 3), 'EEE, MMM d'), date: format(addDays(startDate, 3), 'yyyy-MM-dd') },
      { label: format(addDays(startDate, 4), 'EEE, MMM d'), date: format(addDays(startDate, 4), 'yyyy-MM-dd') },
    ];
  };
  
  const dayButtons = generateDayButtons();

  // Filter appointments based on selected day
  const filteredAppointments = selectedDay === null
    ? appointments.filter(apt => {
        if (apt.status !== 'scheduled') return false;
        const aptDate = parseISO(apt.date);
        return aptDate >= today;
      })
    : appointments.filter(apt => {
        if (apt.status !== 'scheduled') return false;
        return apt.date === selectedDay;
      });

  // Get current week (Monday to Sunday) for legend
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const weekEnd = addDays(weekStart, 6); // Sunday

  // Filter appointments for current week (for legend)
  const weekAppointments = appointments.filter(apt => {
    if (apt.status !== 'scheduled') return false;
    const aptDate = parseISO(apt.date);
    return isSameWeek(aptDate, today, { weekStartsOn: 1 });
  });

  // Group appointments by day for legend
  const appointmentsByDay = weekAppointments.reduce((acc, apt) => {
    const aptDate = parseISO(apt.date);
    const dayOfWeek = getDay(aptDate); // 0 = Sunday, 1 = Monday, etc.
    if (!acc[dayOfWeek]) {
      acc[dayOfWeek] = [];
    }
    acc[dayOfWeek].push(apt);
    return acc;
  }, {} as Record<number, Appointment[]>);

  // Calculate available reps for the selected day (only within 75 miles)
  const availableReps = reps
    .map(rep => {
      // Calculate distance from customer
      const distance = calculateDistance(
        customerAddress.lat,
        customerAddress.lng,
        rep.startingAddress.lat,
        rep.startingAddress.lng
      );

      // Only include reps within 75 miles
      if (distance > 75) return null;

      const repAvailability = availability[rep.id] || {};
      
      // Get appointments for this rep
      const repAppointments = appointments.filter(apt => 
        apt.repId === rep.id && 
        apt.status === 'scheduled' &&
        (selectedDay === null || apt.date === selectedDay)
      );
      
      if (selectedDay === null) {
        // Show all available days for the week
        const availableDays: { day: string; date: string; slots: TimeSlot[] }[] = [];
        for (let i = 0; i < 7; i++) {
          const checkDate = addDays(weekStart, i);
          const dayName = format(checkDate, 'EEEE').toLowerCase() as keyof typeof repAvailability;
          const dateStr = format(checkDate, 'yyyy-MM-dd');
          
          const daySlots = repAvailability[dayName] || [];
          const bookedSlots = repAppointments
            .filter(apt => apt.date === dateStr)
            .map(apt => apt.timeSlot);
          const availableSlots = daySlots.filter((slot: TimeSlot) => !bookedSlots.includes(slot));
          
          if (daySlots.length > 0) {
            availableDays.push({
              day: format(checkDate, 'EEE'),
              date: format(checkDate, 'MMM d'),
              slots: availableSlots
            });
          }
        }
        return {
          rep,
          distance,
          availableDays,
          isAvailable: availableDays.length > 0,
          appointments: repAppointments,
          bookedSlots: undefined,
          availableSlots: undefined
        };
      } else {
        // Check availability for the selected day
        const selectedDate = parseISO(selectedDay);
        const dayName = format(selectedDate, 'EEEE').toLowerCase() as keyof typeof repAvailability;
        const daySlots = repAvailability[dayName] || [];
        const bookedSlots = repAppointments
          .filter(apt => apt.date === selectedDay)
          .map(apt => apt.timeSlot);
        const availableSlots = daySlots.filter((slot: TimeSlot) => !bookedSlots.includes(slot));
        const isAvailable = availableSlots.length > 0;
        
        return {
          rep,
          distance,
          availableDays: daySlots.length > 0 ? [{
            day: format(selectedDate, 'EEE'),
            date: format(selectedDate, 'MMM d'),
            slots: availableSlots
          }] : [],
          isAvailable,
          appointments: repAppointments.filter(apt => apt.date === selectedDay),
          bookedSlots,
          availableSlots
        };
      }
    })
    .filter((item) => item !== null)
    .map((item) => item as {
      rep: SalesRep; 
      distance: number; 
      availableDays: { day: string; date: string; slots: TimeSlot[] }[]; 
      isAvailable: boolean;
      appointments: Appointment[];
      bookedSlots?: TimeSlot[];
      availableSlots?: TimeSlot[];
    })
    .sort((a, b) => {
      // Sort by availability first (available first), then by distance
      if (a.isAvailable !== b.isAvailable) {
        return a.isAvailable ? -1 : 1;
      }
      return a.distance - b.distance;
    });

  // Filter reps for map display (only within 75 miles)
  const repsWithin75Miles = reps.filter(rep => {
    const distance = calculateDistance(
      customerAddress.lat,
      customerAddress.lng,
      rep.startingAddress.lat,
      rep.startingAddress.lng
    );
    return distance <= 75;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left side: Map and Legend */}
      <div className="lg:col-span-2 space-y-4">
        {/* Day Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setDayOffset(prev => Math.max(0, prev - 1))}
            disabled={dayOffset === 0}
            className={`px-2 py-2 rounded-md text-xs font-medium transition-colors ${
              dayOffset === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ← Back
          </button>
          {dayButtons.map((button) => (
            <button
              key={button.date || 'all'}
              onClick={() => setSelectedDay(button.date)}
              className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                selectedDay === button.date
                  ? 'bg-navy text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {button.label}
            </button>
          ))}
          <button
            onClick={() => setDayOffset(prev => prev + 1)}
            className="px-2 py-2 rounded-md text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Forward →
          </button>
        </div>

        {/* Map */}
        <div className="h-[500px] w-full rounded-lg overflow-hidden border border-gray-300 relative z-0">
          <MapContainer
            center={[customerAddress.lat, customerAddress.lng]}
            zoom={8}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
            ref={mapRef}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapUpdater customerAddress={customerAddress} />
            
            {/* Customer address marker - Red Pin */}
            <Marker
              position={[customerAddress.lat, customerAddress.lng]}
              icon={L.divIcon({
                className: 'custom-red-marker',
                html: `<svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#EF4444" d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.1 12.5 28.5 12.5 28.5S25 20.6 25 12.5C25 5.6 19.4 0 12.5 0zm0 17c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5 4.5 2 4.5 4.5-2 4.5-4.5 4.5z"/>
                </svg>`,
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
              })}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold text-navy">Customer Location</div>
                  <div className="text-gray-600">{customerAddress.street}</div>
                  <div className="text-gray-600">{customerAddress.city}, {customerAddress.state} {customerAddress.zip}</div>
                </div>
              </Popup>
            </Marker>
            
            {/* Rep markers - Blue pins */}
            {repsWithin75Miles.map((rep) => (
              <Marker
                key={rep.id}
                position={[rep.startingAddress.lat, rep.startingAddress.lng]}
                icon={L.icon({
                  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41]
                })}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold text-navy">{rep.name}</div>
                    <div className="text-gray-600">{rep.startingAddress.street}</div>
                    <div className="text-gray-600">{rep.startingAddress.city}, {rep.startingAddress.state} {rep.startingAddress.zip}</div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Filtered appointments - All blue */}
            {filteredAppointments.map((apt) => {
              const aptDate = parseISO(apt.date);
              const dayOfWeek = getDay(aptDate);
              const color = '#2563EB'; // All appointments are blue
              const rep = apt.repId ? reps.find(r => r.id === apt.repId) : null;
              
              // Calculate distance from customer
              const distance = calculateDistance(
                customerAddress.lat,
                customerAddress.lng,
                apt.address.lat,
                apt.address.lng
              );

              return (
                <Marker
                  key={apt.id}
                  position={[apt.address.lat, apt.address.lng]}
                  icon={L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                    iconSize: [16, 16],
                    iconAnchor: [8, 8],
                  })}
                  eventHandlers={{
                    click: () => setSelectedAppointment(apt),
                  }}
                >
                  <Tooltip>
                    <div className="text-xs">
                      {format(aptDate, 'EEE, MMM d')} - {apt.timeSlot === '10am' ? '10:00 AM' : apt.timeSlot === '2pm' ? '2:00 PM' : '7:00 PM'}
                    </div>
                  </Tooltip>
                  <Popup>
                    <div className="text-sm space-y-1">
                      <div className="font-semibold text-navy">{apt.customerName}</div>
                      <div className="text-gray-600">
                        <strong>Day:</strong> {DAY_NAMES[dayOfWeek]}
                      </div>
                      <div className="text-gray-600">
                        <strong>Date:</strong> {format(aptDate, 'MMM d, yyyy')}
                      </div>
                      <div className="text-gray-600">
                        <strong>Time:</strong> {apt.timeSlot === '10am' ? '10:00 AM' : apt.timeSlot === '2pm' ? '2:00 PM' : '7:00 PM'}
                      </div>
                      <div className="text-gray-600">
                        <strong>Address:</strong> {apt.address.street}, {apt.address.city}, {apt.address.state}
                      </div>
                      <div className="text-gray-600">
                        <strong>Distance:</strong> {distance.toFixed(1)} miles
                      </div>
                      <div className="text-gray-600">
                        <strong>Rep:</strong> {rep ? rep.name : 'Unassigned'}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-lg border border-gray-300 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Map Legend</h3>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: '#2563EB' }}
              ></div>
              <span className="text-gray-700">Appointments</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4">
                <svg viewBox="0 0 25 41" className="w-4 h-4">
                  <path fill="#EF4444" d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.1 12.5 28.5 12.5 28.5S25 20.6 25 12.5C25 5.6 19.4 0 12.5 0zm0 17c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5 4.5 2 4.5 4.5-2 4.5-4.5 4.5z"/>
                </svg>
              </div>
              <span className="text-gray-700">Customer Location</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4">
                <svg viewBox="0 0 25 41" className="w-4 h-4">
                  <path fill="#2563EB" d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.1 12.5 28.5 12.5 28.5S25 20.6 25 12.5C25 5.6 19.4 0 12.5 0zm0 17c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5 4.5 2 4.5 4.5-2 4.5-4.5 4.5z"/>
                </svg>
              </div>
              <span className="text-gray-700">Sales Reps</span>
            </div>
          </div>
        </div>
      </div>

          {/* Right side: Available Reps Section */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg border border-gray-300 p-4 h-full">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Reps (Within 75 mi)
            {selectedDay && (
              <span className="text-xs font-normal text-gray-500 block mt-1">
                {format(parseISO(selectedDay), 'MMM d')}
              </span>
            )}
          </h3>
          {availableReps.length > 0 ? (
            <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
              {availableReps.map(({ rep, distance, availableDays, isAvailable, appointments, bookedSlots, availableSlots }) => (
                <div 
                  key={rep.id} 
                  className={`p-2 rounded hover:bg-gray-100 transition-colors ${
                    isAvailable ? 'bg-green-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className={`font-medium text-sm ${
                          isAvailable ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {rep.name}
                        </div>
                        {isAvailable ? (
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Available</span>
                        ) : (
                          <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">Not Available</span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-navy ml-2 flex-shrink-0">
                      {distance.toFixed(1)} mi
                    </div>
                  </div>
                  
                  {selectedDay && (
                    <div className="mt-2 space-y-1">
                      {bookedSlots && bookedSlots.length > 0 && (
                        <div className="text-xs">
                          <span className="font-semibold text-gray-700">Booked:</span>
                          <span className="ml-1 text-gray-600">
                            {bookedSlots.map(slot => slot === '10am' ? '10:00 AM' : slot === '2pm' ? '2:00 PM' : '7:00 PM').join(', ')}
                          </span>
                        </div>
                      )}
                      {availableSlots && availableSlots.length > 0 && (
                        <div className="text-xs">
                          <span className="font-semibold text-green-700">Available:</span>
                          <span className="ml-1 text-green-600">
                            {availableSlots.map(slot => slot === '10am' ? '10:00 AM' : slot === '2pm' ? '2:00 PM' : '7:00 PM').join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {selectedDay === null && availableDays.length > 0 && (
                    <div className="text-xs text-gray-600 mt-1">
                      {availableDays.map(d => `${d.day} (${d.slots.length} slots)`).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">No reps in this area within 75 miles.</div>
          )}
        </div>
      </div>
    </div>
  );
}

