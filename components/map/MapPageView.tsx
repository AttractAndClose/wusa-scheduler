'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip, Circle } from 'react-leaflet';
import L from 'leaflet';
import type { Appointment, SalesRep, Availability, Address, Lead, TimeSlot } from '@/types';
import { format, parseISO, addDays, startOfWeek, addWeeks, startOfDay, isBefore } from 'date-fns';
import { calculateDistance } from '@/lib/distance';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsAdmin } from '@/lib/use-admin';
import { loadMapSettings, saveMapSettings } from '@/lib/map-settings';

// Fix for default marker icons in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

// Time slot order for sorting appointments
const TIME_SLOT_ORDER: Record<string, number> = {
  '10am': 1,
  '2pm': 2,
  '7pm': 3
};

interface MapPageViewProps {
  appointments: Appointment[];
  reps: SalesRep[];
  availability: Availability;
  leads?: Lead[]; // Optional leads data
  customerAddress?: Address | null; // Optional for map page
}

// Component to update map view - centers on appointments (only on first load)
function MapUpdater({ 
  appointments, 
  shouldAutoZoom, 
  onZoomComplete 
}: { 
  appointments: Appointment[];
  shouldAutoZoom: boolean;
  onZoomComplete: () => void;
}) {
  const map = useMap();
  const hasZoomed = useRef(false);

  useEffect(() => {
    if (!shouldAutoZoom || hasZoomed.current) {
      return;
    }

    const updateMap = () => {
      if (appointments.length > 0) {
        // Center on all appointments with padding
        const bounds = L.latLngBounds(
          appointments.map(apt => [apt.address.lat, apt.address.lng] as [number, number])
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      } else {
        // Default to center of US
        map.setView([39.8283, -98.5795], 4);
      }
      hasZoomed.current = true;
      onZoomComplete();
    };

    const timer = setTimeout(() => {
      updateMap();
    }, 100);

    return () => clearTimeout(timer);
  }, [appointments, map, shouldAutoZoom, onZoomComplete]);

  return null;
}

// Component to track map bounds for filtering visible reps
function MapBoundsTracker({ onBoundsChange }: { onBoundsChange: (bounds: L.LatLngBounds) => void }) {
  const map = useMap();

  useEffect(() => {
    const updateBounds = () => {
      onBoundsChange(map.getBounds());
    };

    map.on('moveend', updateBounds);
    map.on('zoomend', updateBounds);
    updateBounds(); // Initial bounds

    return () => {
      map.off('moveend', updateBounds);
      map.off('zoomend', updateBounds);
    };
  }, [map, onBoundsChange]);

  return null;
}

// Component to track map zoom level
function MapZoomTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMap();

  useEffect(() => {
    const updateZoom = () => {
      onZoomChange(map.getZoom());
    };

    map.on('zoomend', updateZoom);
    updateZoom(); // Initial zoom

    return () => {
      map.off('zoomend', updateZoom);
    };
  }, [map, onZoomChange]);

  return null;
}

// Component to handle map interaction events
function MapInteractionHandler({ onInteraction }: { onInteraction: () => void }) {
  const map = useMap();

  useEffect(() => {
    map.on('dragstart', onInteraction);
    map.on('zoomstart', onInteraction);

    return () => {
      map.off('dragstart', onInteraction);
      map.off('zoomstart', onInteraction);
    };
  }, [map, onInteraction]);

  return null;
}

