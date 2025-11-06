'use client';

import { useState } from 'react';
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
import { format, parseISO } from 'date-fns';
import type { SlotAvailability, Address } from '@/types';
import { bookAppointment } from '@/lib/availability';
import { saveAppointment } from '@/lib/data-loader';

interface BookingModalProps {
  slot: SlotAvailability | null;
  customerAddress: Address;
  onClose: () => void;
  onConfirm: () => void;
}

export function BookingModal({
  slot,
  customerAddress,
  onClose,
  onConfirm,
}: BookingModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!slot) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      alert('Please enter customer name');
      return;
    }

    setIsSubmitting(true);

    try {
      const appointment = bookAppointment(
        slot,
        customerName,
        customerAddress,
        customerPhone || undefined,
        customerEmail || undefined
      );

      if (!appointment) {
        alert('Sorry, this slot is no longer available');
        setIsSubmitting(false);
        return;
      }

      // Save to localStorage (MVP)
      saveAppointment(appointment);

      // Callback to refresh data
      onConfirm();

      // Reset form and close
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      onClose();
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Failed to book appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const date = parseISO(slot.date);
  const assignedRep = slot.availableReps[0];

  return (
    <Dialog open={!!slot} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Confirm Appointment</DialogTitle>
          <DialogDescription>
            Review the details and complete your booking
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          {assignedRep && (
            <div className="p-3 bg-gray-50 rounded-md text-sm">
              <div className="font-medium text-gray-900">Assigned Rep:</div>
              <div className="text-gray-600">{assignedRep.repName}</div>
              <div className="text-gray-500 text-xs mt-1">
                {assignedRep.distance.toFixed(1)} miles away
              </div>
            </div>
          )}

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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerEmail">Email (optional)</Label>
            <Input
              id="customerEmail"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="john@example.com"
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Booking...' : 'Book Appointment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

