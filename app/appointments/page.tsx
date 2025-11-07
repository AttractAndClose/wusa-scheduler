'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar, Phone, Mail, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { getAllAppointments, loadReps } from '@/lib/data-loader';
import type { Appointment } from '@/types';
import { format, parseISO, isAfter, startOfDay, addDays, isSameDay } from 'date-fns';

export const dynamic = 'force-dynamic';

function AppointmentsContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reps, setReps] = useState<any[]>([]);
  const [selectedRepId, setSelectedRepId] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [dayOffset, setDayOffset] = useState<number>(0); // 0 = today, 1 = tomorrow, etc.
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

        // Filter appointments: only today and future dates (limit to next 30 days for performance)
        const today = startOfDay(new Date());
        const maxDate = addDays(today, 30);
        const futureAppointments = appointmentsData.filter(apt => {
          const aptDate = startOfDay(parseISO(apt.date));
          return (isAfter(aptDate, today) || aptDate.getTime() === today.getTime()) && 
                 (aptDate.getTime() <= maxDate.getTime());
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
        setReps(repsData);
      } catch (error) {
        console.error('Error loading appointments:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [user, isLoaded, router]);

  // Get unique states from appointments
  const uniqueStates = useMemo(() => {
    const states = new Set<string>();
    appointments.forEach(apt => {
      if (apt.address?.state) {
        states.add(apt.address.state);
      }
    });
    return Array.from(states).sort();
  }, [appointments]);

  // Get selected date
  const selectedDate = useMemo(() => {
    return addDays(startOfDay(new Date()), dayOffset);
  }, [dayOffset]);

  // Filter appointments by rep, state, and date
  const filteredAppointments = useMemo(() => {
    let filtered = [...appointments];

    // Filter by rep
    if (selectedRepId !== 'all') {
      filtered = filtered.filter(apt => apt.repId === selectedRepId);
    }

    // Filter by state
    if (selectedState !== 'all') {
      filtered = filtered.filter(apt => apt.address?.state === selectedState);
    }

    // Filter by selected date
    filtered = filtered.filter(apt => {
      const aptDate = startOfDay(parseISO(apt.date));
      return isSameDay(aptDate, selectedDate);
    });

    // Sort by time
    filtered.sort((a, b) => {
      const timeOrder = { '10am': 1, '2pm': 2, '7pm': 3 };
      return (timeOrder[a.timeSlot as keyof typeof timeOrder] || 0) - 
             (timeOrder[b.timeSlot as keyof typeof timeOrder] || 0);
    });

    return filtered;
  }, [appointments, selectedRepId, selectedState, selectedDate]);

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
            Showing {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''} for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6 border border-gray-300 bg-white">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 md:flex-initial">
              <Label htmlFor="rep-filter" className="text-navy font-medium mb-1 block">Filter by Rep:</Label>
              <Select value={selectedRepId} onValueChange={setSelectedRepId}>
                <SelectTrigger id="rep-filter" className="w-full md:w-64 border-gray-300">
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
            <div className="flex-1 md:flex-initial">
              <Label htmlFor="state-filter" className="text-navy font-medium mb-1 block">Filter by State:</Label>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger id="state-filter" className="w-full md:w-48 border-gray-300">
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {uniqueStates.map(state => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Day Filter Buttons */}
        <Card className="p-4 mb-6 border border-gray-300 bg-white">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDayOffset(prev => Math.max(0, prev - 1))}
              disabled={dayOffset === 0}
              className="flex-shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex gap-2 overflow-x-auto">
              {Array.from({ length: 10 }, (_, i) => {
                const dayDate = addDays(startOfDay(new Date()), dayOffset + i);
                const isToday = dayOffset + i === 0;
                const isSelected = i === 0;
                const dayStr = format(dayDate, 'yyyy-MM-dd');
                const dayName = isToday ? 'Today' : format(dayDate, 'EEE');
                const dayNum = format(dayDate, 'd');
                const month = format(dayDate, 'MMM');
                
                return (
                  <Button
                    key={dayStr}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDayOffset(dayOffset + i)}
                    className={`flex-shrink-0 ${isSelected ? 'bg-primary text-white' : ''}`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-medium">{dayName}</span>
                      <span className="text-xs">{month} {dayNum}</span>
                    </div>
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDayOffset(prev => prev + 1)}
              className="flex-shrink-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {filteredAppointments.length === 0 ? (
          <Card className="p-8 text-center border border-gray-300 bg-white">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-navy/70 text-lg">
              No appointments found for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredAppointments.map((apt) => {
              const repName = getRepName(apt.repId);
              const aptDate = parseISO(apt.date);

              return (
                <Card key={apt.id} className="p-3 border border-gray-300 shadow-sm bg-white hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    {/* Time Column */}
                    <div className="flex-shrink-0 w-20 text-center">
                      <div className="text-base font-bold text-navy">
                        {getTimeDisplay(apt.timeSlot)}
                      </div>
                    </div>

                    {/* Rep Column */}
                    <div className="flex-shrink-0 w-32">
                      <div className="text-xs text-navy/60 mb-0.5">Rep:</div>
                      <div className="text-base font-bold text-navy truncate">{repName}</div>
                    </div>

                    {/* Customer Name Column */}
                    <div className="flex-shrink-0 w-48">
                      <div className="text-xs text-navy/60 mb-0.5">Customer:</div>
                      <div className="text-base font-semibold text-navy truncate">{apt.customerName}</div>
                    </div>

                    {/* Contact Info Column */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4 text-sm text-navy/70">
                        {apt.customerPhone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{apt.customerPhone}</span>
                          </div>
                        )}
                        {apt.customerEmail && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{apt.customerEmail}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Address Column */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-1.5 text-sm text-navy/70">
                        <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                        <span className="truncate">
                          {apt.address.street}, {apt.address.city}, {apt.address.state} {apt.address.zip}
                        </span>
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