// Component to display scale (fixed 3 inches, calculates miles based on zoom)
function ScaleLegend() {
  const map = useMap();
  const [scaleMiles, setScaleMiles] = useState(0);

  useEffect(() => {
    const updateScale = () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      
      // Calculate meters per pixel at current zoom and latitude
      const metersPerPixel = (40075017 * Math.cos(center.lat * Math.PI / 180)) / (256 * Math.pow(2, zoom));
      
      // 3 inches = 3 * 96 pixels (assuming 96 DPI) = 288 pixels
      const scaleWidthPixels = 3 * 96;
      
      // Calculate distance in meters for 3 inches
      const distanceInMeters = scaleWidthPixels * metersPerPixel;
      
      // Convert to miles
      const distanceInMiles = distanceInMeters / 1609.34;
      
      setScaleMiles(distanceInMiles);
    };

    updateScale();
    map.on('zoomend', updateScale);
    map.on('moveend', updateScale);

    return () => {
      map.off('zoomend', updateScale);
      map.off('moveend', updateScale);
    };
  }, [map]);

  if (scaleMiles === 0) return null;

  // Format miles - show decimal places based on value
  const formatMiles = (miles: number): string => {
    if (miles >= 100) {
      return Math.round(miles).toString();
    } else if (miles >= 10) {
      return miles.toFixed(1);
    } else if (miles >= 1) {
      return miles.toFixed(2);
    } else {
      return miles.toFixed(3);
    }
  };

  return (
    <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 px-3 pt-5 pb-2 rounded shadow-md border border-gray-300 z-[1000]">
      <div className="flex items-center gap-2">
        <div className="text-xs font-semibold text-gray-900">Scale:</div>
        <div className="flex items-center gap-2">
          <div className="relative" style={{ width: '288px' }}>
            <div className="h-1 bg-gray-800"></div>
            <div className="absolute -top-4 left-0 text-xs text-gray-600">0</div>
            <div className="absolute -top-4 right-0 text-xs text-gray-600">{formatMiles(scaleMiles)} mi</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Map Legend Component (used outside map)
function MapLegend({ 
  hasSelectedRep, 
  referralColors, 
  referralSourceDetails,
  referralSourceFilters,
  showReps,
  showAppointments,
  visibleReferralSources,
  onToggleReps,
  onToggleAppointments,
  onToggleReferralSource
}: { 
  hasSelectedRep: boolean;
  referralColors: Record<string, string>;
  referralSourceDetails: readonly string[];
  referralSourceFilters: Set<string>;
  showReps: boolean;
  showAppointments: boolean;
  visibleReferralSources: Set<string>;
  onToggleReps: () => void;
  onToggleAppointments: () => void;
  onToggleReferralSource: (sourceDetail: string) => void;
}) {
  // Filter referral source details to only show those that are enabled
  // If filters are empty (show all), display all; otherwise only show filtered ones
  const visibleSourceDetails = referralSourceFilters.size === 0
    ? referralSourceDetails
    : referralSourceDetails.filter(detail => referralSourceFilters.has(detail));
  
  return (
    <div className="bg-white px-4 py-3 rounded-lg border border-gray-300 shadow-sm">
      <div className="text-sm font-semibold text-gray-900 mb-3">Legend</div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showReps}
            onChange={onToggleReps}
            className="w-4 h-4 text-navy border-gray-300 rounded focus:ring-navy"
          />
          <img 
            src="https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png" 
            alt="Rep pin" 
            className="w-4 h-5"
            style={{ objectFit: 'contain' }}
          />
          <span className="text-sm text-gray-700">Reps</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showAppointments}
            onChange={onToggleAppointments}
            className="w-4 h-4 text-navy border-gray-300 rounded focus:ring-navy"
          />
          <div 
            className="w-3 h-3 rounded-full border border-white shadow-sm"
            style={{ backgroundColor: '#10B981' }}
          ></div>
          <span className="text-sm text-gray-700">Appointments</span>
        </label>
        {hasSelectedRep && (
          <>
            {visibleSourceDetails.map((sourceDetail) => (
              <label key={sourceDetail} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleReferralSources.has(sourceDetail)}
                  onChange={() => onToggleReferralSource(sourceDetail)}
                  className="w-4 h-4 text-navy border-gray-300 rounded focus:ring-navy"
                />
                <div 
                  className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: referralColors[sourceDetail] || '#6B7280' }}
                ></div>
                <span className="text-sm text-gray-700">{sourceDetail}</span>
              </label>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// Simple zip code geocoding
function geocodeZipCode(zip: string): { lat: number; lng: number } | null {
  const zipNum = parseInt(zip.trim());
  if (isNaN(zipNum) || zipNum < 1000 || zipNum > 99999) {
    return null;
  }

  // State centers for approximation
  const stateCenters: Record<string, { lat: number; lng: number }> = {
    'AL': { lat: 32.806671, lng: -86.791130 },
    'AR': { lat: 34.969704, lng: -92.373123 },
    'AZ': { lat: 33.729759, lng: -111.431221 },
    'CA': { lat: 36.116203, lng: -119.681564 },
    'CO': { lat: 39.059811, lng: -105.311104 },
    'CT': { lat: 41.597782, lng: -72.755371 },
    'DC': { lat: 38.907192, lng: -77.036873 },
    'DE': { lat: 39.318523, lng: -75.507141 },
    'FL': { lat: 27.766279, lng: -81.686783 },
    'GA': { lat: 33.040619, lng: -83.643074 },
    'IA': { lat: 42.011539, lng: -93.210526 },
    'ID': { lat: 44.240459, lng: -114.478828 },
    'IL': { lat: 40.349457, lng: -88.986137 },
    'IN': { lat: 39.849426, lng: -86.258278 },
    'KS': { lat: 38.526600, lng: -96.726486 },
    'KY': { lat: 37.668140, lng: -84.670067 },
    'LA': { lat: 31.169546, lng: -91.867805 },
    'MA': { lat: 42.230171, lng: -71.530106 },
    'MD': { lat: 39.063946, lng: -76.802101 },
    'ME': { lat: 44.323535, lng: -69.765261 },
    'MI': { lat: 43.326618, lng: -84.536095 },
    'MN': { lat: 45.694454, lng: -93.900192 },
    'MO': { lat: 38.456085, lng: -92.288368 },
    'MS': { lat: 32.741646, lng: -89.678696 },
    'MT': { lat: 46.921925, lng: -110.454353 },
    'NC': { lat: 35.630066, lng: -79.806419 },
    'ND': { lat: 47.528912, lng: -99.784012 },
    'NE': { lat: 41.125370, lng: -98.268082 },
    'NH': { lat: 43.452492, lng: -71.563896 },
    'NJ': { lat: 40.298904, lng: -74.521011 },
    'NM': { lat: 34.840515, lng: -106.248482 },
    'NV': { lat: 38.313515, lng: -117.055374 },
    'NY': { lat: 42.165726, lng: -74.948051 },
    'OH': { lat: 40.388783, lng: -82.764915 },
    'OK': { lat: 35.565342, lng: -96.928917 },
    'OR': { lat: 44.572021, lng: -122.070938 },
    'PA': { lat: 40.590752, lng: -77.209755 },
    'RI': { lat: 41.680893, lng: -71.51178 },
    'SC': { lat: 33.856892, lng: -80.945007 },
    'SD': { lat: 44.299782, lng: -99.438828 },
    'TN': { lat: 35.747845, lng: -86.692345 },
    'TX': { lat: 31.054487, lng: -97.563461 },
    'UT': { lat: 40.150032, lng: -111.862434 },
    'VA': { lat: 37.769337, lng: -78.169968 },
    'VT': { lat: 44.045876, lng: -72.710686 },
    'WA': { lat: 47.400902, lng: -121.490494 },
    'WI': { lat: 44.268543, lng: -89.616508 },
    'WV': { lat: 38.491226, lng: -80.954453 },
    'WY': { lat: 42.755966, lng: -107.302490 },
  };

  // Determine state from zip code ranges (simplified)
  let state = 'TX'; // default
  if (zipNum >= 35000 && zipNum < 37000) state = 'AL';
  else if (zipNum >= 70000 && zipNum < 72000) state = 'LA';
  else if (zipNum >= 37000 && zipNum < 39000) state = 'TN';
  else if (zipNum >= 38000 && zipNum < 39000) state = 'MS';
  else if (zipNum >= 30000 && zipNum < 32000) state = 'GA';
  else if (zipNum >= 27000 && zipNum < 29000) state = 'NC';
  else if (zipNum >= 29000 && zipNum < 30000) state = 'SC';
  else if (zipNum >= 73000 && zipNum < 75000) state = 'OK';
  else if (zipNum >= 63000 && zipNum < 66000) state = 'MO';
  else if (zipNum >= 60000 && zipNum < 63000) state = 'IL';
  else if (zipNum >= 19000 && zipNum < 20000) state = 'PA';
  else if (zipNum >= 7000 && zipNum < 9000) state = 'NJ';

  const center = stateCenters[state] || stateCenters['TX'];
  
  // Add some variation based on zip code
  const zipMod = zipNum % 100;
  return {
    lat: center.lat + (zipMod % 10 - 5) * 0.1,
    lng: center.lng + (Math.floor(zipMod / 10) - 5) * 0.1,
  };
}

export function MapPageView({
  appointments,
  reps,
  availability,
  leads = [],
  customerAddress
}: MapPageViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  // Get today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = format(today, 'yyyy-MM-dd');
  
  const [selectedDay, setSelectedDay] = useState<string | null>(todayStr); // Default to today
  const [shouldAutoZoom, setShouldAutoZoom] = useState(true);
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(6);
  const [zipCodeInput, setZipCodeInput] = useState('');
  const [zipCodeError, setZipCodeError] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'availability'>('score');
  const [selectedRepId, setSelectedRepId] = useState<string | null>(null);
  const [dayOffset, setDayOffset] = useState(0);
  const [leadsPage, setLeadsPage] = useState(1);
  const leadsPerPage = 50;
  const [leadsSortBy, setLeadsSortBy] = useState<'distance' | 'faraday' | 'think' | 'ef'>('distance');
  const [schedulingLead, setSchedulingLead] = useState<(Lead & { distance: number }) | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  
  // Check if user is admin
  const isAdmin = useIsAdmin();
  
  // Referral Lead Source Details options
  const REFERRAL_SOURCE_DETAILS = [
    'ReferralBD', 'ReferralEX', 'ReferralNG', 'ReferralPL', 'ReferralSA',
    'ReferralTH', 'ReferralTM', 'ReferralTP', 'ReferralTX', 'ReferralYS',
    'ReferralEX-PLUS'
  ] as const;
  
  // Colors for each Referral Lead Source Detail
  const REFERRAL_COLORS: Record<string, string> = {
    'ReferralBD': '#EF4444',   // Red
    'ReferralEX': '#3B82F6',   // Blue
    'ReferralNG': '#10B981',   // Green
    'ReferralPL': '#F59E0B',   // Amber
    'ReferralSA': '#8B5CF6',    // Purple
    'ReferralTH': '#EC4899',   // Pink
    'ReferralTM': '#06B6D4',   // Cyan
    'ReferralTP': '#84CC16',   // Lime
    'ReferralTX': '#F97316',   // Orange
    'ReferralYS': '#6366F1',   // Indigo
    'ReferralEX-PLUS': '#14B8A6' // Teal
  };
  
  // Lead filter - use Set to allow multi-select of EF Score options
  // Admins can change these, non-admins use defaults from settings
  const [leadFilters, setLeadFilters] = useState<Set<'ef-640-plus' | 'ef-1' | 'ef-0'>>(new Set());
  const [daysAgoFilter, setDaysAgoFilter] = useState<number>(30);
  
  // Referral Lead Source Details filter - use Set to allow multi-select
  // Empty set means show all (default), otherwise show only selected
  const [referralSourceFilters, setReferralSourceFilters] = useState<Set<string>>(new Set());
  
  // Load default settings for non-admins on mount and when admin status changes
  useEffect(() => {
    if (!isAdmin) {
      const settings = loadMapSettings();
      setLeadFilters(new Set(settings.leadFilters));
      setDaysAgoFilter(settings.daysAgoFilter);
      setReferralSourceFilters(new Set(settings.referralSourceFilters));
    } else {
      // Reset to defaults for admins (they can customize)
      setLeadFilters(new Set());
      setDaysAgoFilter(30);
      setReferralSourceFilters(new Set()); // Empty set = show all
    }
  }, [isAdmin]);
  
  // Legend visibility toggles - all default to true (on)
  const [showReps, setShowReps] = useState(true);
  const [showAppointments, setShowAppointments] = useState(true);
  
  // Toggle visibility for individual referral source details
  const [visibleReferralSources, setVisibleReferralSources] = useState<Set<string>>(
    new Set(REFERRAL_SOURCE_DETAILS)
  );
  
  const toggleReferralSource = (sourceDetail: string) => {
    setVisibleReferralSources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sourceDetail)) {
        newSet.delete(sourceDetail);
      } else {
        newSet.add(sourceDetail);
      }
      return newSet;
    });
  };

  // Filter out Philadelphia reps (coordinates around 39.95, -75.16)
  // Philadelphia area: roughly lat 39.8-40.1, lng -75.3 to -74.9
  const filteredReps = reps.filter(rep => {
    const lat = rep.startingAddress.lat;
    const lng = rep.startingAddress.lng;
    // Exclude Philadelphia area
    return !(lat >= 39.8 && lat <= 40.1 && lng >= -75.3 && lng <= -74.9);
  });

  // Filter out appointments for Philadelphia reps
  const filteredAppointments = appointments.filter(apt => {
    if (apt.status !== 'scheduled') return false;
    // Check if appointment belongs to a Philadelphia rep
    if (apt.repId) {
      const rep = reps.find(r => r.id === apt.repId);
      if (rep) {
        const lat = rep.startingAddress.lat;
        const lng = rep.startingAddress.lng;
        // Exclude if rep is in Philadelphia area
        if (lat >= 39.8 && lat <= 40.1 && lng >= -75.3 && lng <= -74.9) {
          return false;
        }
      }
    }
    return true;
  });

  // Generate day buttons (All Appointments + today + next 9 days, with offset for scrolling)
  const dayButtons = [
    { label: 'All Appointments', date: null },
    { label: format(addDays(today, dayOffset), 'EEE, MMM d'), date: format(addDays(today, dayOffset), 'yyyy-MM-dd') },
    { label: format(addDays(today, dayOffset + 1), 'EEE, MMM d'), date: format(addDays(today, dayOffset + 1), 'yyyy-MM-dd') },
    { label: format(addDays(today, dayOffset + 2), 'EEE, MMM d'), date: format(addDays(today, dayOffset + 2), 'yyyy-MM-dd') },
    { label: format(addDays(today, dayOffset + 3), 'EEE, MMM d'), date: format(addDays(today, dayOffset + 3), 'yyyy-MM-dd') },
    { label: format(addDays(today, dayOffset + 4), 'EEE, MMM d'), date: format(addDays(today, dayOffset + 4), 'yyyy-MM-dd') },
    { label: format(addDays(today, dayOffset + 5), 'EEE, MMM d'), date: format(addDays(today, dayOffset + 5), 'yyyy-MM-dd') },
    { label: format(addDays(today, dayOffset + 6), 'EEE, MMM d'), date: format(addDays(today, dayOffset + 6), 'yyyy-MM-dd') },
    { label: format(addDays(today, dayOffset + 7), 'EEE, MMM d'), date: format(addDays(today, dayOffset + 7), 'yyyy-MM-dd') },
    { label: format(addDays(today, dayOffset + 8), 'EEE, MMM d'), date: format(addDays(today, dayOffset + 8), 'yyyy-MM-dd') },
    { label: format(addDays(today, dayOffset + 9), 'EEE, MMM d'), date: format(addDays(today, dayOffset + 9), 'yyyy-MM-dd') },
  ];

  // Filter appointments based on selected day
  const dayFilteredAppointments = selectedDay === null
    ? filteredAppointments.filter(apt => {
        const aptDate = parseISO(apt.date);
        return aptDate >= today;
      })
    : filteredAppointments.filter(apt => {
        return apt.date === selectedDay;
      });

  // Calculate center point for map based on appointments
  const getMapCenter = (): [number, number] => {
    if (dayFilteredAppointments.length > 0) {
      const avgLat = dayFilteredAppointments.reduce((sum, apt) => sum + apt.address.lat, 0) / dayFilteredAppointments.length;
      const avgLng = dayFilteredAppointments.reduce((sum, apt) => sum + apt.address.lng, 0) / dayFilteredAppointments.length;
      return [avgLat, avgLng];
    }
    return [39.8283, -98.5795]; // Center of US
  };

  const mapCenter = getMapCenter();

  // Get rep's location for selected day
  const getRepLocation = (rep: SalesRep): [number, number] => {
    if (!selectedDay) {
      // All appointments - use starting location
      return [rep.startingAddress.lat, rep.startingAddress.lng];
    }

    // Find appointments for this rep on the selected day
    const dayAppointments = filteredAppointments.filter(apt => 
      apt.repId === rep.id && apt.date === selectedDay && apt.status === 'scheduled'
    );

    if (dayAppointments.length === 0) {
      // No appointments, check if rep is available
      const repAvailability = availability[rep.id] || {};
      const selectedDate = parseISO(selectedDay);
      const dayName = format(selectedDate, 'EEEE').toLowerCase() as keyof typeof repAvailability;
      
      if (repAvailability[dayName] && repAvailability[dayName].length > 0) {
        // Rep is available but no appointments - use starting location
        return [rep.startingAddress.lat, rep.startingAddress.lng];
      } else {
        // Rep not available - still show starting location
        return [rep.startingAddress.lat, rep.startingAddress.lng];
      }
    }

    // Has appointments - use location of latest appointment
    const sortedAppointments = dayAppointments.sort((a, b) => {
      const orderA = TIME_SLOT_ORDER[a.timeSlot] || 0;
      const orderB = TIME_SLOT_ORDER[b.timeSlot] || 0;
      return orderB - orderA; // Latest first
    });

    const latestAppointment = sortedAppointments[0];
    return [latestAppointment.address.lat, latestAppointment.address.lng];
  };

  // Get rep's address for selected day
  const getRepAddress = (rep: SalesRep): Address => {
    if (!selectedDay) {
      return rep.startingAddress;
    }

    const dayAppointments = filteredAppointments.filter(apt => 
      apt.repId === rep.id && apt.date === selectedDay && apt.status === 'scheduled'
    );

    if (dayAppointments.length === 0) {
      return rep.startingAddress;
    }

    const sortedAppointments = dayAppointments.sort((a, b) => {
      const orderA = TIME_SLOT_ORDER[a.timeSlot] || 0;
      const orderB = TIME_SLOT_ORDER[b.timeSlot] || 0;
      return orderB - orderA;
    });

    return sortedAppointments[0].address;
  };

  // Calculate availability count for a rep (open time blocks)
  const getAvailabilityCount = (rep: SalesRep): number => {
    const repAvailability = availability[rep.id] || {};
    let count = 0;
    
    if (selectedDay) {
      const selectedDate = parseISO(selectedDay);
      const dayName = format(selectedDate, 'EEEE').toLowerCase() as keyof typeof repAvailability;
      const dayTimeSlots = repAvailability[dayName] || [];
      const dayAppointments = dayFilteredAppointments.filter(apt => 
        apt.repId === rep.id && apt.date === selectedDay
      );
      
      dayTimeSlots.forEach(timeSlot => {
        const hasAppointment = dayAppointments.some(apt => 
          apt.date === selectedDay && apt.timeSlot === timeSlot
        );
        if (!hasAppointment) {
          count++;
        }
      });
    } else {
      // For "All Appointments", count open time blocks for the next 7 days
      const weekStart = new Date();
      weekStart.setHours(0, 0, 0, 0);
      for (let i = 0; i < 7; i++) {
        const checkDate = addDays(weekStart, i);
        const dateStr = format(checkDate, 'yyyy-MM-dd');
        const dayName = format(checkDate, 'EEEE').toLowerCase() as keyof typeof repAvailability;
        const dayTimeSlots = repAvailability[dayName] || [];
        const dayAppointments = filteredAppointments.filter(apt => {
          if (apt.repId !== rep.id || apt.status !== 'scheduled') return false;
          const aptDate = parseISO(apt.date);
          return aptDate >= today && apt.date === dateStr;
        });
        
        dayTimeSlots.forEach(timeSlot => {
          const hasAppointment = dayAppointments.some(apt => 
            apt.date === dateStr && apt.timeSlot === timeSlot
          );
          if (!hasAppointment) {
            count++;
          }
        });
      }
    }
    
    return count;
  };

  // Filter reps visible in current map bounds
  const visibleRepsFiltered = mapBounds
    ? filteredReps.filter(rep => {
        const repLocation = getRepLocation(rep);
        return mapBounds.contains([repLocation[0], repLocation[1]]);
      })
    : filteredReps;

  // Filter reps by availability for selected day
  const repsWithAvailability = useMemo(() => {
    if (!selectedDay) {
      // If no day selected, show all visible reps
      return visibleRepsFiltered;
    }
    
    const selectedDate = parseISO(selectedDay);
    const dayName = format(selectedDate, 'EEEE').toLowerCase();
    
    return visibleRepsFiltered.filter(rep => {
      const repAvailability = availability[rep.id] || {};
      const dayAvailability = repAvailability[dayName as keyof typeof repAvailability];
      
      // Show rep if they have availability for this day OR have appointments on this day
      const hasAvailability = dayAvailability && dayAvailability.length > 0;
      const hasAppointments = dayFilteredAppointments.some(apt => apt.repId === rep.id && apt.date === selectedDay);
      
      return hasAvailability || hasAppointments;
    });
  }, [visibleRepsFiltered, selectedDay, availability, dayFilteredAppointments]);
  
  const visibleReps = [...repsWithAvailability].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'score') {
      // Sort by score (higher first), then by name if scores are equal
      const scoreA = a.successScore || 0;
      const scoreB = b.successScore || 0;
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      return a.name.localeCompare(b.name);
    } else {
      // Sort by availability (most available first), then by name
      const availA = getAvailabilityCount(a);
      const availB = getAvailabilityCount(b);
      if (availB !== availA) {
        return availB - availA;
      }
      return a.name.localeCompare(b.name);
    }
  });

  // Handle zip code search
  const handleZipCodeSearch = () => {
    setZipCodeError('');
    const coords = geocodeZipCode(zipCodeInput);
    
    if (!coords) {
      setZipCodeError('Invalid zip code. Please enter a 5-digit zip code.');
      return;
    }

    if (mapRef.current) {
      // Calculate bounds for 45 miles radius with zip code at center
      const latRadius = 45 / 69; // 1 degree latitude ≈ 69 miles
      const lngRadius = 45 / (69 * Math.cos(coords.lat * Math.PI / 180)); // Adjust for latitude
      const bounds = L.latLngBounds(
        [coords.lat - latRadius, coords.lng - lngRadius],
        [coords.lat + latRadius, coords.lng + lngRadius]
      );
      mapRef.current.fitBounds(bounds, { padding: [20, 20] });
      setShouldAutoZoom(false); // Disable auto-zoom after manual zip search
    }
  };

  // Handle day scroll forward
  const handleDayScrollForward = () => {
    setDayOffset(prev => prev + 1);
  };

  // Handle map interaction to disable auto-zoom
  const handleMapInteraction = () => {
    setShouldAutoZoom(false);
  };

  // Handle rep click to zoom to rep location
  const handleRepClick = (rep: SalesRep) => {
    // Toggle selection - if clicking the same rep, deselect
    if (selectedRepId === rep.id) {
      setSelectedRepId(null);
      setLeadsPage(1); // Reset pagination
    } else {
      setSelectedRepId(rep.id);
      setLeadsPage(1); // Reset to first page when selecting new rep
      if (mapRef.current) {
        const repLocation = getRepLocation(rep);
        
        // Calculate bounds for 45 miles radius (to show the 45-mile circle clearly)
        const latRadius = 45 / 69;
        const lngRadius = 45 / (69 * Math.cos(repLocation[0] * Math.PI / 180));
        const bounds = L.latLngBounds(
          [repLocation[0] - latRadius, repLocation[1] - lngRadius],
          [repLocation[0] + latRadius, repLocation[1] + lngRadius]
        );
        mapRef.current.fitBounds(bounds, { padding: [20, 20] });
        setShouldAutoZoom(false); // Disable auto-zoom after manual zoom
      }
    }
  };

  // Memoize leads calculation for selected rep (within 90 miles)
  // This prevents recalculating distances on every render
  const allLeadsForRep = useMemo(() => {
    if (!selectedRepId) return [];
    
    const selectedRep = filteredReps.find(rep => rep.id === selectedRepId);
    if (!selectedRep) return [];
    
    const repLocation = getRepLocation(selectedRep);
    
    // Pre-filter by approximate bounding box first (faster than calculating all distances)
    // Rough approximation: 1 degree latitude ≈ 69 miles, 1 degree longitude varies by latitude
    const latRadius = 90 / 69;
    const lngRadius = 90 / (69 * Math.cos(repLocation[0] * Math.PI / 180));
    const minLat = repLocation[0] - latRadius;
    const maxLat = repLocation[0] + latRadius;
    const minLng = repLocation[1] - lngRadius;
    const maxLng = repLocation[1] + lngRadius;
    
    // Calculate date threshold for days ago filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysAgoDate = new Date(today);
    daysAgoDate.setDate(today.getDate() - daysAgoFilter);
    
    // First pass: filter by bounding box (much faster)
    // Only show Referral leads
    let candidates = leads.filter(lead => 
      lead.leadSource === 'Referral' &&
      lead.address.lat >= minLat && 
      lead.address.lat <= maxLat &&
      lead.address.lng >= minLng && 
      lead.address.lng <= maxLng
    );
    
    // Filter by Referral Lead Source Details - if no filters selected, show all; otherwise show only selected
    if (referralSourceFilters.size > 0) {
      candidates = candidates.filter(lead => 
        lead.leadSourceDetails && referralSourceFilters.has(lead.leadSourceDetails)
      );
    }
    
    // Filter by created date (days ago)
    candidates = candidates.filter(lead => {
      if (!lead.createdAt) return true; // Include leads without createdAt
      const leadDate = new Date(lead.createdAt);
      leadDate.setHours(0, 0, 0, 0);
      return leadDate >= daysAgoDate;
    });
    
    // Filter by EF Score - if no filters selected, show all; otherwise show leads matching any selected filter
    if (leadFilters.size > 0) {
      candidates = candidates.filter(lead => {
        if (leadFilters.has('ef-640-plus') && lead.efScore !== undefined && lead.efScore >= 640) return true;
        if (leadFilters.has('ef-1') && lead.efScore === 1) return true;
        if (leadFilters.has('ef-0') && lead.efScore === 0) return true;
        return false;
      });
    }
    
    // Second pass: calculate exact distances only for candidates
    const leadsWithDistance = candidates.map(lead => ({
      ...lead,
      distance: calculateDistance(
        repLocation[0],
        repLocation[1],
        lead.address.lat,
        lead.address.lng
      )
    })).filter(lead => lead.distance <= 90);
    
    // Sort based on selected option
    const sortedLeads = [...leadsWithDistance].sort((a, b) => {
      switch (leadsSortBy) {
        case 'distance':
          return a.distance - b.distance;
        case 'faraday':
          const aFaraday = a.faradayCreditPropensity ?? 0;
          const bFaraday = b.faradayCreditPropensity ?? 0;
          return bFaraday - aFaraday; // Descending (higher is better)
        case 'think':
          const thinkOrder: Record<string, number> = { 'Platinum': 4, 'Gold': 3, 'Silver': 2, 'Bronze': 1 };
          const aThink = thinkOrder[a.thinkUnlimitedScore || ''] ?? 0;
          const bThink = thinkOrder[b.thinkUnlimitedScore || ''] ?? 0;
          return bThink - aThink; // Descending (higher is better)
        case 'ef':
          const aEf = a.efScore ?? 0;
          const bEf = b.efScore ?? 0;
          return bEf - aEf; // Descending (higher is better)
        default:
          return a.distance - b.distance;
      }
    });
    
    return sortedLeads;
  }, [selectedRepId, filteredReps, leads, selectedDay, Array.from(leadFilters).sort().join(','), daysAgoFilter, Array.from(referralSourceFilters).sort().join(','), leadsSortBy]);

  const totalLeadsPages = useMemo(() => 
    Math.ceil(allLeadsForRep.length / leadsPerPage),
    [allLeadsForRep.length, leadsPerPage]
  );

  const paginatedLeads = useMemo(() => 
    allLeadsForRep.slice(
      (leadsPage - 1) * leadsPerPage,
      leadsPage * leadsPerPage
    ),
    [allLeadsForRep, leadsPage, leadsPerPage]
  );

  // Get available time slots for the selected rep and lead
  const getAvailableTimeSlots = () => {
    if (!selectedRepId || !schedulingLead) return [];
    
    const selectedRep = filteredReps.find(rep => rep.id === selectedRepId);
    if (!selectedRep) return [];
    
    const repAvailability = availability[selectedRep.id] || {};
    const days: (keyof typeof repAvailability)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    // Get next 5 weeks of dates
    const today = new Date();
    const startDate = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const availableSlots: Array<{ date: string; dayName: string; timeSlot: TimeSlot }> = [];
    
    for (let week = 0; week < 5; week++) {
      const weekStart = addWeeks(startDate, week);
      
      days.forEach((dayName, dayIndex) => {
        const date = addDays(weekStart, dayIndex);
        const dateStr = format(date, 'yyyy-MM-dd');
        
        // Check if rep is available on this day
        const dayAvailability = repAvailability[dayName] || [];
        
        dayAvailability.forEach((slot: TimeSlot) => {
          // Check if this slot is already booked
          const isBooked = appointments.some(apt => 
            apt.repId === selectedRep.id &&
            apt.date === dateStr &&
            apt.timeSlot === slot &&
            apt.status !== 'cancelled'
          );
          
          if (!isBooked) {
            availableSlots.push({
              date: dateStr,
              dayName: format(date, 'EEEE'),
              timeSlot: slot
            });
          }
        });
      });
    }
    
    return availableSlots;
  };

  const availableTimeSlots = useMemo(() => getAvailableTimeSlots(), [selectedRepId, schedulingLead, filteredReps, availability, appointments]);
  
  // Group available slots by date
  const slotsByDate = useMemo(() => {
    const grouped: Record<string, Array<{ dayName: string; timeSlot: TimeSlot }>> = {};
    availableTimeSlots.forEach(slot => {
      if (!grouped[slot.date]) {
        grouped[slot.date] = [];
      }
      grouped[slot.date].push({ dayName: slot.dayName, timeSlot: slot.timeSlot });
    });
    return grouped;
  }, [availableTimeSlots]);

  const handleScheduleClick = (lead: Lead & { distance: number }) => {
    setSchedulingLead(lead);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
  };

  const handleConfirmSchedule = () => {
    if (!schedulingLead || !selectedRepId || !selectedDate || !selectedTimeSlot) return;
    
    // TODO: Implement actual scheduling logic
    // For now, just close the modal
    console.log('Schedule appointment:', {
      lead: schedulingLead,
      repId: selectedRepId,
      date: selectedDate,
      timeSlot: selectedTimeSlot
    });
    
    setSchedulingLead(null);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
  };

  return (
    <div className="space-y-4">
      {/* Day Filter Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {dayButtons.map((button) => (
          <button
            key={button.date || 'all'}
            onClick={() => setSelectedDay(button.date)}
            className={`px-3 py-2 rounded-md text-xs font-medium transition-colors border border-gray-300 ${
              selectedDay === button.date
                ? 'bg-navy text-white border-navy'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {button.label}
          </button>
        ))}
        <div className="flex gap-1">
          <button
            onClick={() => setDayOffset(prev => Math.max(0, prev - 1))}
            disabled={dayOffset === 0}
            className={`px-2 py-2 rounded-md text-xs font-medium transition-colors border border-gray-300 ${
              dayOffset === 0
                ? 'bg-white text-gray-400 cursor-not-allowed border-gray-200'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            title="Previous days"
          >
            ←
          </button>
          <button
            onClick={handleDayScrollForward}
            className="px-2 py-2 rounded-md text-xs font-medium bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 transition-colors"
            title="Next days"
          >
            →
          </button>
        </div>
      </div>

      {/* Lead Filter Toggles and Date Slider - Above Map (Only visible to admins) */}
      {selectedRepId && isAdmin && (
        <div className="bg-white rounded-lg border border-gray-300 p-4">
          <div className="space-y-4">
            {/* EF Score Filter Toggles */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-gray-700">Filter Leads:</span>
              <button
                onClick={() => setLeadFilters(new Set())}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  leadFilters.size === 0
                    ? 'bg-navy text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Leads
              </button>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={leadFilters.has('ef-640-plus')}
                  onChange={(e) => {
                    const newFilters = new Set(leadFilters);
                    if (e.target.checked) {
                      newFilters.add('ef-640-plus');
                    } else {
                      newFilters.delete('ef-640-plus');
                    }
                    setLeadFilters(newFilters);
                  }}
                  className="w-4 h-4 text-navy border-gray-300 rounded focus:ring-navy"
                />
                <span className="text-xs text-gray-700">EF Score ≥ 640</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={leadFilters.has('ef-1')}
                  onChange={(e) => {
                    const newFilters = new Set(leadFilters);
                    if (e.target.checked) {
                      newFilters.add('ef-1');
                    } else {
                      newFilters.delete('ef-1');
                    }
                    setLeadFilters(newFilters);
                  }}
                  className="w-4 h-4 text-navy border-gray-300 rounded focus:ring-navy"
                />
                <span className="text-xs text-gray-700">EF Score 1</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={leadFilters.has('ef-0')}
                  onChange={(e) => {
                    const newFilters = new Set(leadFilters);
                    if (e.target.checked) {
                      newFilters.add('ef-0');
                    } else {
                      newFilters.delete('ef-0');
                    }
                    setLeadFilters(newFilters);
                  }}
                  className="w-4 h-4 text-navy border-gray-300 rounded focus:ring-navy"
                />
                <span className="text-xs text-gray-700">EF Score 0</span>
              </label>
            </div>
            
            {/* Referral Lead Source Details Filter */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-gray-700">Referral Lead Source Details:</span>
              <button
                onClick={() => setReferralSourceFilters(new Set())}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  referralSourceFilters.size === 0
                    ? 'bg-navy text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {REFERRAL_SOURCE_DETAILS.map((sourceDetail) => (
                <label key={sourceDetail} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={referralSourceFilters.has(sourceDetail)}
                    onChange={(e) => {
                      const newFilters = new Set(referralSourceFilters);
                      if (e.target.checked) {
                        newFilters.add(sourceDetail);
                      } else {
                        newFilters.delete(sourceDetail);
                      }
                      setReferralSourceFilters(newFilters);
                    }}
                    className="w-4 h-4 text-navy border-gray-300 rounded focus:ring-navy"
                  />
                  <span className="text-xs text-gray-700">{sourceDetail}</span>
                </label>
              ))}
            </div>
            
            {/* Created Date Slider - on same row */}
            <div className="flex items-center gap-3">
              <label htmlFor="daysAgoSlider" className="text-xs font-medium text-gray-700 whitespace-nowrap">
                Created within last:
              </label>
              <input
                id="daysAgoSlider"
                type="range"
                min="0"
                max="365"
                value={daysAgoFilter}
                onChange={(e) => setDaysAgoFilter(Number(e.target.value))}
                className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs font-medium text-gray-900 min-w-[60px] text-right">
                {daysAgoFilter} days
              </span>
            </div>
            
            {/* Update Member Filters and Reset Map Buttons */}
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
              <button
                onClick={() => {
                  setSelectedRepId(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white text-xs font-medium rounded hover:bg-gray-600 transition-colors"
              >
                Reset Map
              </button>
              <button
                onClick={() => {
                  const memberSettings = {
                    leadFilters: leadFilters,
                    daysAgoFilter: daysAgoFilter,
                    referralSourceFilters: referralSourceFilters,
                  };
                  saveMapSettings(memberSettings);
                  alert('Member filter settings updated! These will be the default view for all non-admin users.');
                }}
                className="px-4 py-2 bg-navy text-white text-xs font-medium rounded hover:bg-navy/90 transition-colors"
              >
                Update Member Filters
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
        {/* Left side: Map */}
        <div className="lg:col-span-2">
        {/* Map Container with Legend */}
        <div className="space-y-4">
          {/* Map */}
          <div className="h-[700px] w-full rounded-lg overflow-hidden border border-gray-300 relative z-0">
          {/* Zip Code Search - Top Right Overlay */}
          <div className="absolute top-2 right-2 z-[1000] bg-white rounded-lg shadow-lg border border-gray-300 p-2 max-w-[200px]">
            <div className="flex gap-1 items-center">
              <input
                id="zipCode"
                type="text"
                value={zipCodeInput}
                onChange={(e) => {
                  setZipCodeInput(e.target.value);
                  setZipCodeError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleZipCodeSearch();
                  }
                }}
                placeholder="Zip Code"
                className="flex-1 min-w-0 px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                maxLength={5}
              />
              <button
                onClick={handleZipCodeSearch}
                className="flex-shrink-0 px-2 py-1.5 bg-navy text-white rounded text-xs font-medium hover:bg-navy/90 transition-colors"
              >
                Go
              </button>
            </div>
            {zipCodeError && (
              <p className="mt-1 text-xs text-red-600 break-words">{zipCodeError}</p>
            )}
          </div>
          <MapContainer
            center={mapCenter}
            zoom={6}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
            ref={mapRef}
            scrollWheelZoom={true}
            key="map-container"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapUpdater 
              appointments={dayFilteredAppointments} 
              shouldAutoZoom={shouldAutoZoom}
              onZoomComplete={() => setShouldAutoZoom(false)}
            />
            
            <MapBoundsTracker onBoundsChange={setMapBounds} />
            
            <MapZoomTracker onZoomChange={setMapZoom} />
            
            <MapInteractionHandler onInteraction={handleMapInteraction} />
            
            <ScaleLegend />
          
          {/* Customer address marker - only if provided */}
          {customerAddress && (
            <Marker
              position={[customerAddress.lat, customerAddress.lng]}
              icon={L.icon({
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
              })}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold text-navy">Customer Location</div>
                  <div className="text-gray-600">{customerAddress.street}</div>
                  <div className="text-gray-600">{customerAddress.city}, {customerAddress.state} {customerAddress.zip}</div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Appointment markers - all green, small dots */}
          {showAppointments && dayFilteredAppointments.map((apt) => {
            const aptDate = parseISO(apt.date);
            const rep = apt.repId ? filteredReps.find(r => r.id === apt.repId) : null;

            return (
              <Marker
                key={apt.id}
                position={[apt.address.lat, apt.address.lng]}
                icon={L.divIcon({
                  className: 'custom-marker',
                  html: `<div style="background-color: #10B981; width: 10px; height: 10px; border-radius: 50%; box-shadow: 0 1px 2px rgba(0,0,0,0.3);"></div>`,
                  iconSize: [10, 10],
                  iconAnchor: [5, 5],
                })}
                eventHandlers={{
                  click: () => setSelectedAppointment(apt),
                }}
              >
                <Tooltip>
                  <div className="text-xs">
                    {format(aptDate, 'EEE, MMM d')} - {apt.timeSlot === '10am' ? '10:00 AM' : apt.timeSlot === '2pm' ? '2:00 PM' : '7:00 PM'}
                  </div>
                </Tooltip>
                <Popup>
                  <div className="text-sm space-y-1">
                    <div className="font-semibold text-navy">{apt.customerName}</div>
                    <div className="text-gray-600">
                      <strong>Date:</strong> {format(aptDate, 'MMM d, yyyy')}
                    </div>
                    <div className="text-gray-600">
                      <strong>Time:</strong> {apt.timeSlot === '10am' ? '10:00 AM' : apt.timeSlot === '2pm' ? '2:00 PM' : '7:00 PM'}
                    </div>
                    <div className="text-gray-600">
                      <strong>Address:</strong> {apt.address.street}, {apt.address.city}, {apt.address.state} {apt.address.zip}
                    </div>
                    <div className="text-gray-600">
                      <strong>Rep:</strong> {rep ? rep.name : 'Unassigned'}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Lead markers - color based on Referral Lead Source Details (only show when rep is selected) */}
          {/* Only render first 1000 leads on map to prevent performance issues */}
          {selectedRepId && allLeadsForRep.slice(0, 1000).map((lead) => {
            // Only show Referral leads
            if (lead.leadSource !== 'Referral') return null;
            
            // Check if this referral source detail is visible
            if (lead.leadSourceDetails && !visibleReferralSources.has(lead.leadSourceDetails)) {
              return null;
            }
            
            // Get color based on Lead Source Details
            const markerColor = lead.leadSourceDetails 
              ? (REFERRAL_COLORS[lead.leadSourceDetails] || '#6B7280') 
              : '#6B7280';
            
            return (
              <Marker
                key={`lead-${lead.id}`}
                position={[lead.address.lat, lead.address.lng]}
                icon={L.divIcon({
                  className: 'custom-marker',
                  html: `<div style="background-color: ${markerColor}; width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.4);"></div>`,
                  iconSize: [12, 12],
                  iconAnchor: [6, 6],
                })}
              >
                <Tooltip>
                  <div className="text-xs font-semibold">{lead.name}</div>
                </Tooltip>
                <Popup>
                  <div>
                    <div className="grid gap-3" style={{ gridTemplateColumns: 'auto auto' }}>
                      {/* Left Column - Customer Info */}
                      <div>
                        <h3 className="text-sm font-semibold text-navy mb-2 pb-1.5 border-b border-gray-200">Customer</h3>
                        <div className="space-y-1.5">
                          <div>
                            <div className="text-[10px] font-medium text-red-600 uppercase tracking-wide mb-0.5">Name</div>
                            <div className="text-xs text-gray-900 break-words">{lead.name}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-medium text-red-600 uppercase tracking-wide mb-0.5">Email</div>
                            <div className="text-xs text-gray-900 break-all">{lead.email}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-medium text-red-600 uppercase tracking-wide mb-0.5">Phone</div>
                            <div className="text-xs text-gray-900">{lead.phone}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-medium text-red-600 uppercase tracking-wide mb-0.5">Address</div>
                            <div className="text-xs text-gray-900 break-words">
                              {lead.address.street}<br />
                              {lead.address.city}, {lead.address.state} {lead.address.zip}
                            </div>
                          </div>
                          {lead.leadSourceDetails && (
                            <div>
                              <div className="text-[10px] font-medium text-red-600 uppercase tracking-wide mb-0.5">Lead Source</div>
                              <div className="text-xs text-gray-900 break-words">{lead.leadSourceDetails}</div>
                            </div>
                          )}
                          {lead.efScore !== undefined && (
                            <div>
                              <div className="text-[10px] font-medium text-red-600 uppercase tracking-wide mb-0.5">EF Score</div>
                              <div className="text-xs text-gray-900">{lead.efScore}</div>
                            </div>
                          )}
                          {selectedRepId && (() => {
                            const selectedRep = filteredReps.find(rep => rep.id === selectedRepId);
                            return selectedRep ? (
                              <div>
                                <div className="text-[10px] font-medium text-red-600 uppercase tracking-wide mb-0.5">Distance</div>
                                <div className="text-xs text-gray-900 break-words">{lead.distance.toFixed(1)} mi from {selectedRep.name}</div>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      </div>
                      
                      {/* Right Column - Referrer Info */}
                      <div>
                        {lead.refererName ? (
                          <>
                            <h3 className="text-sm font-semibold text-navy mb-2 pb-1.5 border-b border-gray-200">Referer</h3>
                            <div className="space-y-1.5">
                              <div>
                                <div className="text-[10px] font-medium text-red-600 uppercase tracking-wide mb-0.5">Name</div>
                                <div className="text-xs text-gray-900 break-words">{lead.refererName} ({lead.refererRelationship})</div>
                              </div>
                              {lead.refererPhone && (
                                <div>
                                  <div className="text-[10px] font-medium text-red-600 uppercase tracking-wide mb-0.5">Phone</div>
                                  <div className="text-xs text-gray-900">{lead.refererPhone}</div>
                                </div>
                              )}
                              {lead.refererAddress && (
                                <div>
                                  <div className="text-[10px] font-medium text-red-600 uppercase tracking-wide mb-0.5">Address</div>
                                  <div className="text-xs text-gray-900 break-words">
                                    {lead.refererAddress.street}<br />
                                    {lead.refererAddress.city}, {lead.refererAddress.state} {lead.refererAddress.zip}
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="text-xs text-gray-500 italic">No referrer information</div>
                        )}
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* 45-mile radius circle for selected rep only */}
          {selectedRepId && (() => {
            const selectedRep = filteredReps.find(rep => rep.id === selectedRepId);
            if (!selectedRep) return null;
            
            const repLocation = getRepLocation(selectedRep);
            
            return (
              <Circle
                center={repLocation}
                radius={45 * 1609.34} // Convert miles to meters
                pathOptions={{
                  color: '#3B82F6',
                  fillColor: '#3B82F6',
                  fillOpacity: 0.1,
                  opacity: 0.4,
                  weight: 1,
                }}
              />
            );
          })()}

          {/* Rep markers - blue pins */}
          {showReps && filteredReps.map((rep) => {
            const repLocation = getRepLocation(rep);
            const repAvailability = availability[rep.id] || {};
            
            // Determine if rep has appointments or is available for selected day
            let repStatus = 'Starting Location';
            if (selectedDay) {
              const selectedDate = parseISO(selectedDay);
              const dayName = format(selectedDate, 'EEEE').toLowerCase() as keyof typeof repAvailability;
              const dayAppointments = dayFilteredAppointments.filter(apt => 
                apt.repId === rep.id && apt.date === selectedDay
              );
              
              if (dayAppointments.length > 0) {
                repStatus = `${dayAppointments.length} appointment(s)`;
              } else if (repAvailability[dayName] && repAvailability[dayName].length > 0) {
                repStatus = 'Available';
              } else {
                repStatus = 'Not Available';
              }
            }

            const isSelected = selectedRepId === rep.id;
            
            // Determine if zoomed in (zoom level > 8 means more zoomed in)
            const isZoomedIn = mapZoom > 8;
            
            // Size based on zoom level and selection
            const baseWidth = isZoomedIn ? 24 : 14;
            const baseHeight = isZoomedIn ? 40 : 24;
            const selectedWidth = isZoomedIn ? 30 : 18;
            const selectedHeight = isZoomedIn ? 50 : 30;
            
            const iconWidth = isSelected ? selectedWidth : baseWidth;
            const iconHeight = isSelected ? selectedHeight : baseHeight;
            
            // Create pin icon - red for selected, blue for others
            const markerIcon = isSelected
              ? L.divIcon({
                  className: 'custom-marker',
                  html: `<svg width="${iconWidth}" height="${iconHeight}" viewBox="0 0 18 30" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 0C4.03 0 0 4.03 0 9c0 5.25 9 21 9 21s9-15.75 9-21c0-4.97-4.03-9-9-9z" fill="#EF4444" stroke="white" stroke-width="1.5"/>
                  </svg>`,
                  iconSize: [iconWidth, iconHeight],
                  iconAnchor: [iconWidth / 2, iconHeight],
                  popupAnchor: [1, -iconHeight],
                })
              : L.icon({
                  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                  iconSize: [iconWidth, iconHeight],
                  iconAnchor: [iconWidth / 2, iconHeight],
                  popupAnchor: [1, -iconHeight],
                  shadowSize: [iconWidth + 6, iconHeight + 6]
                });

            return (
              <Marker
                key={`marker-${rep.id}`}
                position={repLocation}
                icon={markerIcon}
                eventHandlers={{
                  click: () => {
                    if (selectedRepId === rep.id) {
                      setSelectedRepId(null);
                      setLeadsPage(1);
                    } else {
                      setSelectedRepId(rep.id);
                      setLeadsPage(1); // Reset to first page
                      if (mapRef.current) {
                        // Calculate bounds for 45 miles radius (to show the 45-mile circle clearly)
                        const latRadius = 45 / 69;
                        const lngRadius = 45 / (69 * Math.cos(repLocation[0] * Math.PI / 180));
                        const bounds = L.latLngBounds(
                          [repLocation[0] - latRadius, repLocation[1] - lngRadius],
                          [repLocation[0] + latRadius, repLocation[1] + lngRadius]
                        );
                        mapRef.current.fitBounds(bounds, { padding: [20, 20] });
                        setShouldAutoZoom(false);
                      }
                    }
                  },
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold text-navy">{rep.name}</div>
                    <div className="text-gray-600">{repStatus}</div>
                    {selectedDay && (
                      <div className="text-gray-600 mt-1">
                        <strong>Date:</strong> {format(parseISO(selectedDay), 'MMM d, yyyy')}
                      </div>
                    )}
                    <div className="text-gray-600 mt-1">
                      <strong>Address:</strong> {(() => {
                        const address = getRepAddress(rep);
                        return `${address.street}, ${address.city}, ${address.state} ${address.zip}`;
                      })()}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
          </MapContainer>
          </div>
          
          {/* Map Legend - below the map */}
          <MapLegend 
            hasSelectedRep={!!selectedRepId} 
            referralColors={REFERRAL_COLORS}
            referralSourceDetails={REFERRAL_SOURCE_DETAILS}
            referralSourceFilters={referralSourceFilters}
            showReps={showReps}
            showAppointments={showAppointments}
            visibleReferralSources={visibleReferralSources}
            onToggleReps={() => setShowReps(!showReps)}
            onToggleAppointments={() => setShowAppointments(!showAppointments)}
            onToggleReferralSource={toggleReferralSource}
          />
        </div>
        </div>

        {/* Right side: Reps List */}
        <div className="lg:col-span-1">
        <div className="bg-white rounded-lg border border-gray-300 p-4 flex flex-col" style={{ height: 'calc(700px + 1rem + 4.5rem)' }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900">
              Reps ({visibleReps.length})
              {selectedDay && (
                <span className="text-xs font-normal text-gray-500 block mt-1">
                  {format(parseISO(selectedDay), 'MMM d')}
                </span>
              )}
            </h3>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'score' | 'availability')}
              className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="name">Sort by Name</option>
              <option value="score">Sort by Score</option>
              <option value="availability">Sort by Availability</option>
            </select>
          </div>
          {visibleReps.length > 0 ? (
            <div className="space-y-1.5 flex-1 overflow-y-auto">
              {visibleReps.map((rep) => {
                const repLocation = getRepLocation(rep);
                const repAvailability = availability[rep.id] || {};
                
                // Determine if rep has appointments or is available for selected day
                let repStatus = 'Starting Location';
                let isAvailable = false;
                if (selectedDay) {
                  const selectedDate = parseISO(selectedDay);
                  const dayName = format(selectedDate, 'EEEE').toLowerCase() as keyof typeof repAvailability;
                  const dayAppointments = dayFilteredAppointments.filter(apt => 
                    apt.repId === rep.id && apt.date === selectedDay
                  );
                  
                  if (dayAppointments.length > 0) {
                    repStatus = `${dayAppointments.length} appointment(s)`;
                    isAvailable = true;
                  } else if (repAvailability[dayName] && repAvailability[dayName].length > 0) {
                    repStatus = 'Available';
                    isAvailable = true;
                  } else {
                    repStatus = 'Not Available';
                    isAvailable = false;
                  }
                } else {
                  // Check if rep has any availability in the week
                  const weekStart = new Date();
                  weekStart.setHours(0, 0, 0, 0);
                  for (let i = 0; i < 7; i++) {
                    const checkDate = addDays(weekStart, i);
                    const dayName = format(checkDate, 'EEEE').toLowerCase() as keyof typeof repAvailability;
                    if (repAvailability[dayName] && repAvailability[dayName].length > 0) {
                      isAvailable = true;
                      break;
                    }
                  }
                }

                // Get rep's appointments for the selected day or all future appointments
                const repAppointments = selectedDay
                  ? dayFilteredAppointments.filter(apt => apt.repId === rep.id && apt.date === selectedDay)
                  : filteredAppointments.filter(apt => {
                      if (apt.repId !== rep.id || apt.status !== 'scheduled') return false;
                      const aptDate = parseISO(apt.date);
                      return aptDate >= today;
                    });

                // Get rep's open time blocks
                const openTimeBlocks: { date: string; timeSlot: string }[] = [];
                if (selectedDay) {
                  const selectedDate = parseISO(selectedDay);
                  const dayName = format(selectedDate, 'EEEE').toLowerCase() as keyof typeof repAvailability;
                  const dayTimeSlots = repAvailability[dayName] || [];
                  
                  // Filter out time slots that have appointments
                  dayTimeSlots.forEach(timeSlot => {
                    const hasAppointment = repAppointments.some(apt => 
                      apt.date === selectedDay && apt.timeSlot === timeSlot
                    );
                    if (!hasAppointment) {
                      openTimeBlocks.push({ date: selectedDay, timeSlot });
                    }
                  });
                } else {
                  // For "All Appointments", show open time blocks for the next 7 days
                  const weekStart = new Date();
                  weekStart.setHours(0, 0, 0, 0);
                  for (let i = 0; i < 7; i++) {
                    const checkDate = addDays(weekStart, i);
                    const dateStr = format(checkDate, 'yyyy-MM-dd');
                    const dayName = format(checkDate, 'EEEE').toLowerCase() as keyof typeof repAvailability;
                    const dayTimeSlots = repAvailability[dayName] || [];
                    
                    dayTimeSlots.forEach(timeSlot => {
                      const hasAppointment = repAppointments.some(apt => 
                        apt.date === dateStr && apt.timeSlot === timeSlot
                      );
                      if (!hasAppointment) {
                        openTimeBlocks.push({ date: dateStr, timeSlot });
                      }
                    });
                  }
                }

                const availabilityCount = getAvailabilityCount(rep);

                const isSelected = selectedRepId === rep.id;

                return (
                  <div 
                    key={rep.id} 
                    onClick={() => handleRepClick(rep)}
                    className={`p-3 rounded border cursor-pointer hover:shadow-md transition-shadow ${
                      isSelected 
                        ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-300' 
                        : isAvailable 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`font-medium text-sm ${
                          isAvailable ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {rep.name}
                        </div>
                        {selectedDay && (
                          isAvailable ? (
                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Available</span>
                          ) : (
                            <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">Not Available</span>
                          )
                        )}
                      </div>
                      {rep.successScore !== undefined && (
                        <div className="text-xs font-semibold text-navy">
                          Score: {rep.successScore}
                        </div>
                      )}
                    </div>
                    
                    {/* Scheduled Appointments */}
                    {(() => {
                      // Sort appointments by date and time slot
                      const sortedAppointments = [...repAppointments].sort((a, b) => {
                        if (a.date !== b.date) {
                          return a.date.localeCompare(b.date);
                        }
                        const orderA = TIME_SLOT_ORDER[a.timeSlot] || 0;
                        const orderB = TIME_SLOT_ORDER[b.timeSlot] || 0;
                        return orderA - orderB;
                      });

                      return sortedAppointments.length > 0 && (
                        <div className="mb-2">
                          <div className="text-xs font-semibold text-gray-700 mb-1">Scheduled Appointments:</div>
                          <div className="space-y-1">
                            {sortedAppointments.map((apt, idx) => {
                              const aptDate = parseISO(apt.date);
                              
                              // Determine anchor point: starting address or previous appointment
                              let anchorPoint: Address;
                              if (idx === 0) {
                                // First appointment uses starting address
                                anchorPoint = rep.startingAddress;
                              } else {
                                // Use previous appointment's address
                                anchorPoint = sortedAppointments[idx - 1].address;
                              }
                              
                              // Calculate distance from anchor point
                              const distance = calculateDistance(
                                anchorPoint.lat,
                                anchorPoint.lng,
                                apt.address.lat,
                                apt.address.lng
                              );
                              
                              return (
                                <div key={apt.id} className="text-xs text-gray-600 pl-2 border-l-2 border-blue-300">
                                  <div className="font-medium">
                                    {format(aptDate, 'MMM d')} - {apt.timeSlot === '10am' ? '10:00 AM' : apt.timeSlot === '2pm' ? '2:00 PM' : '7:00 PM'} - {distance.toFixed(1)} mi
                                  </div>
                                  <div className="text-gray-500 font-medium">{apt.customerName}</div>
                                  <div className="text-gray-500">{apt.address.street}, {apt.address.city}, {apt.address.state} {apt.address.zip}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Open Time Blocks */}
                    {openTimeBlocks.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-gray-700 mb-1">Open Time Blocks:</div>
                        <div className="space-y-1">
                          {openTimeBlocks.slice(0, 5).map((block, idx) => {
                            const blockDate = parseISO(block.date);
                            return (
                              <div key={idx} className="text-xs text-gray-600 pl-2 border-l-2 border-green-300">
                                {format(blockDate, 'MMM d')} - {block.timeSlot === '10am' ? '10:00 AM' : block.timeSlot === '2pm' ? '2:00 PM' : '7:00 PM'}
                              </div>
                            );
                          })}
                          {openTimeBlocks.length > 5 && (
                            <div className="text-xs text-gray-500 pl-2">
                              +{openTimeBlocks.length - 5} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {repAppointments.length === 0 && openTimeBlocks.length === 0 && (
                      <div className="text-xs text-gray-500">No appointments or open time blocks</div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-gray-500">No reps visible in current map view.</div>
          )}
        </div>
      </div>
      </div>

      {/* Weekly Calendar View for Selected Rep */}
      {selectedRepId && (() => {
        const selectedRep = filteredReps.find(rep => rep.id === selectedRepId);
        if (!selectedRep) return null;

        const repAvailability = availability[selectedRep.id] || {};
        const repAppointments = appointments.filter(apt => apt.repId === selectedRep.id && apt.status === 'scheduled');
        
        // Generate 2 weeks of availability (this week and next week)
        const weeks = [0, 1].map(weekOffset => {
          const weekStart = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
          const weekEnd = addDays(weekStart, 6);
          return {
            start: weekStart,
            end: weekEnd,
            dates: Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
          };
        });

        const DAYS: (keyof typeof repAvailability)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const TIME_SLOTS: TimeSlot[] = ['10am', '2pm', '7pm'];

        return (
          <div className="w-full bg-white rounded-lg border border-gray-300 p-6 mt-6">
            <h3 className="text-lg font-semibold text-navy mb-4">Availability Calendar - {selectedRep.name}</h3>
            <div className="space-y-6">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex}>
                  <h4 className="text-sm font-medium text-navy mb-3">
                    Week of {format(week.start, 'MMM d')} - {format(week.end, 'MMM d, yyyy')}
                  </h4>
                  <div className="grid grid-cols-7 gap-2">
                    {week.dates.map((date, dayIndex) => {
                      const dayName = DAYS[dayIndex];
                      const dateString = format(date, 'yyyy-MM-dd');
                      const today = startOfDay(new Date());
                      const dateDay = startOfDay(date);
                      const isToday = format(dateDay, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
                      const isPast = isBefore(dateDay, today);
                      const dayAppointments = repAppointments.filter(
                        apt => apt.date === dateString && apt.status === 'scheduled'
                      );

                      return (
                        <div key={dayIndex} className="space-y-1">
                          <div className={`text-xs font-medium text-center py-1 rounded ${
                            isToday 
                              ? 'bg-red-500 text-white' 
                              : isPast 
                              ? 'bg-gray-300 text-gray-500' 
                              : 'text-navy'
                          }`}>
                            <div>{format(date, 'EEE').toUpperCase()}</div>
                            <div className={`text-sm font-bold ${
                              isToday 
                                ? 'text-white' 
                                : isPast 
                                ? 'text-gray-500' 
                                : 'text-navy'
                            }`}>
                              {format(date, 'd')}
                            </div>
                          </div>
                          <div className="space-y-1">
                            {TIME_SLOTS.map((slot) => {
                              const isAvailable = repAvailability[dayName]?.includes(slot);
                              const hasAppointment = dayAppointments.some(apt => apt.timeSlot === slot);
                              
                              return (
                                <div
                                  key={slot}
                                  className={`text-xs p-2 rounded text-center ${
                                    isPast
                                      ? 'bg-gray-200 text-gray-400 opacity-50 cursor-not-allowed'
                                      : hasAppointment
                                      ? 'bg-orange-100 text-orange-800 font-medium border border-orange-300 cursor-default'
                                      : isAvailable
                                      ? 'bg-green-100 text-green-800 font-medium border border-green-300 cursor-default'
                                      : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                  }`}
                                >
                                  {slot === '10am' ? '10:00 AM' :
                                   slot === '2pm' ? '2:00 PM' : '7:00 PM'}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Leads Container - Full width below map */}
    {selectedRepId && (
      <div className="w-full bg-white rounded-lg border border-gray-300 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Available Leads ({allLeadsForRep.length} within 90 miles)
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="leadsSort" className="text-sm text-gray-700 whitespace-nowrap">Sort by:</label>
              <Select value={leadsSortBy} onValueChange={(value) => {
                setLeadsSortBy(value as 'distance' | 'faraday' | 'think' | 'ef');
                setLeadsPage(1); // Reset to first page when sorting changes
              }}>
                <SelectTrigger id="leadsSort" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distance">Distance (Miles)</SelectItem>
                  <SelectItem value="faraday">Faraday Credit</SelectItem>
                  <SelectItem value="think">Think Unlimited</SelectItem>
                  <SelectItem value="ef">EF Score</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {totalLeadsPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLeadsPage(prev => Math.max(1, prev - 1))}
                  disabled={leadsPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  ← Prev
                </button>
                <span className="text-sm text-gray-600">
                  Page {leadsPage} of {totalLeadsPages}
                </span>
                <button
                  onClick={() => setLeadsPage(prev => Math.min(totalLeadsPages, prev + 1))}
                  disabled={leadsPage === totalLeadsPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-2">
          {paginatedLeads.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-8">No leads within 90 miles</div>
          ) : (
            paginatedLeads.map((lead) => (
              <div
                key={lead.id}
                className="p-3 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 grid gap-4" style={{ gridTemplateColumns: 'minmax(250px, 1.5fr) minmax(280px, 2fr) 0.8fr 0.8fr 0.8fr' }}>
                    {/* Stacked Name, Email, Phone */}
                    <div className="space-y-2">
                      <div className="flex gap-3">
                        <div className="text-xs text-gray-500 font-bold w-16 flex-shrink-0">Name:</div>
                        <div className="font-medium text-sm text-gray-900 whitespace-nowrap">{lead.name}</div>
                      </div>
                      <div className="flex gap-3">
                        <div className="text-xs text-gray-500 font-bold w-16 flex-shrink-0">Email:</div>
                        <div className="text-sm text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis">{lead.email}</div>
                      </div>
                      <div className="flex gap-3">
                        <div className="text-xs text-gray-500 font-bold w-16 flex-shrink-0">Phone:</div>
                        <div className="text-sm text-gray-700 whitespace-nowrap">{lead.phone}</div>
                      </div>
                    </div>
                    {/* Address */}
                    <div>
                      <div className="text-xs text-gray-500 font-bold mb-1">Address</div>
                      <div className="text-sm text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis">
                        {lead.address.street}, {lead.address.city}, {lead.address.state} {lead.address.zip}
                      </div>
                    </div>
                    {/* Credit fields in separate columns */}
                    {lead.faradayCreditPropensity !== undefined && (
                      <div>
                        <div className="text-xs text-gray-500 font-bold mb-1">Faraday Credit</div>
                        <div className="text-sm text-gray-700">{lead.faradayCreditPropensity}/100</div>
                      </div>
                    )}
                    {lead.thinkUnlimitedScore && (
                      <div>
                        <div className="text-xs text-gray-500 font-bold mb-1">Think Unlimited</div>
                        <div className="text-sm text-gray-700">{lead.thinkUnlimitedScore}</div>
                      </div>
                    )}
                    {lead.efScore !== undefined && (
                      <div>
                        <div className="text-xs text-gray-500 font-bold mb-1">EF Score</div>
                        <div className="text-sm text-gray-700">{lead.efScore}</div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-lg font-bold text-navy">{lead.distance.toFixed(1)}</div>
                      <div className="text-xs text-gray-500">miles</div>
                    </div>
                    <button
                      onClick={() => {
                        // Placeholder: Will open Salesforce lead record in new window
                        // TODO: Replace with actual Salesforce URL when available
                        window.open('#', '_blank');
                      }}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors"
                    >
                      Salesforce Lead
                    </button>
                    <button
                      onClick={() => handleScheduleClick(lead)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                    >
                      Schedule
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )}

    {/* Schedule Appointment Modal */}
    <Dialog open={schedulingLead !== null} onOpenChange={(open) => !open && setSchedulingLead(null)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Appointment</DialogTitle>
          <DialogDescription>
            Select a date and time slot for this appointment
          </DialogDescription>
        </DialogHeader>
        
        {schedulingLead && selectedRepId && (() => {
          const selectedRep = filteredReps.find(rep => rep.id === selectedRepId);
          if (!selectedRep) return null;
          
          return (
            <div className="space-y-6 mt-4">
              {/* Lead Information */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-gray-900 mb-3">Lead Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <span className="ml-2 font-medium text-gray-900">{schedulingLead.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <span className="ml-2 font-medium text-gray-900">{schedulingLead.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Phone:</span>
                    <span className="ml-2 font-medium text-gray-900">{schedulingLead.phone}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className="ml-2 font-medium text-gray-900 capitalize">{schedulingLead.status || 'new'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Address:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {schedulingLead.address.street}, {schedulingLead.address.city}, {schedulingLead.address.state} {schedulingLead.address.zip}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Distance:</span>
                    <span className="ml-2 font-medium text-gray-900">{schedulingLead.distance.toFixed(1)} miles</span>
                  </div>
                </div>
              </div>

              {/* Rep Information */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-gray-900 mb-3">Sales Rep Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <span className="ml-2 font-medium text-gray-900">{selectedRep.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <span className="ml-2 font-medium text-gray-900">{selectedRep.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Phone:</span>
                    <span className="ml-2 font-medium text-gray-900">{selectedRep.phone}</span>
                  </div>
                  {selectedRep.successScore && (
                    <div>
                      <span className="text-gray-500">Success Score:</span>
                      <span className="ml-2 font-medium text-gray-900">{selectedRep.successScore}/100</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Available Time Slots */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Available Time Slots</h3>
                {Object.keys(slotsByDate).length === 0 ? (
                  <div className="text-sm text-gray-500 py-4">No available time slots for this rep</div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {Object.entries(slotsByDate)
                      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                      .map(([date, slots]) => {
                        const dateObj = parseISO(date);
                        const isSelected = selectedDate === date;
                        
                        return (
                          <div key={date} className="border border-gray-200 rounded-lg p-3">
                            <button
                              onClick={() => {
                                setSelectedDate(date);
                                setSelectedTimeSlot(null);
                              }}
                              className={`w-full text-left font-medium text-sm mb-2 ${
                                isSelected ? 'text-blue-600' : 'text-gray-900'
                              }`}
                            >
                              {format(dateObj, 'EEEE, MMMM d, yyyy')}
                            </button>
                            {isSelected && (
                              <div className="grid grid-cols-3 gap-2 mt-2">
                                {slots.map((slot: { dayName: string; timeSlot: TimeSlot }) => {
                                  const isSlotSelected = selectedTimeSlot === slot.timeSlot;
                                  const timeLabel = slot.timeSlot === '10am' ? '10:00 AM' : 
                                                  slot.timeSlot === '2pm' ? '2:00 PM' : '7:00 PM';
                                  
                                  return (
                                    <button
                                      key={slot.timeSlot}
                                      onClick={() => setSelectedTimeSlot(slot.timeSlot)}
                                      className={`px-3 py-2 text-sm rounded border transition-colors ${
                                        isSlotSelected
                                          ? 'bg-blue-600 text-white border-blue-600'
                                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                      }`}
                                    >
                                      {timeLabel}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setSchedulingLead(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSchedule}
                  disabled={!selectedDate || !selectedTimeSlot}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Confirm Appointment
                </button>
              </div>
            </div>
          );
        })()}
      </DialogContent>
    </Dialog>
  </div>
  );
}

