'use client';

import { useState, useEffect, Suspense } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar, Phone, Mail, Clock, MapPin } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { getAllAppointments, loadReps } from '@/lib/data-loader';
import type { Appointment } from '@/types';
import { format, parseISO, isAfter, startOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

function AppointmentsContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [reps, setReps] = useState<any[]>([]);
  const [selectedRepId, setSelectedRepId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!user) {
      router.push('/sign-in');
      return;
    }

    async function loadData() {
      setIsLoading(true);
      try {
        const [appointmentsData, repsData] = await Promise.all([
          getAllAppointments(),
          loadReps()
        ]);

        // Filter appointments: only today and future dates
        const today = startOfDay(new Date());
        const futureAppointments = appointmentsData.filter(apt => {
          const aptDate = startOfDay(parseISO(apt.date));
          return isAfter(aptDate, today) || aptDate.getTime() === today.getTime();
        });

        // Sort by date and time
        futureAppointments.sort((a, b) => {
          const dateCompare = a.date.localeCompare(b.date);
          if (dateCompare !== 0) return dateCompare;
          
          const timeOrder = { '10am': 1, '2pm': 2, '7pm': 3 };
          return (timeOrder[a.timeSlot as keyof typeof timeOrder] || 0) - 
                 (timeOrder[b.timeSlot as keyof typeof timeOrder] || 0);
        });

        setAppointments(futureAppointments);
        setFilteredAppointments(futureAppointments);
        setReps(repsData);
      } catch (error) {
        console.error('Error loading appointments:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [user, isLoaded, router]);

  // Filter appointments by selected rep
  useEffect(() => {
    if (selectedRepId === 'all') {
      setFilteredAppointments(appointments);
    } else {
      setFilteredAppointments(appointments.filter(apt => apt.repId === selectedRepId));
    }
  }, [selectedRepId, appointments]);

  const getRepName = (repId?: string) => {
    if (!repId) return 'Unassigned';
    const rep = reps.find(r => r.id === repId);
    return rep?.name || 'Unknown Rep';
  };

  const getRepColor = (repId?: string) => {
    if (!repId) return '#999999';
    const rep = reps.find(r => r.id === repId);
    return rep?.color || '#999999';
  };

  const getTimeDisplay = (timeSlot: string) => {
    switch (timeSlot) {
      case '10am': return '10:00 AM';
      case '2pm': return '2:00 PM';
      case '7pm': return '7:00 PM';
      default: return timeSlot;
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-gray-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-navy">Loading appointments...</div>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-navy mb-2">Scheduled Appointments</h1>
          <p className="text-navy/70">
            Showing {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''} from today onwards
          </p>
        </div>

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

        {filteredAppointments.length === 0 ? (
          <Card className="p-8 text-center border border-gray-300 bg-white">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-navy/70 text-lg">
              {selectedRepId === 'all' 
                ? 'No upcoming appointments'
                : `No upcoming appointments for ${getRepName(selectedRepId)}`
              }
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((apt) => {
              const repName = getRepName(apt.repId);
              const aptDate = parseISO(apt.date);
              const isToday = format(aptDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

              return (
                <Card key={apt.id} className="p-6 border border-gray-300 shadow-sm bg-white hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-semibold text-navy">{apt.customerName}</h3>
                        {isToday && (
                          <span className="px-2 py-1 text-xs font-medium bg-primary text-white rounded">
                            Today
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-navy/70">
                            <Calendar className="h-4 w-4" />
                            <span className="font-medium text-navy">
                              {format(aptDate, 'EEEE, MMMM d, yyyy')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-navy/70">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium text-navy">{getTimeDisplay(apt.timeSlot)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-navy/70">
                            <span className="font-medium text-navy">{repName}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {apt.customerPhone && (
                            <div className="flex items-center gap-2 text-sm text-navy/70">
                              <Phone className="h-4 w-4" />
                              <span>{apt.customerPhone}</span>
                            </div>
                          )}
                          {apt.customerEmail && (
                            <div className="flex items-center gap-2 text-sm text-navy/70">
                              <Mail className="h-4 w-4" />
                              <span>{apt.customerEmail}</span>
                            </div>
                          )}
                          <div className="flex items-start gap-2 text-sm text-navy/70">
                            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>
                              {apt.address.street}, {apt.address.city}, {apt.address.state} {apt.address.zip}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </AppLayout>
  );
}

export default function AppointmentsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="text-navy">Loading...</div>
      </div>
    }>
      <AppointmentsContent />
    </Suspense>
  );
}

