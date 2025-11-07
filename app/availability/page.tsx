'use client';

import { useState, useEffect, Suspense } from 'react';
import { useUser } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar, Phone, Mail, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { loadReps, loadAvailability, getAllAppointments, loadLeads } from '@/lib/data-loader';
import { calculateAvailabilityGrid } from '@/lib/availability';
import { calculateDistance } from '@/lib/distance';
import { format, parseISO, startOfWeek, addWeeks, addDays, startOfDay, isBefore } from 'date-fns';
import type { SalesRep, Appointment, Availability, TimeSlot, Address, AvailableRep, Lead } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customerAddress, setCustomerAddress] = useState<Address | null>(null);
  const [addressAvailability, setAddressAvailability] = useState<any[][]>([]);
  const [selectedRepId, setSelectedRepId] = useState<string>('all');
  const [expandedReps, setExpandedReps] = useState<Set<string>>(new Set());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ rep: SalesRep; date: string; timeSlot: TimeSlot } | null>(null);
  const [leadsForSlot, setLeadsForSlot] = useState<Array<Lead & { distance: number }>>([]);

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
      const [repsData, availabilityData, appointmentsData, leadsData] = await Promise.all([
        loadReps(),
        loadAvailability(),
        getAllAppointments(),
        loadLeads()
      ]);
      setReps(repsData);
      setAvailability(availabilityData);
      setAppointments(appointmentsData);
      setLeads(leadsData);
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

  // Get rep location (home address or last appointment for the date)
  const getRepLocation = (rep: SalesRep, date: string): [number, number] => {
    // Find appointments for this rep on this date, sorted by time slot (latest first)
    const dayAppointments = appointments
      .filter(apt => apt.repId === rep.id && apt.date === date && apt.status === 'scheduled')
      .sort((a, b) => {
        const orderA = a.timeSlot === '10am' ? 1 : a.timeSlot === '2pm' ? 2 : 3;
        const orderB = b.timeSlot === '10am' ? 1 : b.timeSlot === '2pm' ? 2 : 3;
        return orderB - orderA; // Latest first
      });

    if (dayAppointments.length > 0) {
      // Use last appointment location
      return [dayAppointments[0].address.lat, dayAppointments[0].address.lng];
    }

    // No appointments, use home address
    return [rep.startingAddress.lat, rep.startingAddress.lng];
  };

  // Handle time slot click - show leads modal
  const handleTimeSlotClick = (rep: SalesRep, date: string, timeSlot: TimeSlot) => {
    const repLocation = getRepLocation(rep, date);
    
    // Calculate distance for each lead and sort by distance
    const leadsWithDistance = leads.map(lead => ({
      ...lead,
      distance: calculateDistance(
        repLocation[0],
        repLocation[1],
        lead.address.lat,
        lead.address.lng
      )
    })).sort((a, b) => a.distance - b.distance);

    setLeadsForSlot(leadsWithDistance);
    setSelectedTimeSlot({ rep, date, timeSlot });
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
    <AppLayout>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Rep Filter Dropdown */}
        <Card className="p-4 mb-6 border border-gray-300 bg-white">
          <div className="flex items-center gap-4">
            <Label htmlFor="rep-filter" className="text-navy font-medium">Filter by Rep:</Label>
            <Select value={selectedRepId} onValueChange={setSelectedRepId}>
              <SelectTrigger id="rep-filter" className="w-64 border-gray-300">
                <SelectValue placeholder="All Reps" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reps</SelectItem>
                {reps.map(rep => (
                  <SelectItem key={rep.id} value={rep.id}>
                    {rep.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

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
          {reps
            .filter(rep => selectedRepId === 'all' || rep.id === selectedRepId)
            .map((rep) => {
              const repAvailability = availability[rep.id] || {};
              const repAppointments = getRepAppointments(rep.id);
              const upcomingAppointments = repAppointments
                .filter(apt => apt.date >= format(new Date(), 'yyyy-MM-dd'))
                .sort((a, b) => a.date.localeCompare(b.date));

              // Generate 3 weeks of availability
              const weeks = [0, 1, 2].map(weekOffset => {
                const weekStart = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
                const weekEnd = addDays(weekStart, 6);
                return {
                  start: weekStart,
                  end: weekEnd,
                  dates: Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
                };
              });

              return (
                <Card key={rep.id} className="p-6 border border-gray-300 shadow-md bg-white">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-navy flex items-center gap-2">
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
                          <MapPin className="h-4 w-4" />
                          {rep.startingAddress.street}, {rep.startingAddress.city}, {rep.startingAddress.state} {rep.startingAddress.zip}
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

                  {/* 3 Weeks of Availability */}
                  <div className="space-y-6">
                    {weeks.map((week, weekIndex) => (
                      <div key={weekIndex}>
                        <h3 className="text-sm font-medium text-navy mb-3">
                          Week of {format(week.start, 'MMM d')} - {format(week.end, 'MMM d, yyyy')}
                        </h3>
                        <div className="grid grid-cols-7 gap-2">
                          {week.dates.map((date, dayIndex) => {
                            const dayName = DAYS[dayIndex];
                            const dateString = format(date, 'yyyy-MM-dd');
                            const today = startOfDay(new Date());
                            const dateDay = startOfDay(date);
                            const isToday = format(dateDay, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
                            const isPast = isBefore(dateDay, today);
                            const dayAppointments = repAppointments.filter(
                              apt => apt.date === dateString && apt.status === 'scheduled'
                            );

                            return (
                              <div key={dayIndex} className="space-y-1">
                                <div className={`text-xs font-medium text-center py-1 rounded ${
                                  isToday 
                                    ? 'bg-red-500 text-white' 
                                    : isPast 
                                    ? 'bg-gray-300 text-gray-500' 
                                    : 'text-navy'
                                }`}>
                                  <div>{format(date, 'EEE').toUpperCase()}</div>
                                  <div className={`text-sm font-bold ${
                                    isToday 
                                      ? 'text-white' 
                                      : isPast 
                                      ? 'text-gray-500' 
                                      : 'text-navy'
                                  }`}>
                                    {format(date, 'd')}
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  {TIME_SLOTS.map((slot) => {
                                    const isAvailable = repAvailability[dayName]?.includes(slot);
                                    const hasAppointment = dayAppointments.some(apt => apt.timeSlot === slot);
                                    
                                    return (
                                      <div
                                        key={slot}
                                        onClick={() => {
                                          if (!isPast && isAvailable && !hasAppointment) {
                                            handleTimeSlotClick(rep, dateString, slot);
                                          }
                                        }}
                                        className={`text-xs p-2 rounded text-center ${
                                          isPast
                                            ? 'bg-gray-200 text-gray-400 opacity-50 cursor-not-allowed'
                                            : hasAppointment
                                            ? 'bg-orange-100 text-orange-800 font-medium border border-orange-300 cursor-default'
                                            : isAvailable
                                            ? 'bg-green-100 text-green-800 font-medium border border-green-300 cursor-pointer hover:bg-green-200 transition-colors'
                                            : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                        }`}
                                      >
                                        {slot === '10am' ? '10:00 AM' :
                                         slot === '2pm' ? '2:00 PM' : '7:00 PM'}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {upcomingAppointments.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-300">
                      <h3 className="text-sm font-medium text-navy mb-3">
                        Upcoming Appointments
                      </h3>
                      <div className="space-y-2">
                        {upcomingAppointments.slice(0, expandedReps.has(rep.id) ? upcomingAppointments.length : 5).map((apt) => (
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
                          <button
                            onClick={() => {
                              const newExpanded = new Set(expandedReps);
                              if (newExpanded.has(rep.id)) {
                                newExpanded.delete(rep.id);
                              } else {
                                newExpanded.add(rep.id);
                              }
                              setExpandedReps(newExpanded);
                            }}
                            className="w-full flex items-center justify-center gap-2 text-xs text-navy/70 hover:text-navy pt-2 transition-colors"
                          >
                            {expandedReps.has(rep.id) ? (
                              <>
                                <ChevronUp className="h-4 w-4" />
                                Show Less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4" />
                                Show {upcomingAppointments.length - 5} More
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </main>

        {/* Leads Modal */}
        <Dialog open={!!selectedTimeSlot} onOpenChange={(open) => !open && setSelectedTimeSlot(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Available Leads for {selectedTimeSlot?.rep.name}
              </DialogTitle>
              <DialogDescription>
                {selectedTimeSlot && (
                  <>
                    {format(parseISO(selectedTimeSlot.date), 'EEEE, MMMM d, yyyy')} at{' '}
                    {selectedTimeSlot.timeSlot === '10am' ? '10:00 AM' :
                     selectedTimeSlot.timeSlot === '2pm' ? '2:00 PM' : '7:00 PM'}
                    {' '}• Sorted by distance from rep location
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 mt-4">
              {leadsForSlot.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No leads available
                </div>
              ) : (
                leadsForSlot.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-navy mb-1">{lead.name}</div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            {lead.address.street}, {lead.address.city}, {lead.address.state} {lead.address.zip}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Status: {lead.status || 'new'}
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-lg font-bold text-navy">
                          {lead.distance.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500">miles</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </AppLayout>
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

