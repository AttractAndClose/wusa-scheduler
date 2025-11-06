'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Phone, Mail } from 'lucide-react';
import Link from 'next/link';
import { loadReps, loadAvailability, getAllAppointments } from '@/lib/data-loader';
import { format, parseISO } from 'date-fns';
import type { SalesRep, Appointment, Availability, TimeSlot } from '@/types';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const TIME_SLOTS: TimeSlot[] = ['10am', '2pm', '7pm'];
const DAYS: (keyof Availability[string])[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function AvailabilityPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [reps, setReps] = useState<SalesRep[]>([]);
  const [availability, setAvailability] = useState<Availability>({});
  const [appointments, setAppointments] = useState<Appointment[]>([]);
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

  const getRepAppointments = (repId: string) => {
    return appointments.filter(
      apt => apt.repId === repId && apt.status === 'scheduled'
    );
  };

  const getAppointmentsForDate = (repId: string, date: string) => {
    return appointments.filter(
      apt => apt.repId === repId && apt.date === date && apt.status === 'scheduled'
    );
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
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-navy">
                Sales Rep Availability Management
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

