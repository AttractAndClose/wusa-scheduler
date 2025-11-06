'use client';

import { SlotCard } from './SlotCard';
import type { SlotAvailability } from '@/types';

interface AvailabilityGridProps {
  availability: SlotAvailability[][];
  onSlotSelect: (slot: SlotAvailability) => void;
}

export function AvailabilityGrid({ availability, onSlotSelect }: AvailabilityGridProps) {
  if (availability.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Enter an address above to see available appointment times
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Available Appointments</h2>
      
      <div className="grid gap-4">
        {availability.map((daySlots, dayIndex) => (
          <div key={dayIndex} className="space-y-2">
            {daySlots.map((slot, slotIndex) => (
              <SlotCard
                key={`${slot.date}-${slot.timeSlot}`}
                slot={slot}
                onSelect={onSlotSelect}
              />
            ))}
          </div>
        ))}
      </div>
      
      <div className="flex items-center gap-4 text-sm text-gray-600 pt-4 border-t">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500"></div>
          <span>Good (3+ reps)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
          <span>Limited (1-2 reps)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500"></div>
          <span>None</span>
        </div>
      </div>
    </div>
  );
}

