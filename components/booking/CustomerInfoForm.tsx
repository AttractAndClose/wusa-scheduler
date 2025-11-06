'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Label } from '@/components/ui/label';
import type { Address } from '@/types';
import { isZipServiceable } from '@/lib/serviceable-zips';

// Declare Google Maps types
declare global {
  interface Window {
    google: any;
  }
}

interface CustomerInfo {
  leadId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: Address;
}

interface CustomerInfoFormProps {
  onSearch: (address: Address) => void;
  isLoading?: boolean;
  initialData?: {
    leadId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
}

export function CustomerInfoForm({ onSearch, isLoading, initialData }: CustomerInfoFormProps) {
  const [leadId, setLeadId] = useState(initialData?.leadId || '');
  const [firstName, setFirstName] = useState(initialData?.firstName || '');
  const [lastName, setLastName] = useState(initialData?.lastName || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [addressInput, setAddressInput] = useState(initialData?.address || '');
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addressError, setAddressError] = useState<string>('');
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);
  const autocompleteRef = useRef<HTMLInputElement>(null);
  const autocompleteInstanceRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);

  // Load Google Maps script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('Google Maps API key not found. Address autocomplete will use manual parsing.');
      return;
    }

    // Check if already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsGoogleMapsLoaded(true);
      initializeAutocomplete();
      if (addressInput) {
        geocodeAddress(addressInput);
      }
      return;
    }

    // Load Google Maps script
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        setIsGoogleMapsLoaded(true);
        initializeAutocomplete();
        if (addressInput) {
          geocodeAddress(addressInput);
        }
      });
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMapsAutocomplete`;
    script.async = true;
    script.defer = true;
    
    // Set up callback
    (window as any).initGoogleMapsAutocomplete = () => {
      setIsGoogleMapsLoaded(true);
      initializeAutocomplete();
      if (addressInput) {
        geocodeAddress(addressInput);
      }
    };

    script.onerror = () => {
      console.error('Failed to load Google Maps API');
    };

    document.head.appendChild(script);

    return () => {
      if (autocompleteInstanceRef.current && window.google) {
        window.google.maps.event.clearInstanceListeners(autocompleteInstanceRef.current);
      }
    };
  }, []);

  // Initialize autocomplete when Google Maps is ready
  useEffect(() => {
    if (isGoogleMapsLoaded && autocompleteRef.current && !autocompleteInstanceRef.current) {
      initializeAutocomplete();
    }
  }, [isGoogleMapsLoaded]);

  // Update form fields when initialData changes
  useEffect(() => {
    if (initialData) {
      if (initialData.leadId !== undefined) setLeadId(initialData.leadId);
      if (initialData.firstName !== undefined) setFirstName(initialData.firstName);
      if (initialData.lastName !== undefined) setLastName(initialData.lastName);
      if (initialData.email !== undefined) setEmail(initialData.email);
      if (initialData.phone !== undefined) setPhone(initialData.phone);
      if (initialData.address !== undefined && initialData.address !== addressInput) {
        setAddressInput(initialData.address);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  // Auto-geocode address when address from initialData changes
  useEffect(() => {
    if (initialData?.address && initialData.address !== addressInput && !hasAutoSubmitted) {
      setAddressInput(initialData.address);
      // Wait a bit for Google Maps to load if needed
      const timer = setTimeout(() => {
        geocodeAddress(initialData.address!, true); // true = auto-submit
      }, 1500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.address]);

  const initializeAutocomplete = () => {
    if (!autocompleteRef.current || !window.google?.maps?.places) return;

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(
        autocompleteRef.current,
        {
          types: ['address'],
          componentRestrictions: { country: 'us' },
          fields: ['address_components', 'geometry', 'formatted_address']
        }
      );

      autocompleteInstanceRef.current = autocomplete;

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry && place.address_components) {
          const address = parseGooglePlace(place);
          if (address) {
            const formatted = formatAddressString(address);
            setAddressInput(formatted);
            setShowSuggestions(false);
            handleAddressFound(address);
          }
        }
      });
    } catch (error) {
      console.error('Error initializing autocomplete:', error);
    }
  };

  const geocodeAddress = (addressString: string, autoSubmit: boolean = false) => {
    if (!window.google?.maps?.Geocoder) {
      // If Google Maps not available, try manual parsing
      if (autoSubmit) {
        const address = handleManualAddress(addressString);
        if (address) {
          handleAddressFound(address);
          setHasAutoSubmitted(true);
        } else {
          setAddressError('Could not find this address. Please select from suggestions or re-enter the address.');
        }
      }
      return;
    }

    if (!geocoderRef.current) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }

    setAddressError('');

    geocoderRef.current.geocode({ address: addressString }, (results: any[] | null, status: string) => {
      if (status === 'OK' && results && results.length > 0) {
        if (results.length === 1) {
          // Single result - auto-select and submit
          const address = parseGooglePlace(results[0]);
          if (address) {
            const formatted = formatAddressString(address);
            setAddressInput(formatted);
            setShowSuggestions(false);
            setAddressError('');
            handleAddressFound(address);
            if (autoSubmit) {
              setHasAutoSubmitted(true);
            }
          } else {
            if (autoSubmit) {
              setAddressError('Could not find this address. Please select from suggestions or re-enter the address.');
            }
          }
        } else {
          // Multiple results - show dropdown
          setAddressSuggestions(results);
          setShowSuggestions(true);
          if (autoSubmit) {
            setAddressError('Multiple addresses found. Please select the correct one from the dropdown below.');
          }
        }
      } else {
        // No results or error - try manual parsing
        const address = handleManualAddress(addressString);
        if (address) {
          handleAddressFound(address);
          if (autoSubmit) {
            setHasAutoSubmitted(true);
          }
        } else {
          if (autoSubmit) {
            setAddressError('Could not find this address. Please select from suggestions or re-enter the address.');
          }
        }
      }
    });
  };

  const handleAddressChange = (value: string) => {
    setAddressInput(value);
    setShowSuggestions(false);
    
    // If Google Maps is loaded, search for suggestions
    if (value.length > 5 && window.google?.maps?.places) {
      const service = new window.google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        { input: value, componentRestrictions: { country: 'us' } },
        (predictions: any[] | null) => {
          if (predictions && predictions.length > 0) {
            setAddressSuggestions(predictions);
            setShowSuggestions(true);
          }
        }
      );
    }
  };

  const selectSuggestion = (suggestion: any) => {
    if (suggestion.description) {
      setAddressInput(suggestion.description);
      geocodeAddress(suggestion.description, false);
    } else if (suggestion.formatted_address) {
      setAddressInput(suggestion.formatted_address);
      const address = parseGooglePlace(suggestion);
      if (address) {
        setAddressError('');
        handleAddressFound(address);
      }
    }
    setShowSuggestions(false);
  };

  const parseGooglePlace = (place: any): Address | null => {
    if (!place.geometry || !place.address_components) return null;

    let street = '';
    let city = '';
    let state = '';
    let zip = '';

    place.address_components.forEach((component: any) => {
      const types = component.types;

      if (types.includes('street_number')) {
        street = component.long_name + ' ';
      }
      if (types.includes('route')) {
        street += component.long_name;
      }
      if (types.includes('locality')) {
        city = component.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        state = component.short_name;
      }
      if (types.includes('postal_code')) {
        zip = component.long_name;
      }
    });

    if (!street || !city || !state || !zip) {
      return null;
    }

    return {
      street: street.trim(),
      city,
      state,
      zip,
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    };
  };

  const formatAddressString = (address: Address): string => {
    return `${address.street}, ${address.city}, ${address.state} ${address.zip}`;
  };

  const handleAddressFound = async (address: Address) => {
    // Check if zip code is serviceable
    const zipCheck = await isZipServiceable(address.zip);
    
    if (!zipCheck.serviceable) {
      if (zipCheck.excluded) {
        setAddressError(`This zip code (${address.zip.substring(0, 5)}) is excluded from service. ${zipCheck.notes ? `Note: ${zipCheck.notes}` : ''}`);
      } else {
        setAddressError(`We do not currently service zip code ${address.zip.substring(0, 5)}. Please enter an address in a serviceable area.`);
      }
      return;
    }
    
    // Zip is serviceable, proceed with search
    onSearch(address);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!addressInput.trim()) {
      setAddressError('Please enter an address');
      return;
    }

    setAddressError('');
    setHasAutoSubmitted(false);

    // If Google Maps is available, try to geocode the address
    if (window.google?.maps?.Geocoder) {
      geocodeAddress(addressInput, false);
    } else {
      // Fallback to manual parsing if Google Maps not available
      const address = handleManualAddress(addressInput);
      if (address) {
        handleAddressFound(address);
      } else {
        setAddressError('Please enter a valid address (e.g., "123 Main St, Phoenix, AZ 85001" or "123 Main St Phoenix AZ 85001")');
      }
    }
  };

  const handleManualAddress = (addressString: string): Address | null => {
    const trimmed = addressString.trim();
    
    // State abbreviations list
    const states = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'];
    
    // Try parsing with commas first
    const commaParts = trimmed.split(',').map(p => p.trim());
    
    if (commaParts.length >= 3) {
      const street = commaParts[0];
      const city = commaParts[1];
      const stateZip = commaParts[2];
      
      const stateZipMatch = stateZip.match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i);
      
      if (stateZipMatch) {
        const state = stateZipMatch[1].toUpperCase();
        const zip = stateZipMatch[2];
        
        if (states.includes(state)) {
          const address = createAddress(street, city, state, zip);
          return address;
        }
      }
    }
    
    // Try parsing without commas
    const stateZipRegex = /\b([A-Z]{2})\s+(\d{5}(?:-\d{4})?)\b/i;
    const stateZipMatch = trimmed.match(stateZipRegex);
    
    if (stateZipMatch) {
      const state = stateZipMatch[1].toUpperCase();
      const zip = stateZipMatch[2];
      const stateZipIndex = stateZipMatch.index!;
      
      if (states.includes(state)) {
        const beforeStateZip = trimmed.substring(0, stateZipIndex).trim();
        const words = beforeStateZip.split(/\s+/);
        
        if (words.length >= 2) {
          const city = words[words.length - 1];
          const street = words.slice(0, -1).join(' ');
          const address = createAddress(street, city, state, zip);
          return address;
        }
      }
    }

    return null;
  };

  const createAddress = (street: string, city: string, state: string, zip: string): Address => {
    const stateCenters: Record<string, { lat: number; lng: number }> = {
      'GA': { lat: 33.7490, lng: -84.3880 },
      'TX': { lat: 32.7767, lng: -96.7970 },
      'AR': { lat: 34.7465, lng: -92.2896 },
      'AL': { lat: 33.5186, lng: -86.8025 },
      'MS': { lat: 32.2988, lng: -90.1848 },
      'TN': { lat: 36.1627, lng: -86.7816 },
      'LA': { lat: 30.4515, lng: -91.1871 },
      'NC': { lat: 35.2271, lng: -80.8431 },
      'SC': { lat: 34.0007, lng: -81.0348 },
      'OK': { lat: 35.4676, lng: -97.5164 },
      'MO': { lat: 38.6270, lng: -90.1994 },
      'IL': { lat: 38.6270, lng: -90.1994 },
      'NJ': { lat: 39.8339, lng: -74.8721 }
    };

    const center = stateCenters[state] || { lat: 33.7490, lng: -84.3880 };
    const zipNum = parseInt(zip.substring(0, 2)) || 0;
    
    return {
      street: street.trim(),
      city: city.trim(),
      state: state.toUpperCase(),
      zip: zip.trim(),
      lat: center.lat + (zipNum % 10 - 5) * 0.05,
      lng: center.lng + (zipNum % 10 - 5) * 0.05,
    };
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="leadId" className="text-navy">
            Lead ID
          </Label>
          <Input
            id="leadId"
            type="text"
            value={leadId}
            onChange={(e) => setLeadId(e.target.value)}
            disabled={isLoading}
            className="border-gray-300 focus:border-primary focus:ring-primary"
          />
        </div>
        <div>
          <Label htmlFor="firstName" className="text-navy">
            First Name
          </Label>
          <Input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={isLoading}
            className="border-gray-300 focus:border-primary focus:ring-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="lastName" className="text-navy">
            Last Name
          </Label>
          <Input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={isLoading}
            className="border-gray-300 focus:border-primary focus:ring-primary"
          />
        </div>
        <div>
          <Label htmlFor="email" className="text-navy">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="border-gray-300 focus:border-primary focus:ring-primary"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="phone" className="text-navy">
          Phone
        </Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={isLoading}
          className="border-gray-300 focus:border-primary focus:ring-primary"
        />
      </div>

      <div className="relative">
        <Label htmlFor="address" className="text-navy">
          Address
        </Label>
        <Input
          ref={autocompleteRef}
          id="address"
          type="text"
          placeholder="Enter or paste full address (e.g., 123 Main St, Phoenix, AZ 85001)"
          value={addressInput}
          onChange={(e) => handleAddressChange(e.target.value)}
          disabled={isLoading}
          required
          className="border-gray-300 focus:border-primary focus:ring-primary text-base"
          autoComplete="off"
        />
        {showSuggestions && addressSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {addressSuggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => selectSuggestion(suggestion)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-navy"
              >
                {suggestion.description || suggestion.formatted_address}
              </button>
            ))}
          </div>
        )}
        <p className="mt-1 text-xs text-navy/60">
          Start typing to see address suggestions, or paste a full address
        </p>
        {addressError && (
          <div className="mt-2 bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
            {addressError}
          </div>
        )}
      </div>
      
      <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary-dark text-white">
        <Search className="mr-2 h-4 w-4" />
        {isLoading ? 'Searching...' : 'Find Available Times'}
      </Button>
    </form>
  );
}

