'use client';

import { Card } from '@/components/ui/card';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';
import type { SlotAvailability } from '@/types';
import { format, parseISO } from 'date-fns';

interface SlotCardProps {
  slot: SlotAvailability;
  onSelect: (slot: SlotAvailability) => void;
}

export function SlotCard({ slot, onSelect }: SlotCardProps) {
  const date = parseISO(slot.date);
  const isPast = date < new Date();
  
  const isAvailable = slot.status !== 'none';
  const isDisabled = slot.status === 'none' || isPast;

  const getStatusColor = () => {
    if (isAvailable) {
      // Green for available slots
      return 'border-green-500 bg-green-50 hover:bg-green-100 border-2 cursor-pointer';
    } else {
      // Gray for unavailable slots
      return 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed';
    }
  };

  const getStatusText = () => {
    if (slot.status === 'good' || slot.status === 'limited') {
      return `${slot.availableCount} Available`;
    } else {
      return 'No availability';
    }
  };

  const getStatusIcon = () => {
    if (isAvailable) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    } else {
      return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card
      className={`p-3 transition-all ${getStatusColor()} ${
        isDisabled ? '' : 'hover:shadow-md'
      }`}
      onClick={() => !isDisabled && onSelect(slot)}
    >
      <div className="flex flex-col gap-1">
        {/* Time */}
        <div className="text-sm font-medium text-navy">
          {slot.timeSlot === '10am' ? '10:00 AM' : 
           slot.timeSlot === '2pm' ? '2:00 PM' : '7:00 PM'}
        </div>
        
        {/* Availability Status */}
        <div className={`flex items-center gap-1.5 text-xs ${isAvailable ? 'text-green-700' : 'text-gray-500'}`}>
          {getStatusIcon()}
          <span className="font-medium">{getStatusText()}</span>
        </div>
      </div>
    </Card>
  );
}
