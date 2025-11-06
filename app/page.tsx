'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AddressSearch } from '@/components/booking/AddressSearch';
import dynamic from 'next/dynamic';
import { AvailabilityGrid } from '@/components/booking/AvailabilityGrid';
import { BookingModal } from '@/components/booking/BookingModal';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { calculateAvailabilityGrid } from '@/lib/availability';
import { loadReps, loadAvailability, getAllAppointments } from '@/lib/data-loader';
import type { Address, SlotAvailability } from '@/types';
import { startOfWeek, addWeeks } from 'date-fns';

// Dynamically import AddressMap to avoid SSR issues with Leaflet
const AddressMap = dynamic(() => import('@/components/booking/AddressMap').then(mod => ({ default: mod.AddressMap })), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full rounded-lg border border-gray-300 flex items-center justify-center bg-gray-50">
    <div className="text-navy">Loading map...</div>
  </div>
});

function HomeContent() {
  const searchParams = useSearchParams();
  const [customerAddress, setCustomerAddress] = useState<Address | null>(null);
  const [availability, setAvailability] = useState<SlotAvailability[][]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotAvailability | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reps, setReps] = useState<any[]>([]);
  const [availabilityData, setAvailabilityData] = useState<any>({});
  const [appointments, setAppointments] = useState<any[]>([]);
  const [initialAddress, setInitialAddress] = useState<string>('');
  const [weekOffset, setWeekOffset] = useState<number>(0); // 0 = current week, 1 = next week, -1 = previous week

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      const [repsData, availabilityData, appointmentsData] = await Promise.all([
        loadReps(),
        loadAvailability(),
        getAllAppointments()
      ]);
      setReps(repsData);
      setAvailabilityData(availabilityData);
      setAppointments(appointmentsData);
    }
    loadData();
  }, []);

  // Check for address in URL parameters (for Salesforce integration)
  useEffect(() => {
    if (searchParams) {
      // Check for full address string
      const addressParam = searchParams.get('address');
      if (addressParam) {
        setInitialAddress(decodeURIComponent(addressParam));
        return;
      }

      // Check for individual address components
      const street = searchParams.get('street');
      const city = searchParams.get('city');
      const state = searchParams.get('state');
      const zip = searchParams.get('zip');

      if (street && city && state && zip) {
        const fullAddress = `${decodeURIComponent(street)}, ${decodeURIComponent(city)}, ${state.toUpperCase()} ${zip}`;
        setInitialAddress(fullAddress);
      }
    }
  }, [searchParams]);

  // Calculate the start date for the current week view
  const getWeekStartDate = (offset: number = weekOffset) => {
    const today = new Date();
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    return addWeeks(currentWeekStart, offset);
  };

  // Recalculate availability when week changes
  const recalculateAvailability = async (startDate: Date) => {
    if (!customerAddress) return;

    setIsLoading(true);
    try {
      const latestAppointments = await getAllAppointments();
      setAppointments(latestAppointments);

      const grid = calculateAvailabilityGrid(
        customerAddress,
        startDate,
        reps,
        availabilityData,
        latestAppointments,
        5
      );
      setAvailability(grid);
    } catch (error) {
      console.error('Error calculating availability:', error);
      alert('Failed to calculate availability. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressSearch = async (address: Address) => {
    setCustomerAddress(address);
    setWeekOffset(0); // Reset to current week when new address is searched
    setIsLoading(true);

    try {
      // Reload appointments to get latest
      const latestAppointments = await getAllAppointments();
      setAppointments(latestAppointments);

      const startDate = getWeekStartDate();
      const grid = calculateAvailabilityGrid(
        address,
        startDate,
        reps,
        availabilityData,
        latestAppointments,
        5
      );
      setAvailability(grid);
    } catch (error) {
      console.error('Error calculating availability:', error);
      alert('Failed to calculate availability. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeekChange = (direction: 'prev' | 'next') => {
    const newOffset = direction === 'next' ? weekOffset + 1 : weekOffset - 1;
    setWeekOffset(newOffset);
    const newStartDate = getWeekStartDate(newOffset);
    recalculateAvailability(newStartDate);
  };

  const handleSlotSelect = (slot: SlotAvailability) => {
    if (slot.status !== 'none' && customerAddress) {
      setSelectedSlot(slot);
    }
  };

  const handleBookingConfirm = async () => {
    // Reload appointments and recalculate availability
    const latestAppointments = await getAllAppointments();
    setAppointments(latestAppointments);

    if (customerAddress) {
      const startDate = getWeekStartDate();
      const grid = calculateAvailabilityGrid(
        customerAddress,
        startDate,
        reps,
        availabilityData,
        latestAppointments,
        5
      );
      setAvailability(grid);
    }
  };

  return (
    <div className="min-h-screen bg-gray-light">
      {/* Header */}
      <header className="bg-white border-b-2 border-primary shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <img 
                src="/windowsusa-logo.png" 
                alt="Windows USA" 
                className="h-10 w-auto"
              />
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/availability">
                <Button variant="outline" className="border-navy text-navy hover:bg-navy hover:text-white">
                  Manage Availability
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
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Address Search Section */}
          <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
            <h2 className="text-xl font-semibold text-navy mb-4">
              Enter Customer Address
            </h2>
            <AddressSearch 
              onSearch={handleAddressSearch} 
              isLoading={isLoading}
              initialAddress={initialAddress}
            />
          </div>

          {/* Availability Grid and Map */}
          {customerAddress && (
            <>
              {/* Availability Grid */}
              <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="mt-4 text-navy">Calculating availability...</p>
                  </div>
                ) : (
                  <AvailabilityGrid
                    availability={availability}
                    onSlotSelect={handleSlotSelect}
                    onWeekChange={handleWeekChange}
                    weekOffset={weekOffset}
                  />
                )}
              </div>

              {/* Map Section */}
              <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
                <h2 className="text-xl font-semibold text-navy mb-4">
                  Customer Location
                </h2>
                <div className="mb-2 text-sm text-navy/70">
                  <p className="font-medium">{customerAddress.street}</p>
                  <p>{customerAddress.city}, {customerAddress.state} {customerAddress.zip}</p>
                </div>
                <AddressMap address={customerAddress} />
              </div>
            </>
          )}

          {/* Booking Modal */}
          {selectedSlot && customerAddress && (
            <BookingModal
              slot={selectedSlot}
              customerAddress={customerAddress}
              onClose={() => setSelectedSlot(null)}
              onConfirm={handleBookingConfirm}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-navy">Loading...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
