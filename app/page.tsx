'use client';

import { useState, useEffect } from 'react';
import { AddressSearch } from '@/components/booking/AddressSearch';
import { AvailabilityGrid } from '@/components/booking/AvailabilityGrid';
import { BookingModal } from '@/components/booking/BookingModal';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import Link from 'next/link';
import { calculateAvailabilityGrid } from '@/lib/availability';
import { loadReps, loadAvailability, getAllAppointments } from '@/lib/data-loader';
import type { Address, SlotAvailability } from '@/types';

export default function Home() {
  const [customerAddress, setCustomerAddress] = useState<Address | null>(null);
  const [availability, setAvailability] = useState<SlotAvailability[][]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotAvailability | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reps, setReps] = useState<any[]>([]);
  const [availabilityData, setAvailabilityData] = useState<any>({});
  const [appointments, setAppointments] = useState<any[]>([]);

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

  const handleAddressSearch = async (address: Address) => {
    setCustomerAddress(address);
    setIsLoading(true);

    try {
      // Reload appointments to get latest
      const latestAppointments = await getAllAppointments();
      setAppointments(latestAppointments);

      const startDate = new Date();
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
      const startDate = new Date();
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Sales Appointment Scheduler
            </h1>
            <nav className="flex gap-4">
              <Link href="/availability">
                <Button variant="outline">Manage Availability</Button>
              </Link>
              <Link href="/map">
                <Button variant="outline">
                  <MapPin className="mr-2 h-4 w-4" />
                  View Map
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Address Search Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Enter Customer Address
            </h2>
            <AddressSearch onSearch={handleAddressSearch} isLoading={isLoading} />
          </div>

          {/* Availability Grid */}
          {customerAddress && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <p className="mt-4 text-gray-600">Calculating availability...</p>
                </div>
              ) : (
                <AvailabilityGrid
                  availability={availability}
                  onSlotSelect={handleSlotSelect}
                />
              )}
            </div>
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
