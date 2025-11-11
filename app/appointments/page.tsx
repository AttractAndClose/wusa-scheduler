'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar, Phone, Mail, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { getAllAppointments, loadReps } from '@/lib/data-loader';
import type { Appointment } from '@/types';
import { format, parseISO, isAfter, startOfDay, addDays, isSameDay } from 'date-fns';
import { calculateDistance } from '@/lib/distance';

function AppointmentsContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reps, setReps] = useState<any[]>([]);
  const [selectedRepId, setSelectedRepId] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [dayOffset, setDayOffset] = useState<number | 'all'>(0); // 'all' = all appointments, 0 = today, 1 = tomorrow, etc.
  const [showMileageIssuesOnly, setShowMileageIssuesOnly] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check URL parameter for mileage issues filter
  useEffect(() => {
    const mileageIssuesParam = searchParams.get('mileageIssues');
    if (mileageIssuesParam === 'true') {
      setShowMileageIssuesOnly(true);
    }
  }, [searchParams]);

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
    if (dayOffset === 'all') return null;
    return addDays(startOfDay(new Date()), dayOffset);
  }, [dayOffset]);

  // Calculate distance between appointments for a rep
  // Returns distance and source (home or last appointment)
  const getDistanceFromPrevious = useMemo(() => {
    const distanceMap = new Map<string, { distance: number; source: 'home' | 'last-appointment' }>();
    
    // Group appointments by rep, then sort by date and time
    const appointmentsByRep = new Map<string, Appointment[]>();
    appointments.forEach(apt => {
      if (!apt.repId) return;
      if (!appointmentsByRep.has(apt.repId)) {
        appointmentsByRep.set(apt.repId, []);
      }
      appointmentsByRep.get(apt.repId)!.push(apt);
    });

    // For each rep, calculate distances
    appointmentsByRep.forEach((repAppointments, repId) => {
      const rep = reps.find(r => r.id === repId);
      if (!rep) return;

      // Sort by date and time
      repAppointments.sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        const timeOrder = { '10am': 1, '2pm': 2, '7pm': 3 };
        return (timeOrder[a.timeSlot as keyof typeof timeOrder] || 0) - 
               (timeOrder[b.timeSlot as keyof typeof timeOrder] || 0);
      });

      // Calculate distance for each appointment
      repAppointments.forEach((apt, index) => {
        let fromLat: number, fromLng: number;
        let source: 'home' | 'last-appointment' = 'home';
        
        // Check if there's a previous appointment on the same day
        const sameDayAppointments = repAppointments.filter(a => a.date === apt.date);
        const sameDayIndex = sameDayAppointments.findIndex(a => a.id === apt.id);
        
        if (sameDayIndex > 0) {
          // Use previous appointment on same day
          const prevApt = sameDayAppointments[sameDayIndex - 1];
          fromLat = prevApt.address.lat;
          fromLng = prevApt.address.lng;
          source = 'last-appointment';
        } else {
          // First appointment of the day - use home or previous day's last appointment
          const aptDate = parseISO(apt.date);
          const previousDay = format(addDays(aptDate, -1), 'yyyy-MM-dd');
          const previousDayAppointments = repAppointments.filter(
            a => a.date === previousDay
          );
          
          if (previousDayAppointments.length > 0) {
            // Use last appointment from previous day (sorted by time, so last one is latest)
            const lastPrevApt = previousDayAppointments[previousDayAppointments.length - 1];
            fromLat = lastPrevApt.address.lat;
            fromLng = lastPrevApt.address.lng;
            source = 'last-appointment';
          } else {
            // Use home address
            fromLat = rep.startingAddress.lat;
            fromLng = rep.startingAddress.lng;
            source = 'home';
          }
        }

        const distance = calculateDistance(
          fromLat,
          fromLng,
          apt.address.lat,
          apt.address.lng
        );
        
        distanceMap.set(apt.id, { distance, source });
      });
    });

    return distanceMap;
  }, [appointments, reps]);

  // Filter and group appointments by rep, state, and date
  const groupedAppointments = useMemo(() => {
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
    if (dayOffset !== 'all' && selectedDate) {
      filtered = filtered.filter(apt => {
        const aptDate = startOfDay(parseISO(apt.date));
        return isSameDay(aptDate, selectedDate);
      });
    }

    // Filter by mileage issues (only show appointments with >= 60 miles)
    if (showMileageIssuesOnly) {
      filtered = filtered.filter(apt => {
        const distanceInfo = getDistanceFromPrevious.get(apt.id);
        const distance = distanceInfo?.distance || 0;
        return distance >= 60;
      });
    }

    // Group by date, then by rep
    const grouped = new Map<string, Map<string, Appointment[]>>();
    
    filtered.forEach(apt => {
      if (!grouped.has(apt.date)) {
        grouped.set(apt.date, new Map());
      }
      const dayGroup = grouped.get(apt.date)!;
      
      const repId = apt.repId || 'unassigned';
      if (!dayGroup.has(repId)) {
        dayGroup.set(repId, []);
      }
      dayGroup.get(repId)!.push(apt);
    });

    // Sort appointments within each rep group by time
    grouped.forEach((dayGroup) => {
      dayGroup.forEach((repAppointments) => {
        repAppointments.sort((a, b) => {
          const timeOrder = { '10am': 1, '2pm': 2, '7pm': 3 };
          return (timeOrder[a.timeSlot as keyof typeof timeOrder] || 0) - 
                 (timeOrder[b.timeSlot as keyof typeof timeOrder] || 0);
        });
      });
    });

    // Sort days
    const sortedDays = Array.from(grouped.keys()).sort();

    return { grouped, sortedDays };
  }, [appointments, selectedRepId, selectedState, dayOffset, selectedDate, showMileageIssuesOnly, getDistanceFromPrevious]);

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
            {dayOffset === 'all' 
              ? `Showing all appointments`
              : `Showing appointments for ${format(selectedDate!, 'EEEE, MMMM d, yyyy')}`
            }
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
            <div className="flex-1 md:flex-initial">
              <Label htmlFor="mileage-filter" className="text-navy font-medium mb-1 block">Show Mileage Issues:</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="mileage-filter"
                  checked={showMileageIssuesOnly}
                  onChange={(e) => setShowMileageIssuesOnly(e.target.checked)}
                  className="w-4 h-4 text-navy border-gray-300 rounded focus:ring-navy cursor-pointer"
                />
                <label htmlFor="mileage-filter" className="text-sm text-navy cursor-pointer">
                  Only show appointments with 60+ miles
                </label>
              </div>
            </div>
          </div>
        </Card>

        {/* Day Filter Buttons */}
        <Card className="p-4 mb-6 border border-gray-300 bg-white">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (dayOffset === 'all') {
                  setDayOffset(0);
                } else {
                  setDayOffset(Math.max(0, dayOffset - 1));
                }
              }}
              disabled={dayOffset !== 'all' && dayOffset === 0}
              className="flex-shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex gap-2 overflow-x-auto">
              {/* All Appointments Button */}
              <Button
                variant={dayOffset === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDayOffset('all')}
                className={`flex-shrink-0 ${dayOffset === 'all' ? 'bg-primary text-white' : ''}`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-xs font-medium">All</span>
                  <span className="text-xs">Appts</span>
                </div>
              </Button>
              
              {/* Show 10 day buttons */}
              {Array.from({ length: 10 }, (_, i) => {
                const currentDayOffset = typeof dayOffset === 'number' ? dayOffset : 0;
                const dayDate = addDays(startOfDay(new Date()), currentDayOffset + i);
                const isToday = currentDayOffset + i === 0;
                const isSelected = dayOffset === 'all' ? false : i === 0;
                const dayStr = format(dayDate, 'yyyy-MM-dd');
                const dayName = isToday ? 'Today' : format(dayDate, 'EEE');
                const dayNum = format(dayDate, 'd');
                const month = format(dayDate, 'MMM');
                
                return (
                  <Button
                    key={dayStr}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDayOffset(currentDayOffset + i)}
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
              onClick={() => {
                if (dayOffset === 'all') {
                  setDayOffset(0);
                } else {
                  setDayOffset(dayOffset + 1);
                }
              }}
              className="flex-shrink-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {groupedAppointments.sortedDays.length === 0 ? (
          <Card className="p-8 text-center border border-gray-300 bg-white">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-navy/70 text-lg">
              {dayOffset === 'all' 
                ? 'No appointments found'
                : `No appointments found for ${format(selectedDate!, 'EEEE, MMMM d, yyyy')}`
              }
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {groupedAppointments.sortedDays.map((date) => {
              const dayGroup = groupedAppointments.grouped.get(date)!;
              const dayDate = parseISO(date);
              
              return (
                <div key={date} className="space-y-4">
                  {/* Day Header */}
                  <div className="sticky top-0 bg-navy py-2 px-4 rounded-lg border border-navy z-10">
                    <h2 className="text-lg font-bold text-white">
                      {format(dayDate, 'EEEE, MMMM d, yyyy')}
                    </h2>
                  </div>

                  {/* Rep Groups */}
                  {Array.from(dayGroup.entries()).map(([repId, repAppointments]) => {
                    const repName = getRepName(repId === 'unassigned' ? undefined : repId);
                    const rep = repId !== 'unassigned' ? reps.find(r => r.id === repId) : null;
                    
                    // Get the last location address (home or last appointment)
                    let lastLocationAddress: string | null = null;
                    if (rep && repAppointments.length > 0) {
                      const firstApt = repAppointments[0];
                      const distanceInfo = getDistanceFromPrevious.get(firstApt.id);
                      const source = distanceInfo?.source || 'home';
                      
                      if (source === 'home' && rep.startingAddress) {
                        lastLocationAddress = `${rep.startingAddress.street}, ${rep.startingAddress.city}, ${rep.startingAddress.state} ${rep.startingAddress.zip}`;
                      } else if (source === 'last-appointment') {
                        // Find the last appointment before this day
                        const aptDate = parseISO(firstApt.date);
                        const previousDay = format(addDays(aptDate, -1), 'yyyy-MM-dd');
                        const allRepAppointments = appointments.filter(a => a.repId === repId);
                        const previousDayAppointments = allRepAppointments.filter(a => a.date === previousDay);
                        
                        if (previousDayAppointments.length > 0) {
                          // Sort by time and get the last one
                          previousDayAppointments.sort((a, b) => {
                            const timeOrder = { '10am': 1, '2pm': 2, '7pm': 3 };
                            return (timeOrder[a.timeSlot as keyof typeof timeOrder] || 0) - 
                                   (timeOrder[b.timeSlot as keyof typeof timeOrder] || 0);
                          });
                          const lastPrevApt = previousDayAppointments[previousDayAppointments.length - 1];
                          lastLocationAddress = `${lastPrevApt.address.street}, ${lastPrevApt.address.city}, ${lastPrevApt.address.state} ${lastPrevApt.address.zip}`;
                        } else {
                          // Check if there's a previous appointment on the same day (shouldn't happen for first, but just in case)
                          const sameDayBefore = repAppointments.filter(a => {
                            const timeOrder = { '10am': 1, '2pm': 2, '7pm': 3 };
                            return a.date === firstApt.date && 
                                   (timeOrder[a.timeSlot as keyof typeof timeOrder] || 0) < 
                                   (timeOrder[firstApt.timeSlot as keyof typeof timeOrder] || 0);
                          });
                          if (sameDayBefore.length > 0) {
                            sameDayBefore.sort((a, b) => {
                              const timeOrder = { '10am': 1, '2pm': 2, '7pm': 3 };
                              return (timeOrder[a.timeSlot as keyof typeof timeOrder] || 0) - 
                                     (timeOrder[b.timeSlot as keyof typeof timeOrder] || 0);
                            });
                            const lastSameDay = sameDayBefore[sameDayBefore.length - 1];
                            lastLocationAddress = `${lastSameDay.address.street}, ${lastSameDay.address.city}, ${lastSameDay.address.state} ${lastSameDay.address.zip}`;
                          }
                        }
                      }
                    }
                    
                    return (
                      <div key={repId} className="space-y-2">
                        {/* Rep Header */}
                        <div className="px-3 py-2 bg-gray-200 rounded border border-gray-200">
                          <h3 className="text-sm font-semibold text-navy">{repName}</h3>
                          {lastLocationAddress && (
                            <div className="text-xs text-navy/90 mt-1">{lastLocationAddress}</div>
                          )}
                        </div>

                        {/* Appointments for this rep */}
                        {repAppointments.map((apt, index) => {
                          const distanceInfo = getDistanceFromPrevious.get(apt.id);
                          const distance = distanceInfo?.distance || 0;
                          const source = distanceInfo?.source || 'home';
                          const isLongDistance = distance >= 60;

                          return (
                            <Card 
                              key={apt.id} 
                              className={`p-3 border border-gray-300 shadow-sm hover:shadow-md transition-shadow ${
                                isLongDistance ? 'bg-red-100' : 'bg-white'
                              }`}
                            >
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
                                  <div className="flex flex-col gap-0.5 text-sm text-navy/70">
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

                                {/* Distance Column */}
                                <div className="flex-shrink-0 w-32 text-right">
                                  <div className="text-xs text-navy/60 mb-0.5">Miles:</div>
                                  <div className={`text-base font-semibold ${isLongDistance ? 'text-red-600' : 'text-green-600'}`}>
                                    {distance.toFixed(1)} mi
                                  </div>
                                  <div className="text-xs text-navy/50 mt-0.5">
                                    {source === 'home' ? 'from Home' : 'from Last Appt'}
                                  </div>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
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

