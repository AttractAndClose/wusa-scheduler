'use client';

import { Card } from '@/components/ui/card';
import { Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import type { SlotAvailability } from '@/types';
import { format, parseISO } from 'date-fns';

interface SlotCardProps {
  slot: SlotAvailability;
  onSelect: (slot: SlotAvailability) => void;
}

export function SlotCard({ slot, onSelect }: SlotCardProps) {
  const date = parseISO(slot.date);
  const isPast = date < new Date();
  
  const getStatusIcon = () => {
    if (slot.status === 'good') {
      return <CheckCircle2 className="h-5 w-5 text-primary" />;
    } else if (slot.status === 'limited') {
      return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    } else {
      return <XCircle className="h-5 w-5 text-gray-dark" />;
    }
  };

  const getStatusColor = () => {
    if (slot.status === 'good') {
      return 'border-primary/30 bg-primary/10 hover:bg-primary/20 border-2';
    } else if (slot.status === 'limited') {
      return 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100 border-2';
    } else {
      return 'border-gray-300 bg-gray-light opacity-50 cursor-not-allowed';
    }
  };

  const getStatusText = () => {
    if (slot.status === 'good') {
      return `${slot.availableCount} reps available`;
    } else if (slot.status === 'limited') {
      return `${slot.availableCount} rep${slot.availableCount > 1 ? 's' : ''} available`;
    } else {
      return 'No availability';
    }
  };

  const isDisabled = slot.status === 'none' || isPast;

  return (
    <Card
      className={`p-4 cursor-pointer transition-all ${getStatusColor()} ${
        isDisabled ? '' : 'hover:shadow-md'
      }`}
      onClick={() => !isDisabled && onSelect(slot)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-navy/60" />
          <div>
            <div className="font-semibold text-navy">
              {format(date, 'EEE, MMM d')}
            </div>
            <div className="text-sm text-navy/70">
              {slot.timeSlot === '10am' ? '10:00 AM' : 
               slot.timeSlot === '2pm' ? '2:00 PM' : '7:00 PM'}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <div className="text-sm font-medium text-navy">
            {getStatusText()}
          </div>
        </div>
      </div>
    </Card>
  );
}

