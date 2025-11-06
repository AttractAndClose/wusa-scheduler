'use client';

import { useState, useEffect, Suspense } from 'react';
import { useUser } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Phone, Mail } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { loadReps, loadAvailability, getAllAppointments } from '@/lib/data-loader';
import { calculateAvailabilityGrid } from '@/lib/availability';
import { format, parseISO } from 'date-fns';
import type { SalesRep, Appointment, Availability, TimeSlot, Address, AvailableRep } from '@/types';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const TIME_SLOTS: TimeSlot[] = ['10am', '2pm', '7pm'];
const DAYS: (keyof Availability[string])[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function AvailabilityContent() {
  const { isLoaded, isSignedIn, user } = useUser();
  const searchParams = useSearchParams();
  const [reps, setReps] = useState<SalesRep[]>([]);
  const [availability, setAvailability] = useState<Availability>({});
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customerAddress, setCustomerAddress] = useState<Address | null>(null);
  const [addressAvailability, setAddressAvailability] = useState<any[][]>([]);

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      window.location.href = '/sign-in';
    }
  }, [isLoaded, isSignedIn]);

  // Parse address from URL parameters
  useEffect(() => {
    if (searchParams) {
      const addressParam = searchParams.get('address');
      if (addressParam) {
        const address = parseAddressFromString(decodeURIComponent(addressParam));
        if (address) {
          setCustomerAddress(address);
        }
      } else {
        // Check for individual address components
        const street = searchParams.get('street');
        const city = searchParams.get('city');
        const state = searchParams.get('state');
        const zip = searchParams.get('zip');

        if (street && city && state && zip) {
          const address = parseAddressFromString(
            `${decodeURIComponent(street)}, ${decodeURIComponent(city)}, ${state.toUpperCase()} ${zip}`
          );
          if (address) {
            setCustomerAddress(address);
          }
        }
      }
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [repsData, availabilityData, appointmentsData] = await Promise.all([
        loadReps(),
        loadAvailability(),
        getAllAppointments()
      ]);
      setReps(repsData);
      setAvailability(availabilityData);
      setAppointments(appointmentsData);
      setIsLoading(false);
    }
    loadData();
  }, []);

  // Calculate availability when address is set
  useEffect(() => {
    if (customerAddress && reps.length > 0 && Object.keys(availability).length > 0) {
      const startDate = new Date();
      const grid = calculateAvailabilityGrid(
        customerAddress,
        startDate,
        reps,
        availability,
        appointments,
        5
      );
      setAddressAvailability(grid);
    }
  }, [customerAddress, reps, availability, appointments]);

  const getRepAppointments = (repId: string) => {
    return appointments.filter(
      apt => apt.repId === repId && apt.status === 'scheduled'
    );
  };

  const getRepAvailabilityForAddress = (repId: string) => {
    if (!customerAddress || addressAvailability.length === 0) return null;
    
    // Count how many slots this rep is available for
    let availableSlots = 0;
    addressAvailability.forEach((daySlots) => {
      daySlots.forEach((slot) => {
        if (slot.availableReps.some((rep: AvailableRep) => rep.repId === repId)) {
          availableSlots++;
        }
      });
    });
    
    return availableSlots;
  };

  const parseAddressFromString = (addressString: string): Address | null => {
    const trimmed = addressString.trim();
    const states = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'];
    
    // Try parsing with commas first
    const commaParts = trimmed.split(',').map(p => p.trim());
    
    if (commaParts.length >= 3) {
      const street = commaParts[0];
      const city = commaParts[1];
      const stateZip = commaParts[2];
      
      const stateZipMatch = stateZip.match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i);
      
      if (stateZipMatch) {
        const state = stateZipMatch[1].toUpperCase();
        const zip = stateZipMatch[2];
        
        if (states.includes(state)) {
          return createAddress(street, city, state, zip);
        }
      }
    }
    
    // Try parsing without commas
    const stateZipRegex = /\b([A-Z]{2})\s+(\d{5}(?:-\d{4})?)\b/i;
    const stateZipMatch = trimmed.match(stateZipRegex);
    
    if (stateZipMatch) {
      const state = stateZipMatch[1].toUpperCase();
      const zip = stateZipMatch[2];
      const stateZipIndex = stateZipMatch.index!;
      
      if (states.includes(state)) {
        const beforeStateZip = trimmed.substring(0, stateZipIndex).trim();
        const words = beforeStateZip.split(/\s+/);
        
        if (words.length >= 2) {
          const city = words[words.length - 1];
          const street = words.slice(0, -1).join(' ');
          return createAddress(street, city, state, zip);
        }
      }
    }

    return null;
  };

  const createAddress = (street: string, city: string, state: string, zip: string): Address => {
    const stateCenters: Record<string, { lat: number; lng: number }> = {
      'GA': { lat: 33.7490, lng: -84.3880 },
      'TX': { lat: 32.7767, lng: -96.7970 },
      'AR': { lat: 34.7465, lng: -92.2896 },
      'AL': { lat: 33.5186, lng: -86.8025 },
      'MS': { lat: 32.2988, lng: -90.1848 },
      'TN': { lat: 36.1627, lng: -86.7816 },
      'LA': { lat: 30.4515, lng: -91.1871 },
      'NC': { lat: 35.2271, lng: -80.8431 },
      'SC': { lat: 34.0007, lng: -81.0348 },
      'OK': { lat: 35.4676, lng: -97.5164 },
      'MO': { lat: 38.6270, lng: -90.1994 },
      'IL': { lat: 38.6270, lng: -90.1994 },
      'NJ': { lat: 39.8339, lng: -74.8721 }
    };

    const center = stateCenters[state] || { lat: 33.7490, lng: -84.3880 };
    const zipNum = parseInt(zip.substring(0, 2)) || 0;
    
    return {
      street: street.trim(),
      city: city.trim(),
      state: state.toUpperCase(),
      zip: zip.trim(),
      lat: center.lat + (zipNum % 10 - 5) * 0.05,
      lng: center.lng + (zipNum % 10 - 5) * 0.05,
    };
  };

  if (!isLoaded || !isSignedIn || isLoading) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-navy">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-light">
      {/* Header */}
      <header className="bg-white border-b-2 border-primary shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center">
                <img 
                  src="/windowsusa-logo.png" 
                  alt="Windows USA" 
                  className="h-10 w-auto"
                />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {customerAddress && (
          <div className="mb-6 bg-white rounded-lg shadow-md border border-gray-300 p-4">
            <h2 className="text-lg font-semibold text-navy mb-2">Availability for Address</h2>
            <p className="text-sm text-navy/70">
              {customerAddress.street}, {customerAddress.city}, {customerAddress.state} {customerAddress.zip}
            </p>
            {addressAvailability.length > 0 && (
              <div className="mt-3 text-sm">
                <span className="text-navy font-medium">
                  {addressAvailability.flat().filter(slot => slot.availableCount > 0).length} available time slots
                </span>
                {' '}across the next 5 days
              </div>
            )}
          </div>
        )}
        
        <div className="space-y-6">
          {reps.map((rep) => {
            const repAvailability = availability[rep.id] || {};
            const repAppointments = getRepAppointments(rep.id);
            const upcomingAppointments = repAppointments
              .filter(apt => apt.date >= format(new Date(), 'yyyy-MM-dd'))
              .sort((a, b) => a.date.localeCompare(b.date));

            return (
              <Card key={rep.id} className="p-6 border border-gray-300 shadow-md">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-navy flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: rep.color }}
                      ></div>
                      {rep.name}
                    </h2>
                    <div className="mt-2 space-y-1 text-sm text-navy/70">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {rep.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {rep.phone}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {repAppointments.length} appointment{repAppointments.length !== 1 ? 's' : ''} scheduled
                      </div>
                      {customerAddress && (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full bg-green-500"></div>
                          {getRepAvailabilityForAddress(rep.id) || 0} available slots for this address
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-sm font-medium text-navy mb-3">
                    Weekly Availability
                  </h3>
                  <div className="grid grid-cols-7 gap-2">
                    {DAYS.map((day) => (
                      <div key={day} className="space-y-1">
                        <div className="text-xs font-medium text-navy capitalize">
                          {day.substring(0, 3)}
                        </div>
                        <div className="space-y-1">
                          {TIME_SLOTS.map((slot) => {
                            const isAvailable = repAvailability[day]?.includes(slot);
                            return (
                              <div
                                key={slot}
                                className={`text-xs p-1 rounded ${
                                  isAvailable
                                    ? 'bg-primary/20 text-primary font-medium border border-primary/30'
                                    : 'bg-gray-light text-gray-dark'
                                }`}
                              >
                                {slot}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {upcomingAppointments.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-300">
                    <h3 className="text-sm font-medium text-navy mb-3">
                      Upcoming Appointments
                    </h3>
                    <div className="space-y-2">
                      {upcomingAppointments.slice(0, 5).map((apt) => (
                        <div
                          key={apt.id}
                          className="flex items-center justify-between p-2 bg-gray-light rounded text-sm"
                        >
                          <div>
                            <div className="font-medium text-navy">
                              {apt.customerName}
                            </div>
                            <div className="text-navy/70">
                              {format(parseISO(apt.date), 'MMM d, yyyy')} at{' '}
                              {apt.timeSlot === '10am' ? '10:00 AM' :
                               apt.timeSlot === '2pm' ? '2:00 PM' : '7:00 PM'}
                            </div>
                            <div className="text-navy/50 text-xs">
                              {apt.address.city}, {apt.address.state}
                            </div>
                          </div>
                        </div>
                      ))}
                      {upcomingAppointments.length > 5 && (
                        <div className="text-xs text-navy/50 text-center pt-2">
                          +{upcomingAppointments.length - 5} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default function AvailabilityPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-navy">Loading...</p>
        </div>
      </div>
    }>
      <AvailabilityContent />
    </Suspense>
  );
}

