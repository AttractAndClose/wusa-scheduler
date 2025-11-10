'use client';

import { SlotCard } from './SlotCard';
import type { SlotAvailability } from '@/types';
import { format, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AvailabilityGridProps {
  availability: SlotAvailability[][];
  onSlotSelect: (slot: SlotAvailability) => void;
  onWeekChange?: (direction: 'prev' | 'next') => void;
  weekOffset?: number;
}

export function AvailabilityGrid({ availability, onSlotSelect, onWeekChange, weekOffset = 0 }: AvailabilityGridProps) {
  if (availability.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Enter an address above to see available appointment times
      </div>
    );
  }

  // Get the first date to determine the week
  const firstDate = availability[0]?.[0]?.date;
  if (!firstDate) return null;

  const startDate = parseISO(firstDate);
  const endDate = parseISO(availability[availability.length - 1]?.[0]?.date || firstDate);

  const handlePrevWeek = () => {
    if (onWeekChange) {
      onWeekChange('prev');
    }
  };

  const handleNextWeek = () => {
    if (onWeekChange) {
      onWeekChange('next');
    }
  };

  // Get all unique time slots (should be 10am, 2pm, 7pm)
  const timeSlots: Array<'10am' | '2pm' | '7pm'> = ['10am', '2pm', '7pm'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-navy">Available Appointments</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-navy/70">
            {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
          </div>
          {onWeekChange && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevWeek}
                className="h-8 w-8 p-0 border-navy text-navy hover:bg-navy hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextWeek}
                className="h-8 w-8 p-0 border-navy text-navy hover:bg-navy hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Day Headers */}
      <div className="grid grid-cols-5 gap-4 mb-3">
        {availability.map((daySlots, dayIndex) => {
          const dayDate = daySlots[0]?.date;
          if (!dayDate) return <div key={dayIndex}></div>;
          
          const date = parseISO(dayDate);
          const dayName = format(date, 'EEE').toUpperCase();
          const dayNumber = format(date, 'd');
          const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          
          return (
            <div key={dayIndex} className={`text-center ${isToday ? 'bg-navy text-white rounded-t-lg py-2' : 'text-navy/70 py-2'}`}>
              <div className="text-xs font-medium">{dayName}</div>
              <div className={`text-lg font-bold ${isToday ? 'text-white' : 'text-navy'}`}>
                {dayNumber}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Row-based grid - each row is a time slot across all days */}
      <div className="space-y-2">
        {timeSlots.map((timeSlot) => {
          return (
            <div key={timeSlot} className="grid grid-cols-5 gap-4 items-stretch">
              {availability.map((daySlots, dayIndex) => {
                const slot = daySlots.find(s => s.timeSlot === timeSlot);
                if (!slot) {
                  return <div key={dayIndex} className="min-h-[80px]"></div>;
                }
                
                return (
                  <div key={dayIndex} className="h-full">
                    <SlotCard
                      slot={slot}
                      onSelect={onSlotSelect}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
