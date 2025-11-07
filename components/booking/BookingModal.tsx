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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format, parseISO } from 'date-fns';
import { CheckCircle2 } from 'lucide-react';
import type { SlotAvailability, Address } from '@/types';

interface BookingModalProps {
  slot: SlotAvailability | null;
  customerAddress: Address;
  customerInfo?: {
    leadId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  onClose: () => void;
  onConfirm: () => void;
  onRefresh?: () => void; // Callback to refresh page with blank info
}

export function BookingModal({
  slot,
  customerAddress,
  customerInfo,
  onClose,
  onConfirm,
  onRefresh,
}: BookingModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [leadId, setLeadId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Pre-populate customer info when modal opens
  useEffect(() => {
    if (customerInfo) {
      if (customerInfo.firstName && customerInfo.lastName) {
        setCustomerName(`${customerInfo.firstName} ${customerInfo.lastName}`);
      }
      if (customerInfo.phone) setCustomerPhone(customerInfo.phone);
      if (customerInfo.email) setCustomerEmail(customerInfo.email);
      if (customerInfo.leadId) setLeadId(customerInfo.leadId);
    }
  }, [customerInfo]);

  if (!slot) return null;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      alert('Please enter customer name');
      return;
    }

    setIsSubmitting(true);
    setDuplicateWarning(null);

    try {
      // Check for duplicate appointment
      const duplicateMessage = await checkForDuplicateAppointment(
        customerAddress,
        slot.date,
        slot.timeSlot
      );
      
      if (duplicateMessage) {
        setDuplicateWarning(duplicateMessage);
        setIsSubmitting(false);
        return;
      }

      // Create appointment without assigning rep
      const appointment = {
        id: `apt-${Date.now()}`,
        date: slot.date,
        timeSlot: slot.timeSlot,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        leadId: leadId.trim() || undefined,
        address: customerAddress,
        notes: notes.trim() || undefined,
        status: 'scheduled' as const,
        createdAt: new Date().toISOString()
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

      // Show success message
      setIsSuccess(true);
      
      // Wait 2 seconds then refresh page with blank info
      setTimeout(() => {
        onConfirm();
        setIsSuccess(false);
        setCustomerName('');
        setCustomerPhone('');
        setCustomerEmail('');
        setLeadId('');
        setNotes('');
        onClose();
        // Refresh page with blank information
        if (onRefresh) {
          onRefresh();
        } else {
          // Fallback: reload the page
          window.location.href = '/';
        }
      }, 2000);
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Failed to book appointment. Please try again.');
      setIsSubmitting(false);
    }
  };

  const date = parseISO(slot.date);

  return (
    <Dialog open={!!slot} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] z-[101] bg-white">
        {isSuccess ? (
          <div className="py-8 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <DialogTitle className="text-2xl font-bold text-green-600 mb-2">
              Appointment Booked!
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Your appointment has been successfully booked.
            </DialogDescription>
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
              
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column: Customer Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-navy border-b pb-2">Customer Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="leadId">Lead ID</Label>
                    <Input
                      id="leadId"
                      value={leadId}
                      onChange={(e) => setLeadId(e.target.value)}
                      placeholder="SF Lead ID"
                      disabled={isSubmitting}
                      className="bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerName">
                      Customer Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="John Doe"
                      required
                      disabled={isSubmitting}
                      className="bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Phone Number</Label>
                    <Input
                      id="customerPhone"
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      disabled={isSubmitting}
                      className="bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">Email</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="john@example.com"
                      disabled={isSubmitting}
                      className="bg-white"
                    />
                  </div>
                </div>

                {/* Right Column: Address, Appointment Time, Notes */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-navy border-b pb-2">Appointment Details</h3>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Customer Address
                    </Label>
                    <div className="p-3 bg-gray-50 rounded-md text-sm">
                      {customerAddress.street}
                      <br />
                      {customerAddress.city}, {customerAddress.state} {customerAddress.zip}
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-md">
                    <div className="font-semibold text-gray-900">
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
                      rows={5}
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
