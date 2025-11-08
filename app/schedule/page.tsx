'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CustomerInfoForm } from '@/components/booking/CustomerInfoForm';
import dynamic from 'next/dynamic';
import { AvailabilityGrid } from '@/components/booking/AvailabilityGrid';
import { BookingModal } from '@/components/booking/BookingModal';
import { AppLayout } from '@/components/layout/AppLayout';
import { calculateAvailabilityGrid } from '@/lib/availability';
import { loadReps, loadAvailability, getAllAppointments, loadLeads } from '@/lib/data-loader';
import type { Address, SlotAvailability, Lead } from '@/types';
import { addDays } from 'date-fns';

// Dynamically import EnhancedScheduleMap to avoid SSR issues with Leaflet
const EnhancedScheduleMap = dynamic(() => import('@/components/booking/EnhancedScheduleMap').then(mod => ({ default: mod.EnhancedScheduleMap })), {
  ssr: false,
  loading: () => <div className="h-[500px] w-full rounded-lg border border-gray-300 flex items-center justify-center bg-gray-50">
    <div className="text-navy">Loading map...</div>
  </div>
});

// Declare Google Maps types
declare global {
  interface Window {
    google: any;
  }
}

function ScheduleContent() {
  const searchParams = useSearchParams();
  
  // Parse URL params synchronously on first render to set initial state
  const parseInitialUrlParams = () => {
    if (!searchParams) return {};
    
    const customerData: {
      leadId?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      address?: string;
      faradayCreditPropensity?: string;
      thinkUnlimitedScore?: string;
      efScore?: string;
    } = {};

    const leadId = searchParams.get('leadId');
    const firstName = searchParams.get('firstName');
    const lastName = searchParams.get('lastName');
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');
    const faradayCreditPropensity = searchParams.get('faradayCreditPropensity');
    const thinkUnlimitedScore = searchParams.get('thinkUnlimitedScore');
    const efScore = searchParams.get('efScore');
    
    const addressParam = searchParams.get('address');
    if (addressParam) {
      customerData.address = decodeURIComponent(addressParam);
    } else {
      const street = searchParams.get('street');
      const city = searchParams.get('city');
      const state = searchParams.get('state');
      const zip = searchParams.get('zip');

      if (street && city && state && zip) {
        customerData.address = `${decodeURIComponent(street)}, ${decodeURIComponent(city)}, ${state.toUpperCase()} ${zip}`;
      }
    }

    if (leadId) customerData.leadId = decodeURIComponent(leadId);
    if (firstName) customerData.firstName = decodeURIComponent(firstName);
    if (lastName) customerData.lastName = decodeURIComponent(lastName);
    if (email) customerData.email = decodeURIComponent(email);
    if (phone) customerData.phone = decodeURIComponent(phone);
    if (faradayCreditPropensity) customerData.faradayCreditPropensity = decodeURIComponent(faradayCreditPropensity);
    if (thinkUnlimitedScore) customerData.thinkUnlimitedScore = decodeURIComponent(thinkUnlimitedScore);
    if (efScore) customerData.efScore = decodeURIComponent(efScore);

    return customerData;
  };

  const initialUrlData = parseInitialUrlParams();
  
  const [customerAddress, setCustomerAddress] = useState<Address | null>(null);
  const [availability, setAvailability] = useState<SlotAvailability[][]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotAvailability | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reps, setReps] = useState<any[]>([]);
  const [availabilityData, setAvailabilityData] = useState<any>({});
  const [appointments, setAppointments] = useState<any[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [initialAddress, setInitialAddress] = useState<string>(initialUrlData.address || '');
  const [weekOffset, setWeekOffset] = useState<number>(0); // 0 = current week, 1 = next week, -1 = previous week
  const [customerInfo, setCustomerInfo] = useState<{
    leadId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    faradayCreditPropensity?: string;
    thinkUnlimitedScore?: string;
    efScore?: string;
  }>({
    leadId: initialUrlData.leadId,
    firstName: initialUrlData.firstName,
    lastName: initialUrlData.lastName,
    email: initialUrlData.email,
    phone: initialUrlData.phone,
    faradayCreditPropensity: initialUrlData.faradayCreditPropensity,
    thinkUnlimitedScore: initialUrlData.thinkUnlimitedScore,
    efScore: initialUrlData.efScore,
  });
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const [initialCustomerData, setInitialCustomerData] = useState<{
    leadId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    faradayCreditPropensity?: string;
    thinkUnlimitedScore?: string;
    efScore?: string;
  }>(initialUrlData);

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      const [repsData, availabilityData, appointmentsData, leadsData] = await Promise.all([
        loadReps(),
        loadAvailability(),
        getAllAppointments(),
        loadLeads()
      ]);
      setReps(repsData);
      setAvailabilityData(availabilityData);
      setAppointments(appointmentsData);
      setLeads(leadsData);
    }
    loadData();
  }, []);
  
  // Find lead when leadId changes
  useEffect(() => {
    if (customerInfo.leadId && leads.length > 0) {
      const lead = leads.find(l => l.id === customerInfo.leadId);
      setCurrentLead(lead || null);
    } else {
      setCurrentLead(null);
    }
  }, [customerInfo.leadId, leads]);

  // Check for customer info in URL parameters (for Salesforce integration)
  useEffect(() => {
    if (searchParams) {
      const customerData = parseInitialUrlParams();
      if (Object.keys(customerData).length > 0) {
        setInitialCustomerData(customerData);
        setCustomerInfo({
          leadId: customerData.leadId,
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          email: customerData.email,
          phone: customerData.phone,
          faradayCreditPropensity: customerData.faradayCreditPropensity,
          thinkUnlimitedScore: customerData.thinkUnlimitedScore,
          efScore: customerData.efScore,
        });
        if (customerData.address) {
          setInitialAddress(customerData.address);
        }
      }
    }
  }, [searchParams]);

  // Calculate the start date - always start from today
  const getStartDate = (offset: number = weekOffset) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day
    // Add offset days (0 = today, 7 = next week, -7 = previous week)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + (offset * 7));
    return startDate;
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
    console.log('Address search triggered:', address);
    console.log('Address coordinates:', { lat: address.lat, lng: address.lng });
    setCustomerAddress(address);
    setWeekOffset(0); // Reset to today when new address is searched
    setIsLoading(true);

    try {
      // Ensure we have all data loaded before calculating
      const [repsData, availabilityDataLoaded, latestAppointments] = await Promise.all([
        loadReps(),
        loadAvailability(),
        getAllAppointments()
      ]);
      
      console.log('Loaded reps:', repsData.length);
      console.log('Loaded availability keys:', Object.keys(availabilityDataLoaded).length);
      console.log('Loaded appointments:', latestAppointments.length);
      
      // Update state
      setReps(repsData);
      setAvailabilityData(availabilityDataLoaded);
      setAppointments(latestAppointments);

      const startDate = getStartDate();
      console.log('Start date:', startDate);
      const grid = calculateAvailabilityGrid(
        address,
        startDate,
        repsData,
        availabilityDataLoaded,
        latestAppointments,
        5
      );
      console.log('Availability grid calculated:', grid);
      console.log('First slot:', grid[0]?.[0]);
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
    const newStartDate = getStartDate(newOffset);
    recalculateAvailability(newStartDate);
  };

  const handleSlotSelect = (slot: SlotAvailability) => {
    if (slot.status !== 'none' && customerAddress) {
      setSelectedSlot(slot);
    }
  };

  const handleRefresh = () => {
    // Clear all customer data and reset form
    setCustomerAddress(null);
    setAvailability([]);
    setSelectedSlot(null);
    setWeekOffset(0);
    setCustomerInfo({});
    setInitialCustomerData({});
    setInitialAddress('');
  };

  const handleBookingConfirm = async () => {
    // Reload appointments and recalculate availability
    const latestAppointments = await getAllAppointments();
    setAppointments(latestAppointments);

    if (customerAddress) {
      const startDate = getStartDate();
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
    <AppLayout>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Customer Info Section */}
          <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
            <h2 className="text-xl font-semibold text-navy mb-4">
              Customer Info
            </h2>
            <CustomerInfoForm 
              onSearch={handleAddressSearch} 
              isLoading={isLoading}
              initialData={initialCustomerData}
              onCustomerInfoChange={setCustomerInfo}
              isReadOnly={Object.keys(initialCustomerData).length > 0}
            />
          </div>

          {/* Availability Grid */}
          {customerAddress && (
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
          )}

          {/* Map Section */}
          {customerAddress && (
            <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
              <h2 className="text-xl font-semibold text-navy mb-4">
                Appointment Map
              </h2>
              <div className="mb-4 text-sm text-navy/70">
                <p className="font-medium">{customerAddress.street}</p>
                <p>{customerAddress.city}, {customerAddress.state} {customerAddress.zip}</p>
              </div>
              <EnhancedScheduleMap
                customerAddress={customerAddress}
                appointments={appointments}
                reps={reps}
                availability={availabilityData}
              />
            </div>
          )}

        </div>

        {/* Booking Modal */}
        {selectedSlot && customerAddress && (
          <BookingModal
            slot={selectedSlot}
            customerAddress={customerAddress}
            customerInfo={customerInfo}
            onClose={() => setSelectedSlot(null)}
            onConfirm={handleBookingConfirm}
            onRefresh={handleRefresh}
          />
        )}
      </main>
    </AppLayout>
  );
}

export default function SchedulePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-navy">Loading...</p>
        </div>
      </div>
    }>
      <ScheduleContent />
    </Suspense>
  );
}

