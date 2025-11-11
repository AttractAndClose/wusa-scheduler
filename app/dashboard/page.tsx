'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppLayout } from '@/components/layout/AppLayout';
import { getAllAppointments, loadReps, loadAvailability, loadLeads } from '@/lib/data-loader';
import { calculateDistance } from '@/lib/distance';
import { getAllServiceableZips } from '@/lib/serviceable-zips';
import { loadAssignments, loadAffiliatePurchaseZips } from '@/lib/territory-map/dataLoader';
import { getZipCodeCoordinatesBatch, approximateZipCodeCoordinates } from '@/lib/zip-coordinates';
import type { Appointment, Lead, SalesRep, Availability, Address, TimeSlot } from '@/types';
import type { TerritoryAssignment } from '@/types/territory-map';
import { 
  format, 
  parseISO, 
  startOfDay,
  addDays
} from 'date-fns';
import { 
  Users, 
  Calendar, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  MapPin, 
  CheckCircle,
  BarChart3,
  Target
} from 'lucide-react';
import Link from 'next/link';

interface DateRange {
  start: Date;
  end: Date;
}

function DashboardContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [reps, setReps] = useState<SalesRep[]>([]);
  const [availability, setAvailability] = useState<Availability>({});
  const [serviceableZips, setServiceableZips] = useState<any[]>([]);
  const [territoryAssignments, setTerritoryAssignments] = useState<TerritoryAssignment>({});
  const [affiliatePurchaseZips, setAffiliatePurchaseZips] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [zipCodeCoverageData, setZipCodeCoverageData] = useState<{
    coveredZipCodesCount: number;
    totalTerritoryZips: number;
    zipCodeCoverage: number;
  }>({ coveredZipCodesCount: 0, totalTerritoryZips: 0, zipCodeCoverage: 0 });
  
  // Date filtering state - preset options
  type DatePreset = 'today' | 'tomorrow' | 'next7' | 'next14' | 'next30' | 'next60' | 'next90' | 'thisWeek' | 'nextWeek' | 'thisMonth' | 'nextMonth';
  const [datePreset, setDatePreset] = useState<DatePreset>('today');

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!user) {
      router.push('/sign-in');
      return;
    }

    async function loadData() {
      setIsLoading(true);
      try {
        const [appointmentsData, leadsData, repsData, availabilityData, zipsData, assignmentsData, affiliateZipsData] = await Promise.all([
          getAllAppointments(),
          loadLeads(),
          loadReps(),
          loadAvailability(),
          getAllServiceableZips(),
          loadAssignments(),
          loadAffiliatePurchaseZips()
        ]);

        setAppointments(appointmentsData);
        setLeads(leadsData);
        setReps(repsData);
        setAvailability(availabilityData);
        setServiceableZips(zipsData);
        setTerritoryAssignments(assignmentsData);
        setAffiliatePurchaseZips(affiliateZipsData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [user, isLoaded, router]);

  // Calculate zip code coverage when reps and territory assignments are loaded
  useEffect(() => {
    async function calculateZipCodeCoverage() {
      if (reps.length === 0 || Object.keys(territoryAssignments).length === 0) {
        setZipCodeCoverageData({ coveredZipCodesCount: 0, totalTerritoryZips: 0, zipCodeCoverage: 0 });
        return;
      }

      const territoryZipCodes = Object.keys(territoryAssignments);
      const totalTerritoryZips = territoryZipCodes.length;
      
      // Get coordinates for all territory zip codes
      const zipCoordinatesMap = await getZipCodeCoordinatesBatch(territoryZipCodes);
      
      // For zip codes without coordinates from boundaries, use approximation
      const coveredZipCodes = new Set<string>();
      
      for (const zipCode of territoryZipCodes) {
        let coords = zipCoordinatesMap.get(zipCode);
        
        // If no coordinates from boundaries, try to get from serviceable zips or approximate
        if (!coords) {
          const serviceableZip = serviceableZips.find(z => z.zip === zipCode);
          if (serviceableZip && serviceableZip.state) {
            coords = approximateZipCodeCoordinates(zipCode, serviceableZip.state) || undefined;
          } else {
            coords = approximateZipCodeCoordinates(zipCode) || undefined;
          }
        }
        
        if (!coords) {
          // Skip if we still don't have coordinates
          continue;
        }
        
        // Check if any rep can cover this zip (within 45 miles of home address)
        const canCover = reps.some(rep => {
          const distance = calculateDistance(
            rep.startingAddress.lat,
            rep.startingAddress.lng,
            coords!.lat,
            coords!.lng
          );
          return distance <= 45;
        });
        
        if (canCover) {
          coveredZipCodes.add(zipCode);
        }
      }

      // Calculate coverage percentage
      const zipCodeCoverage = totalTerritoryZips > 0
        ? (coveredZipCodes.size / totalTerritoryZips) * 100
        : 0;

      setZipCodeCoverageData({
        coveredZipCodesCount: coveredZipCodes.size,
        totalTerritoryZips,
        zipCodeCoverage
      });
    }

    calculateZipCodeCoverage();
  }, [reps, territoryAssignments, serviceableZips]);

  // Calculate date range based on preset
  const dateRange = useMemo((): DateRange => {
    const today = startOfDay(new Date());
    
    switch (datePreset) {
      case 'today':
        return { start: today, end: today };
      case 'tomorrow':
        const tomorrow = addDays(today, 1);
        return { start: tomorrow, end: tomorrow };
      case 'next7':
        return { start: today, end: addDays(today, 6) };
      case 'next14':
        return { start: today, end: addDays(today, 13) };
      case 'next30':
        return { start: today, end: addDays(today, 29) };
      case 'next60':
        return { start: today, end: addDays(today, 59) };
      case 'next90':
        return { start: today, end: addDays(today, 89) };
      case 'thisWeek':
        // Monday to Sunday of current week
        const dayOfWeek = today.getDay();
        const monday = addDays(today, -((dayOfWeek + 6) % 7));
        const sunday = addDays(monday, 6);
        return { start: monday, end: sunday };
      case 'nextWeek':
        // Monday to Sunday of next week
        const nextMonday = addDays(today, 7 - ((today.getDay() + 6) % 7));
        const nextSunday = addDays(nextMonday, 6);
        return { start: nextMonday, end: nextSunday };
      case 'thisMonth':
        // First day to last day of current month
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return { start: startOfDay(firstDay), end: startOfDay(lastDay) };
      case 'nextMonth':
        // First day to last day of next month
        const nextFirstDay = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const nextLastDay = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        return { start: startOfDay(nextFirstDay), end: startOfDay(nextLastDay) };
      default:
        return { start: today, end: addDays(today, 29) };
    }
  }, [datePreset]);

  // Filter data by date range
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const aptDate = startOfDay(parseISO(apt.date));
      return (aptDate.getTime() >= dateRange.start.getTime() && 
              aptDate.getTime() <= dateRange.end.getTime());
    });
  }, [appointments, dateRange]);

  // Total leads: all leads (not filtered by date or appointment status)
  const totalLeads = useMemo(() => {
    return leads.length;
  }, [leads]);

  // Leads by source
  const leadsBySource = useMemo(() => {
    const referral = leads.filter(l => l.leadSource === 'Referral').length;
    const affiliate = leads.filter(l => l.leadSource === 'Affiliate').length;
    const other = leads.filter(l => l.leadSource !== 'Referral' && l.leadSource !== 'Affiliate').length;
    return { referral, affiliate, other };
  }, [leads]);

  // Calculate distance for appointments (mileage issues)
  const appointmentDistances = useMemo(() => {
    const distanceMap = new Map<string, number>();
    
    // Group appointments by rep
    const appointmentsByRep = new Map<string, Appointment[]>();
    filteredAppointments.forEach(apt => {
      if (!apt.repId) return;
      if (!appointmentsByRep.has(apt.repId)) {
        appointmentsByRep.set(apt.repId, []);
      }
      appointmentsByRep.get(apt.repId)!.push(apt);
    });

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

      repAppointments.forEach((apt, index) => {
        let fromLat: number, fromLng: number;
        
        // Check if there's a previous appointment on the same day
        const sameDayAppointments = repAppointments.filter(a => a.date === apt.date);
        const sameDayIndex = sameDayAppointments.findIndex(a => a.id === apt.id);
        
        if (sameDayIndex > 0) {
          const prevApt = sameDayAppointments[sameDayIndex - 1];
          fromLat = prevApt.address.lat;
          fromLng = prevApt.address.lng;
        } else {
          const aptDate = parseISO(apt.date);
          const previousDay = format(addDays(aptDate, -1), 'yyyy-MM-dd');
          const previousDayAppointments = repAppointments.filter(a => a.date === previousDay);
          
          if (previousDayAppointments.length > 0) {
            const lastPrevApt = previousDayAppointments[previousDayAppointments.length - 1];
            fromLat = lastPrevApt.address.lat;
            fromLng = lastPrevApt.address.lng;
          } else {
            fromLat = rep.startingAddress.lat;
            fromLng = rep.startingAddress.lng;
          }
        }

        const distance = calculateDistance(
          fromLat,
          fromLng,
          apt.address.lat,
          apt.address.lng
        );
        
        distanceMap.set(apt.id, distance);
      });
    });

    return distanceMap;
  }, [filteredAppointments, reps]);

  // Metrics calculations
  const metrics = useMemo(() => {
    // Basic counts
    const totalAppointments = filteredAppointments.length;
    const scheduledAppointments = filteredAppointments.filter(a => a.status === 'scheduled').length;
    const completedAppointments = filteredAppointments.filter(a => a.status === 'completed').length;
    const cancelledAppointments = filteredAppointments.filter(a => a.status === 'cancelled').length;
    
    // Fulfillment %: booked appointments vs available appointments from rep availability
    // Calculate total available appointments from rep availability
    let totalAvailableSlots = 0;
    const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    Object.keys(availability).forEach(repId => {
      const repAvailability = availability[repId];
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(day => {
        const slots = repAvailability[day as keyof typeof repAvailability] || [];
        // Calculate how many times this day appears in the date range
        const dayOccurrences = Math.floor(days / 7) + (days % 7 > 0 ? 1 : 0);
        totalAvailableSlots += slots.length * dayOccurrences;
      });
    });
    
    const fulfilmentRate = totalAvailableSlots > 0 
      ? (scheduledAppointments / totalAvailableSlots) * 100 
      : 0;

    // Mileage issues (>= 60 miles)
    const appointmentsWithMileageIssues = filteredAppointments.filter(apt => {
      const distance = appointmentDistances.get(apt.id) || 0;
      return distance >= 60;
    }).length;

    // Average distance
    const distances = Array.from(appointmentDistances.values());
    const avgDistance = distances.length > 0
      ? distances.reduce((sum, d) => sum + d, 0) / distances.length
      : 0;

    // Appointments by time slot
    const appointmentsByTimeSlot: Record<TimeSlot, number> = {
      '10am': 0,
      '2pm': 0,
      '7pm': 0
    };
    filteredAppointments.forEach(apt => {
      if (apt.timeSlot in appointmentsByTimeSlot) {
        appointmentsByTimeSlot[apt.timeSlot as TimeSlot]++;
      }
    });

    // Leads by status (all leads, not filtered by date)
    const leadsByStatus = {
      new: leads.filter(l => l.status === 'new' || !l.status).length,
      contacted: leads.filter(l => l.status === 'contacted').length,
      qualified: leads.filter(l => l.status === 'qualified').length,
      converted: leads.filter(l => l.status === 'converted').length
    };

    // Rep utilization (appointments per rep)
    const repUtilization = new Map<string, number>();
    filteredAppointments.forEach(apt => {
      if (apt.repId) {
        repUtilization.set(apt.repId, (repUtilization.get(apt.repId) || 0) + 1);
      }
    });
    const avgAppointmentsPerRep = repUtilization.size > 0
      ? Array.from(repUtilization.values()).reduce((sum, count) => sum + count, 0) / repUtilization.size
      : 0;

    // Total Territory Zips: count unique zip codes in territory assignments
    const totalTerritoryZips = zipCodeCoverageData.totalTerritoryZips || Object.keys(territoryAssignments).length;

    // Available appointments: total available slots minus booked appointments
    const availableAppointments = Math.max(0, totalAvailableSlots - scheduledAppointments);

    return {
      totalLeads,
      leadsBySource,
      totalAppointments,
      scheduledAppointments,
      completedAppointments,
      cancelledAppointments,
      fulfilmentRate,
      appointmentsWithMileageIssues,
      avgDistance,
      appointmentsByTimeSlot,
      leadsByStatus,
      avgAppointmentsPerRep,
      coveredZipCodesCount: zipCodeCoverageData.coveredZipCodesCount,
      availableAppointments,
      totalReps: reps.length,
      activeReps: repUtilization.size,
      totalTerritoryZips,
      zipCodeCoverage: zipCodeCoverageData.zipCodeCoverage,
      affiliatePurchaseZipsCount: affiliatePurchaseZips.length
    };
  }, [totalLeads, leadsBySource, filteredAppointments, appointmentDistances, availability, dateRange, reps, leads, territoryAssignments, affiliatePurchaseZips, zipCodeCoverageData]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-navy">Loading dashboard...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-navy">Dashboard</h1>
              <p className="text-navy/70 mt-1">
                {format(dateRange.start, 'MMM d, yyyy')} - {format(dateRange.end, 'MMM d, yyyy')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={datePreset} onValueChange={(value) => setDatePreset(value as DatePreset)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="tomorrow">Tomorrow</SelectItem>
                  <SelectItem value="next7">Next 7 Days</SelectItem>
                  <SelectItem value="next14">Next 14 Days</SelectItem>
                  <SelectItem value="next30">Next 30 Days</SelectItem>
                  <SelectItem value="next60">Next 60 Days</SelectItem>
                  <SelectItem value="next90">Next 90 Days</SelectItem>
                  <SelectItem value="thisWeek">This Week</SelectItem>
                  <SelectItem value="nextWeek">Next Week</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="nextMonth">Next Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Top Row: Leads by Source */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Leads */}
            <Card className="p-6 bg-white h-full">
              <div className="flex items-center justify-between h-full">
                <div>
                  <p className="text-sm text-navy/70">Total Leads</p>
                  <p className="text-3xl font-bold text-navy mt-2">{metrics.totalLeads.toLocaleString()}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </Card>

            {/* Referral Leads */}
            <Card className="p-6 bg-white h-full">
              <div className="flex items-center justify-between h-full">
                <div>
                  <p className="text-sm text-navy/70">Referral Leads</p>
                  <p className="text-3xl font-bold text-navy mt-2">{metrics.leadsBySource.referral.toLocaleString()}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </Card>

            {/* Affiliate Leads */}
            <Card className="p-6 bg-white h-full">
              <div className="flex items-center justify-between h-full">
                <div>
                  <p className="text-sm text-navy/70">Affiliate Leads</p>
                  <p className="text-3xl font-bold text-navy mt-2">{metrics.leadsBySource.affiliate.toLocaleString()}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </Card>

            {/* Other Leads */}
            <Card className="p-6 bg-white h-full">
              <div className="flex items-center justify-between h-full">
                <div>
                  <p className="text-sm text-navy/70">Other Leads</p>
                  <p className="text-3xl font-bold text-navy mt-2">{metrics.leadsBySource.other.toLocaleString()}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </Card>
          </div>

          {/* Second Row: Reps and Appointments */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Reps */}
            <Card className="p-6 bg-white h-full">
              <div className="flex items-center justify-between h-full">
                <div>
                  <p className="text-sm text-navy/70">Total Reps</p>
                  <p className="text-3xl font-bold text-navy mt-2">{metrics.totalReps.toLocaleString()}</p>
                  <p className="text-xs text-navy/60 mt-1">{metrics.activeReps} active</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </Card>

            {/* Available Appointments */}
            <Card className="p-6 bg-white h-full">
              <div className="flex items-center justify-between h-full">
                <div>
                  <p className="text-sm text-navy/70">Available Appointments</p>
                  <p className="text-3xl font-bold text-navy mt-2">{metrics.availableAppointments.toLocaleString()}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </Card>

            {/* Scheduled Appointments */}
            <Link href="/appointments" className="h-full">
              <Card className="p-6 bg-white hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="flex items-center justify-between h-full">
                  <div>
                    <p className="text-sm text-navy/70">Scheduled Appointments</p>
                    <p className="text-3xl font-bold text-navy mt-2">{metrics.scheduledAppointments.toLocaleString()}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
              </Card>
            </Link>

            {/* Fulfillment % */}
            <Card className="p-6 bg-white h-full">
              <div className="flex items-center justify-between h-full">
                <div>
                  <p className="text-sm text-navy/70">Fulfillment %</p>
                  <p className="text-3xl font-bold text-navy mt-2">{metrics.fulfilmentRate.toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </Card>
          </div>

          {/* Third Row: Territory and Coverage */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Territory Zips */}
            <Card className="p-6 bg-white h-full">
              <div className="flex items-center justify-between h-full">
                <div>
                  <p className="text-sm text-navy/70">Total Territory Zips</p>
                  <p className="text-3xl font-bold text-navy mt-2">{metrics.totalTerritoryZips.toLocaleString()}</p>
                </div>
                <MapPin className="h-8 w-8 text-primary" />
              </div>
            </Card>

            {/* Affiliate Purchase Zips */}
            <Card className="p-6 bg-white h-full">
              <div className="flex items-center justify-between h-full">
                <div>
                  <p className="text-sm text-navy/70">Affiliate Purchase Zips</p>
                  <p className="text-3xl font-bold text-navy mt-2">{metrics.affiliatePurchaseZipsCount.toLocaleString()}</p>
                  <p className="text-xs text-navy/60 mt-1">
                    {metrics.affiliatePurchaseZipsCount.toLocaleString()} of {metrics.totalTerritoryZips.toLocaleString()} {metrics.totalTerritoryZips > 0 ? ((metrics.affiliatePurchaseZipsCount / metrics.totalTerritoryZips) * 100).toFixed(1) : 0}%
                  </p>
                </div>
                <MapPin className="h-8 w-8 text-primary" />
              </div>
            </Card>

            {/* Rep Zip Code Coverage */}
            <Card className="p-6 bg-white h-full">
              <div className="flex items-center justify-between h-full">
                <div>
                  <p className="text-sm text-navy/70">Rep Zip Code Coverage</p>
                  <p className="text-3xl font-bold text-navy mt-2">{metrics.zipCodeCoverage.toFixed(1)}%</p>
                  <p className="text-xs text-navy/60 mt-1">{metrics.coveredZipCodesCount.toLocaleString()} of {metrics.totalTerritoryZips.toLocaleString()}</p>
                </div>
                <MapPin className="h-8 w-8 text-primary" />
              </div>
            </Card>

            {/* Mileage Issues */}
            <Link href="/appointments?mileageIssues=true" className="h-full">
              <Card className="p-6 bg-white hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="flex items-center justify-between h-full">
                  <div>
                    <p className="text-sm text-navy/70">Mileage Issues</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">{metrics.appointmentsWithMileageIssues.toLocaleString()}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </Card>
            </Link>
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Appointments by Time Slot */}
            <Card className="p-6 bg-white">
              <h3 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Appointments by Time Slot
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-navy">10:00 AM</span>
                  <span className="text-lg font-semibold text-navy">{metrics.appointmentsByTimeSlot['10am']}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-navy">2:00 PM</span>
                  <span className="text-lg font-semibold text-navy">{metrics.appointmentsByTimeSlot['2pm']}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-navy">7:00 PM</span>
                  <span className="text-lg font-semibold text-navy">{metrics.appointmentsByTimeSlot['7pm']}</span>
                </div>
              </div>
            </Card>

            {/* Appointment Status Breakdown */}
            <Card className="p-6 bg-white">
              <h3 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Appointment Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-navy">Scheduled</span>
                  <span className="text-lg font-semibold text-navy">{metrics.scheduledAppointments}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-navy">Completed</span>
                  <span className="text-lg font-semibold text-green-600">{metrics.completedAppointments}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-navy">Cancelled</span>
                  <span className="text-lg font-semibold text-red-600">{metrics.cancelledAppointments}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-navy font-medium">Total</span>
                  <span className="text-lg font-semibold text-navy">{metrics.totalAppointments}</span>
                </div>
              </div>
            </Card>

            {/* Additional Stats */}
            <Card className="p-6 bg-white">
              <h3 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Additional Statistics
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-navy">Avg Distance</span>
                  <span className="text-lg font-semibold text-navy">{metrics.avgDistance.toFixed(1)} mi</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-navy">Avg Appts per Rep</span>
                  <span className="text-lg font-semibold text-navy">{metrics.avgAppointmentsPerRep.toFixed(1)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-navy">Loading...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

