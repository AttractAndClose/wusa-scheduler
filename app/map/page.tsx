'use client';

import { useState, useEffect, Suspense } from 'react';
import { useUser } from '@clerk/nextjs';
import dynamicImport from 'next/dynamic';
import { AppLayout } from '@/components/layout/AppLayout';
import { loadReps, getAllAppointments, loadAvailability, loadLeads } from '@/lib/data-loader';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Dynamically import MapPageView to avoid SSR issues with Leaflet
const MapPageView = dynamicImport(() => import('@/components/map/MapPageView').then(mod => ({ default: mod.MapPageView })), {
  ssr: false,
  loading: () => <div className="h-[500px] w-full rounded-lg border border-gray-300 flex items-center justify-center bg-gray-50">
    <div className="text-navy">Loading map...</div>
  </div>
});

function MapContent() {
  const { isLoaded, isSignedIn } = useUser();
  const [reps, setReps] = useState<any[]>([]);
  const [availabilityData, setAvailabilityData] = useState<any>({});
  const [appointments, setAppointments] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      window.location.href = '/sign-in';
    }
  }, [isLoaded, isSignedIn]);

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      if (!isLoaded) return; // Wait for Clerk to load first
      
      setIsLoading(true);
      try {
        console.log('Starting to load data...');
        const [repsData, availabilityData, appointmentsData, leadsData] = await Promise.all([
          loadReps(),
          loadAvailability(),
          getAllAppointments(),
          loadLeads()
        ]);
        console.log('Data loaded:', {
          reps: repsData.length,
          availability: Object.keys(availabilityData).length,
          appointments: appointmentsData.length,
          leads: leadsData.length
        });
        setReps(repsData);
        setAvailabilityData(availabilityData);
        setAppointments(appointmentsData);
        setLeads(leadsData);
      } catch (error) {
        console.error('Error loading data:', error);
        // Set empty data on error so page can still render
        setReps([]);
        setAvailabilityData({});
        setAppointments([]);
        setLeads([]);
      } finally {
        setIsLoading(false);
        console.log('Loading complete');
      }
    }
    
    if (isLoaded) {
      loadData();
    }
  }, [isLoaded]);

  // Show loading while Clerk is initializing
  if (!isLoaded) {
    return (
      <AppLayout>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-navy">Initializing...</p>
          </div>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="w-full px-5 py-8">
        <div className="w-full">
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-navy">Referral Map</h1>
          </div>
          
          {/* Map Section */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-navy">Loading referral map data...</p>
            </div>
          ) : (
            <MapPageView
              appointments={appointments}
              reps={reps}
              availability={availabilityData}
              leads={leads}
            />
          )}
        </div>
      </main>
    </AppLayout>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-navy">Loading...</p>
        </div>
      </div>
    }>
      <MapContent />
    </Suspense>
  );
}

