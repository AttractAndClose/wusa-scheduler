'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format, parseISO } from 'date-fns';
import { CheckCircle2, Loader2 } from 'lucide-react';
import type { SlotAvailability, Address } from '@/types';
import type { QualifyingQuestionsData } from './QualifyingQuestions';

interface BookingModalProps {
  slot: SlotAvailability | null;
  customerAddress: Address;
  qualifyingQuestions: QualifyingQuestionsData;
  customerInfo?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    leadId?: string;
  };
  onClose: () => void;
  onConfirm: () => void;
  onRefresh?: () => void; // Callback to refresh page with blank info
}

export function BookingModal({
  slot,
  customerAddress,
  qualifyingQuestions,
  customerInfo,
  onClose,
  onConfirm,
  onRefresh,
}: BookingModalProps) {
  const customerName = customerInfo?.firstName && customerInfo?.lastName
    ? `${customerInfo.firstName} ${customerInfo.lastName}`
    : customerInfo?.firstName || '';
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  
  // Booking process steps
  const [bookingStep, setBookingStep] = useState<'idle' | 'syncing' | 'synced' | 'converting' | 'converted' | 'creating' | 'created' | 'complete' | 'closing'>('idle');
  const [countdown, setCountdown] = useState(5);

  // Check for existing appointments at this address
  const checkForDuplicateAppointment = async (address: Address, date: string, timeSlot: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/appointments');
      if (!response.ok) return null;
      
      const appointments = await response.json();
      const duplicate = appointments.find((apt: any) => 
        apt.status === 'scheduled' &&
        apt.address.street.toLowerCase().trim() === address.street.toLowerCase().trim() &&
        apt.address.city.toLowerCase().trim() === address.city.toLowerCase().trim() &&
        apt.address.state.toUpperCase() === address.state.toUpperCase() &&
        apt.address.zip === address.zip &&
        apt.date === date &&
        apt.timeSlot === timeSlot
      );
      
      if (duplicate) {
        return `An appointment is already scheduled for this address on ${format(parseISO(date), 'MMMM d, yyyy')} at ${timeSlot === '10am' ? '10:00 AM' : timeSlot === '2pm' ? '2:00 PM' : '7:00 PM'}.`;
      }
      
      return null;
    } catch (error) {
      console.error('Error checking for duplicate appointment:', error);
      return null;
    }
  };

  const validateQualifyingQuestions = (): string | null => {
    const q = qualifyingQuestions;
    if (q.isHomeowner === undefined) return 'Please indicate if they are the homeowner';
    if (!q.homeBuiltYear?.trim()) return 'Please enter the year the home was built';
    if (!q.homeType?.trim()) return 'Please select the home type';
    if (!q.homeExterior?.trim()) return 'Please select the home exterior';
    if (!q.estimatedFicoScore?.trim()) return 'Please enter the estimated FICO score';
    if (q.isHoaMember === undefined) return 'Please indicate if they are part of an HOA';
    if (!q.windowsStatus) return 'Please select if windows are original or replaced';
    if (!q.numberOfWindows) return 'Please enter the number of windows';
    if (q.numberOfSlidingDoors === undefined) return 'Please enter the number of sliding glass doors';
    if (!q.maritalStatus?.trim()) return 'Please select marital status';
    return null;
  };

  // Handle booking process steps
  useEffect(() => {
    if (bookingStep === 'syncing') {
      const timer = setTimeout(() => {
        setBookingStep('synced');
        setTimeout(() => {
          setBookingStep('converting');
        }, 500);
      }, 1500);
      return () => clearTimeout(timer);
    }
    
    if (bookingStep === 'converting') {
      const timer = setTimeout(() => {
        setBookingStep('converted');
        setTimeout(() => {
          setBookingStep('creating');
        }, 500);
      }, 1500);
      return () => clearTimeout(timer);
    }
    
    if (bookingStep === 'creating') {
      const timer = setTimeout(() => {
        setBookingStep('created');
        setTimeout(() => {
          setBookingStep('complete');
        }, 500);
      }, 1500);
      return () => clearTimeout(timer);
    }
    
    if (bookingStep === 'complete') {
      const timer = setTimeout(() => {
        setBookingStep('closing');
      }, 500);
      return () => clearTimeout(timer);
    }
    
    if (bookingStep === 'closing') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          const newCount = prev - 1;
          if (newCount <= 0) {
            clearInterval(timer);
            // Reset form and close
            setTimeout(() => {
              onConfirm();
              setBookingStep('idle');
              setIsSuccess(false);
              setNotes('');
              setCountdown(5);
              onClose();
              if (onRefresh) {
                onRefresh();
              }
            }, 100);
            return 0;
          }
          return newCount;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [bookingStep, onConfirm, onClose, onRefresh]);

  // Early return after all hooks
  if (!slot) return null;

  const date = parseISO(slot.date);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      alert('Customer name is required');
      return;
    }

    setIsSubmitting(true);
    setDuplicateWarning(null);
    setBookingStep('syncing');
    setIsSuccess(true);

    try {
      // Check for duplicate appointment (show warning but continue with demo)
      const duplicateMessage = await checkForDuplicateAppointment(
        customerAddress,
        slot.date,
        slot.timeSlot
      );
      
      if (duplicateMessage) {
        setDuplicateWarning(duplicateMessage);
        // Continue with demo flow anyway
      }

      // Create appointment without assigning rep (only if not duplicate)
      if (!duplicateMessage) {
        const appointment = {
          id: `apt-${Date.now()}`,
          date: slot.date,
          timeSlot: slot.timeSlot,
          customerName: customerName.trim(),
          customerPhone: customerInfo?.phone || undefined,
          customerEmail: customerInfo?.email || undefined,
          leadId: customerInfo?.leadId || undefined,
          address: customerAddress,
          notes: notes.trim() || undefined,
          status: 'scheduled' as const,
          createdAt: new Date().toISOString(),
          // Qualifying questions from props
          isHomeowner: qualifyingQuestions.isHomeowner,
          homeBuiltYear: qualifyingQuestions.homeBuiltYear,
          homeType: qualifyingQuestions.homeType,
          homeExterior: qualifyingQuestions.homeExterior,
          estimatedFicoScore: qualifyingQuestions.estimatedFicoScore,
          isHoaMember: qualifyingQuestions.isHoaMember,
          windowsStatus: qualifyingQuestions.windowsStatus,
          windowsReplacedYear: qualifyingQuestions.windowsReplacedYear,
          numberOfWindows: qualifyingQuestions.numberOfWindows || 0,
          numberOfSlidingDoors: qualifyingQuestions.numberOfSlidingDoors || 0,
          maritalStatus: qualifyingQuestions.maritalStatus,
        };

        // Save to API (which writes to JSON file)
        const response = await fetch('/api/appointments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(appointment),
        });

        if (!response.ok) {
          throw new Error('Failed to save appointment');
        }
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      // Still show demo flow even on error
    }
  };

  return (
    <Dialog open={!!slot} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1400px] max-h-[90vh] overflow-y-auto z-[101] bg-white">
        {isSuccess ? (
          <div className="py-8">
            {duplicateWarning && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-yellow-800">
                      {duplicateWarning}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-6">
              <DialogTitle className="text-2xl font-bold text-navy mb-6 text-center">
                Processing Appointment
              </DialogTitle>
              
              {/* Step 1: Syncing to Salesforce */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  {bookingStep === 'syncing' ? (
                    <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                  ) : bookingStep === 'synced' || bookingStep === 'converting' || bookingStep === 'converted' || bookingStep === 'creating' || bookingStep === 'created' || bookingStep === 'complete' || bookingStep === 'closing' ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Syncing to Salesforce</p>
                </div>
              </div>

              {/* Step 2: Converting lead to contact and account */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  {bookingStep === 'converting' ? (
                    <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                  ) : bookingStep === 'converted' || bookingStep === 'creating' || bookingStep === 'created' || bookingStep === 'complete' || bookingStep === 'closing' ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Converting lead to contact and account</p>
                </div>
              </div>

              {/* Step 3: Creating appointment */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  {bookingStep === 'creating' ? (
                    <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                  ) : bookingStep === 'created' || bookingStep === 'complete' || bookingStep === 'closing' ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Creating appointment</p>
                </div>
              </div>

              {/* Step 4: Complete */}
              {bookingStep === 'complete' || bookingStep === 'closing' ? (
                <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex-shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">Complete</p>
                  </div>
                </div>
              ) : null}

              {/* Countdown */}
              {bookingStep === 'closing' && (
                <div className="text-center pt-4">
                  <p className="text-sm text-gray-600">
                    Window closing in <span className="font-bold text-navy">{countdown}</span> second{countdown !== 1 ? 's' : ''}...
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Appointment</DialogTitle>
              <DialogDescription>
                Review the details and complete your booking
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {duplicateWarning && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-800">
                        {duplicateWarning}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-6">
                {/* Appointment Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-navy border-b pb-2">Appointment Details</h3>
                  
                  <div className="p-4 bg-blue-50 rounded-md">
                    <div className="font-semibold text-gray-900 mb-1">
                      {format(date, 'EEEE, MMMM d, yyyy')}
                    </div>
                    <div className="text-gray-600">
                      {slot.timeSlot === '10am' ? '10:00 AM' :
                       slot.timeSlot === '2pm' ? '2:00 PM' : '7:00 PM'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Appointment Notes</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any special instructions or notes for this appointment..."
                      rows={8}
                      disabled={isSubmitting}
                      className="resize-none bg-white"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-4 border-t">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Booking...' : 'Book Appointment'}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
