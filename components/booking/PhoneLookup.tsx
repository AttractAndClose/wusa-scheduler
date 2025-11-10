'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Phone, User, Mail, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import type { Lead } from '@/types';

interface PhoneLookupProps {
  onLeadSelect: (lead: Lead) => void;
  isLoading?: boolean;
  leads: Lead[];
}

// Default phone number for testing - Maria Ellis
const DEFAULT_PHONE = '470-202-5009';

export function PhoneLookup({ onLeadSelect, isLoading = false, leads }: PhoneLookupProps) {
  const [phoneNumber, setPhoneNumber] = useState(DEFAULT_PHONE);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [searchResults, setSearchResults] = useState<Lead[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Normalize phone number for comparison (remove formatting)
  const normalizePhone = (phone: string): string => {
    return phone.replace(/\D/g, ''); // Remove all non-digits
  };

  // Normalize string for comparison (lowercase, trim)
  const normalizeString = (str: string): string => {
    return str.toLowerCase().trim();
  };

  const handleSearch = async () => {
    // Check if at least one field has a value
    const hasPhone = phoneNumber.trim().length > 0;
    const hasFirstName = firstName.trim().length > 0;
    const hasLastName = lastName.trim().length > 0;
    const hasEmail = email.trim().length > 0;
    const hasAddress = address.trim().length > 0;

    if (!hasPhone && !hasFirstName && !hasLastName && !hasEmail && !hasAddress) {
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    // Search for leads matching any of the provided criteria
    const matchingLeads = leads.filter(lead => {
      let matches = false;

      // Phone number match
      if (hasPhone) {
        const normalizedSearch = normalizePhone(phoneNumber);
        const normalizedLeadPhone = normalizePhone(lead.phone);
        if (normalizedLeadPhone === normalizedSearch || 
            normalizedLeadPhone.endsWith(normalizedSearch) ||
            normalizedSearch.endsWith(normalizedLeadPhone)) {
          matches = true;
        }
      }

      // First name match
      if (hasFirstName && !matches) {
        const nameParts = lead.name.split(' ');
        const leadFirstName = nameParts[0] || '';
        if (normalizeString(leadFirstName).includes(normalizeString(firstName))) {
          matches = true;
        }
      }

      // Last name match
      if (hasLastName && !matches) {
        const nameParts = lead.name.split(' ');
        const leadLastName = nameParts.slice(1).join(' ') || '';
        if (normalizeString(leadLastName).includes(normalizeString(lastName))) {
          matches = true;
        }
      }

      // Email match
      if (hasEmail && !matches) {
        if (normalizeString(lead.email).includes(normalizeString(email))) {
          matches = true;
        }
      }

      // Address match (check street, city, zip)
      if (hasAddress && !matches && lead.address) {
        const searchAddr = normalizeString(address);
        const streetMatch = normalizeString(lead.address.street).includes(searchAddr);
        const cityMatch = normalizeString(lead.address.city).includes(searchAddr);
        const zipMatch = lead.address.zip.includes(address.replace(/\D/g, ''));
        if (streetMatch || cityMatch || zipMatch) {
          matches = true;
        }
      }

      return matches;
    });

    setSearchResults(matchingLeads);
    setIsSearching(false);

    // If only one result, auto-select it
    if (matchingLeads.length === 1) {
      onLeadSelect(matchingLeads[0]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleLeadClick = (lead: Lead) => {
    onLeadSelect(lead);
  };

  const clearSearch = () => {
    setPhoneNumber(DEFAULT_PHONE);
    setFirstName('');
    setLastName('');
    setEmail('');
    setAddress('');
    setSearchResults([]);
    setHasSearched(false);
  };

  const hasAnyValue = phoneNumber.trim() || firstName.trim() || lastName.trim() || email.trim() || address.trim();

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-navy mb-3">
          Customer Lookup
        </label>
        <p className="text-xs text-gray-500 mb-4">
          Enter any one of the following to search for customer information:
        </p>
        
        <div className="space-y-3">
          {/* Phone Number */}
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <Input
              type="tel"
              placeholder="Phone number (e.g., 555-123-4567)"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                setHasSearched(false);
                setSearchResults([]);
              }}
              onKeyPress={handleKeyPress}
              className="pl-10"
              disabled={isSearching || isLoading}
            />
          </div>

          {/* First Name */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                setHasSearched(false);
                setSearchResults([]);
              }}
              onKeyPress={handleKeyPress}
              className="pl-10"
              disabled={isSearching || isLoading}
            />
          </div>

          {/* Last Name */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                setHasSearched(false);
                setSearchResults([]);
              }}
              onKeyPress={handleKeyPress}
              className="pl-10"
              disabled={isSearching || isLoading}
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setHasSearched(false);
                setSearchResults([]);
              }}
              onKeyPress={handleKeyPress}
              className="pl-10"
              disabled={isSearching || isLoading}
            />
          </div>

          {/* Address */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Address, City, or Zip Code"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setHasSearched(false);
                setSearchResults([]);
              }}
              onKeyPress={handleKeyPress}
              className="pl-10"
              disabled={isSearching || isLoading}
            />
          </div>
        </div>

        {/* Search Button */}
        <div className="flex gap-2 mt-4">
          <Button
            onClick={handleSearch}
            disabled={!hasAnyValue || isSearching || isLoading}
            className="bg-red-600 hover:bg-red-700 text-white flex-1"
          >
            {isSearching ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Search
              </>
            )}
          </Button>
          {hasSearched && (
            <Button
              onClick={clearSearch}
              variant="outline"
              disabled={isSearching || isLoading}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Search Results */}
      {hasSearched && !isSearching && (
        <div className="mt-4">
          {searchResults.length === 0 ? (
            <Card className="p-4 bg-yellow-50 border-yellow-200">
              <p className="text-sm text-yellow-800">
                No leads found matching your search criteria. You can still proceed with manual entry.
              </p>
            </Card>
          ) : searchResults.length === 1 ? (
            <Card className="p-4 bg-green-50 border-green-200">
              <p className="text-sm text-green-800 font-medium mb-2">Lead found and loaded!</p>
              <div className="text-xs text-green-700">
                <p><strong>Name:</strong> {searchResults[0].name}</p>
                <p><strong>Email:</strong> {searchResults[0].email}</p>
                <p><strong>Phone:</strong> {searchResults[0].phone}</p>
                {searchResults[0].address && (
                  <p><strong>Address:</strong> {searchResults[0].address.street}, {searchResults[0].address.city}, {searchResults[0].address.state} {searchResults[0].address.zip}</p>
                )}
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-navy mb-3">
                Found {searchResults.length} leads matching your search. Please select one:
              </p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {searchResults.map((lead) => (
                  <Card
                    key={lead.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer border border-gray-200 transition-colors"
                    onClick={() => handleLeadClick(lead)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-navy">{lead.name}</h4>
                          {lead.status && (
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              lead.status === 'converted' ? 'bg-green-100 text-green-800' :
                              lead.status === 'qualified' ? 'bg-blue-100 text-blue-800' :
                              lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {lead.status}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          <div>
                            <span className="font-medium">Email:</span> {lead.email}
                          </div>
                          <div>
                            <span className="font-medium">Phone:</span> {lead.phone}
                          </div>
                          <div>
                            <span className="font-medium">Created:</span>{' '}
                            {format(parseISO(lead.createdAt), 'MMM d, yyyy')}
                          </div>
                          {lead.leadSource && (
                            <div>
                              <span className="font-medium">Source:</span> {lead.leadSource}
                            </div>
                          )}
                          {lead.leadSourceDetails && (
                            <div className="col-span-2">
                              <span className="font-medium">Source Details:</span> {lead.leadSourceDetails}
                            </div>
                          )}
                          {lead.address && (
                            <div className="col-span-2">
                              <span className="font-medium">Address:</span>{' '}
                              {lead.address.street}, {lead.address.city}, {lead.address.state} {lead.address.zip}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLeadClick(lead);
                        }}
                        className="ml-4"
                      >
                        Select
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
