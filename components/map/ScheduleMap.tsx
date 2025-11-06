'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import type { SalesRep, Appointment, Address } from '@/types';
import { format, parseISO } from 'date-fns';

// Fix for default marker icons in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

interface ScheduleMapProps {
  reps: SalesRep[];
  appointments: Appointment[];
  customerAddress: Address | null;
  selectedDate: string;
  selectedTimeSlot: '10am' | '2pm' | '7pm';
  availabilityGrid?: any[][];
}

export default function ScheduleMap({
  reps,
  appointments,
  customerAddress,
  selectedDate,
  selectedTimeSlot,
  availabilityGrid
}: ScheduleMapProps) {
  const mapRef = useRef<L.Map | null>(null);

  // Calculate center point (average of all rep locations or customer location)
  const getCenter = (): [number, number] => {
    if (customerAddress) {
      return [customerAddress.lat, customerAddress.lng];
    }
    if (reps.length > 0) {
      const avgLat = reps.reduce((sum, rep) => sum + rep.startingAddress.lat, 0) / reps.length;
      const avgLng = reps.reduce((sum, rep) => sum + rep.startingAddress.lng, 0) / reps.length;
      return [avgLat, avgLng];
    }
    return [33.4484, -112.0740]; // Default to Phoenix
  };

  // Get rep's anchor point for the selected date/time
  const getRepAnchorPoint = (rep: SalesRep): [number, number] => {
    // Find appointments for this rep on this date before the selected time slot
    const timeSlotOrder = { '10am': 1, '2pm': 2, '7pm': 3 };
    const selectedOrder = timeSlotOrder[selectedTimeSlot];
    
    const earlierAppointments = appointments
      .filter(apt => 
        apt.repId === rep.id && 
        apt.date === selectedDate && 
        timeSlotOrder[apt.timeSlot as keyof typeof timeSlotOrder] < selectedOrder &&
        apt.status === 'scheduled'
      )
      .sort((a, b) => 
        timeSlotOrder[b.timeSlot as keyof typeof timeSlotOrder] - 
        timeSlotOrder[a.timeSlot as keyof typeof timeSlotOrder]
      );

    if (earlierAppointments.length > 0) {
      const latest = earlierAppointments[0];
      return [latest.address.lat, latest.address.lng];
    }

    return [rep.startingAddress.lat, rep.startingAddress.lng];
  };

  // Get available reps for the selected slot
  const getAvailableReps = (): string[] => {
    if (!availabilityGrid || availabilityGrid.length === 0) return [];
    const daySlots = availabilityGrid[0];
    const slot = daySlots?.find((s: any) => s.timeSlot === selectedTimeSlot);
    return slot?.availableReps?.map((r: any) => r.repId) || [];
  };

  const availableRepIds = getAvailableReps();
  const center = getCenter();

  return (
    <div className="h-[600px] w-full">
      <MapContainer
        center={center}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Rep starting locations */}
        {reps.map((rep) => {
          const anchorPoint = getRepAnchorPoint(rep);
          const isAvailable = availableRepIds.includes(rep.id);
          
          return (
            <div key={rep.id}>
              {/* Rep anchor point marker */}
              <Marker
                position={anchorPoint}
                icon={L.divIcon({
                  className: 'custom-marker',
                  html: `<div style="background-color: ${rep.color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                  iconSize: [20, 20],
                  iconAnchor: [10, 10],
                })}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">{rep.name}</div>
                    <div className="text-gray-600">{rep.phone}</div>
                    <div className="text-gray-600">{rep.email}</div>
                    <div className="mt-2">
                      {isAvailable ? (
                        <span className="text-green-600 font-medium">✓ Available</span>
                      ) : (
                        <span className="text-red-600 font-medium">✗ Not Available</span>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>

              {/* Service radius circle */}
              <Circle
                center={anchorPoint}
                radius={45 * 1609.34} // Convert 45 miles to meters
                pathOptions={{
                  color: isAvailable ? rep.color : '#gray',
                  fillColor: isAvailable ? rep.color : '#gray',
                  fillOpacity: 0.1,
                  opacity: 0.3,
                }}
              />
            </div>
          );
        })}

        {/* Scheduled appointments */}
        {appointments.map((apt) => {
          const rep = reps.find(r => r.id === apt.repId);
          if (!rep) return null;

          return (
            <Marker
              key={apt.id}
              position={[apt.address.lat, apt.address.lng]}
              icon={L.divIcon({
                className: 'custom-marker',
                html: `<div style="background-color: #EF4444; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8],
              })}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">{apt.customerName}</div>
                  <div className="text-gray-600">{format(parseISO(apt.date), 'MMM d, yyyy')}</div>
                  <div className="text-gray-600">
                    {apt.timeSlot === '10am' ? '10:00 AM' :
                     apt.timeSlot === '2pm' ? '2:00 PM' : '7:00 PM'}
                  </div>
                  <div className="text-gray-600">Rep: {rep.name}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Customer location */}
        {customerAddress && (
          <Marker
            position={[customerAddress.lat, customerAddress.lng]}
            icon={L.divIcon({
              className: 'custom-marker',
              html: `<div style="background-color: #F59E0B; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            })}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">Customer Location</div>
                <div className="text-gray-600">{customerAddress.street}</div>
                <div className="text-gray-600">
                  {customerAddress.city}, {customerAddress.state} {customerAddress.zip}
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

