'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { SlotAvailability } from '@/types';
import { format, parseISO } from 'date-fns';

interface SlotCardProps {
  slot: SlotAvailability;
  onSelect: (slot: SlotAvailability) => void;
}

export function SlotCard({ slot, onSelect }: SlotCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const date = parseISO(slot.date);
  // Only disable if date is before today (not today itself)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const slotDate = new Date(date);
  slotDate.setHours(0, 0, 0, 0);
  const isPast = slotDate < today;
  
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
      className={`p-3 transition-all h-full w-full flex flex-col ${getStatusColor()} ${
        isDisabled ? '' : 'hover:shadow-md'
      }`}
      onClick={() => !isDisabled && onSelect(slot)}
    >
      <div className="flex flex-col gap-1.5 flex-1">
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
        
        {/* Rep Names and Distances */}
        {isAvailable && slot.availableReps.length > 0 && (
          <div className="mt-1 pt-1.5 border-t border-gray-200 space-y-1">
            {(isExpanded ? slot.availableReps : slot.availableReps.slice(0, 3)).map((rep, index) => {
              // Determine distance indicator
              const getDistanceIndicator = () => {
                if (rep.anchorPoint.source === 'home') {
                  return 'H';
                } else if (rep.anchorPoint.source === 'previous-appointment') {
                  return 'PA'; // Previous Appointment
                } else if (rep.anchorPoint.source === 'next-appointment') {
                  return 'NA'; // Next Appointment
                }
                return 'H'; // Default to Home
              };
              
              return (
                <div key={rep.repId} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700 font-medium truncate pr-2">{rep.repName}</span>
                  <span className="text-gray-600 whitespace-nowrap">
                    {getDistanceIndicator()} {rep.distance.toFixed(1)} mi
                  </span>
                </div>
              );
            })}
            {slot.availableReps.length > 3 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 transition-colors w-full justify-center pt-1"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    +{slot.availableReps.length - 3} more
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
