'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import dynamicImport from 'next/dynamic';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin } from 'lucide-react';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { loadReps, getAllAppointments, loadAvailability } from '@/lib/data-loader';
import { format, addDays, parseISO } from 'date-fns';
import { calculateAvailabilityGrid } from '@/lib/availability';
import type { SalesRep, Appointment, Address } from '@/types';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Dynamically import Leaflet to avoid SSR issues
const MapComponent = dynamicImport(() => import('@/components/map/ScheduleMap'), {
  ssr: false,
  loading: () => <div className="h-[600px] bg-gray-200 flex items-center justify-center">Loading map...</div>
});

export default function MapPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [reps, setReps] = useState<SalesRep[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availability, setAvailability] = useState<any>({});
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<'10am' | '2pm' | '7pm'>('2pm');
  const [customerAddress, setCustomerAddress] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      window.location.href = '/sign-in';
    }
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [repsData, appointmentsData, availabilityData] = await Promise.all([
        loadReps(),
        getAllAppointments(),
        loadAvailability()
      ]);
      setReps(repsData);
      setAppointments(appointmentsData);
      setAvailability(availabilityData);
      setIsLoading(false);
    }
    loadData();
  }, []);

  // Generate date options (next 7 days)
  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i);
    return {
      value: format(date, 'yyyy-MM-dd'),
      label: format(date, 'MMM d, yyyy')
    };
  });

  // Get appointments for selected date/time
  const selectedAppointments = appointments.filter(
    apt => apt.date === selectedDate && apt.timeSlot === selectedTimeSlot && apt.status === 'scheduled'
  );

  // Calculate availability if customer address is set
  const [availabilityGrid, setAvailabilityGrid] = useState<any[][]>([]);
  
  useEffect(() => {
    if (customerAddress && reps.length > 0 && Object.keys(availability).length > 0) {
      const startDate = parseISO(selectedDate);
      const grid = calculateAvailabilityGrid(
        customerAddress,
        startDate,
        reps,
        availability,
        appointments,
        1
      );
      setAvailabilityGrid(grid);
    }
  }, [customerAddress, selectedDate, reps, availability, appointments]);

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
            <nav className="flex items-center gap-4">
              <Link href="/availability">
                <Button variant="outline" className="border-navy text-navy hover:bg-navy hover:text-white">
                  Manage Availability
                </Button>
              </Link>
              <Link href="/serviceable-zips">
                <Button variant="outline" className="border-navy text-navy hover:bg-navy hover:text-white">
                  Serviceable Zip Codes
                </Button>
              </Link>
              <Link href="/map">
                <Button variant="outline" className="border-navy text-navy hover:bg-navy hover:text-white">
                  <MapPin className="mr-2 h-4 w-4" />
                  View Map
                </Button>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Controls */}
          <Card className="p-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Date
                </label>
                <Select value={selectedDate} onValueChange={setSelectedDate}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dateOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Time
                </label>
                <Select value={selectedTimeSlot} onValueChange={(value: '10am' | '2pm' | '7pm') => setSelectedTimeSlot(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10am">10:00 AM</SelectItem>
                    <SelectItem value="2pm">2:00 PM</SelectItem>
                    <SelectItem value="7pm">7:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Address (optional)
                </label>
                <input
                  type="text"
                  placeholder="Enter address to see coverage"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  onChange={(e) => {
                    // Simple address parsing - in production would use geocoding
                    const value = e.target.value;
                    if (value) {
                      // For demo, use a default location
                      setCustomerAddress({
                        street: value,
                        city: 'Phoenix',
                        state: 'AZ',
                        zip: '85001',
                        lat: 33.4484,
                        lng: -112.0740
                      });
                    } else {
                      setCustomerAddress(null);
                    }
                  }}
                />
              </div>
            </div>
          </Card>

          {/* Map */}
          {!isLoading && (
            <Card className="p-0 overflow-hidden">
              <MapComponent
                reps={reps}
                appointments={selectedAppointments}
                customerAddress={customerAddress}
                selectedDate={selectedDate}
                selectedTimeSlot={selectedTimeSlot}
                availabilityGrid={availabilityGrid}
              />
            </Card>
          )}

          {/* Legend */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Legend</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                <span>Rep Starting Location</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span>Scheduled Appointment</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 border-2 border-blue-300 rounded-full"></div>
                <span>Service Radius (45 miles)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                <span>Customer Location</span>
              </div>
            </div>
          </Card>

          {/* Available Reps */}
          {customerAddress && availabilityGrid.length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Available Reps for {format(parseISO(selectedDate), 'MMM d')} at{' '}
                {selectedTimeSlot === '10am' ? '10:00 AM' :
                 selectedTimeSlot === '2pm' ? '2:00 PM' : '7:00 PM'}
              </h3>
              <div className="space-y-2">
                {availabilityGrid[0]?.map((slot: any) => {
                  if (slot.timeSlot === selectedTimeSlot) {
                    return (
                      <div key={slot.date}>
                        {slot.availableReps.length > 0 ? (
                          <div className="space-y-1">
                            {slot.availableReps.map((rep: any) => (
                              <div key={rep.repId} className="text-sm p-2 bg-green-50 rounded">
                                ✅ {rep.repName} - {rep.distance.toFixed(1)} miles away
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">No reps available</div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

