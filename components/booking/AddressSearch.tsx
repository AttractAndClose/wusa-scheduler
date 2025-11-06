'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import type { Address } from '@/types';

// Declare Google Maps types
declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

interface AddressSearchProps {
  onSearch: (address: Address) => void;
  isLoading?: boolean;
  initialAddress?: string;
}

export function AddressSearch({ onSearch, isLoading, initialAddress }: AddressSearchProps) {
  const [addressInput, setAddressInput] = useState(initialAddress || '');
  const autocompleteRef = useRef<HTMLInputElement>(null);
  const autocompleteInstanceRef = useRef<any>(null);

  // Initialize Google Maps Places Autocomplete
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    // Only load Google Maps if API key is available
    if (!apiKey) {
      console.warn('Google Maps API key not found. Address autocomplete will use manual parsing.');
      return;
    }

    // Load Google Maps script if not already loaded
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initializeAutocomplete();
      };
      script.onerror = () => {
        console.error('Failed to load Google Maps API');
      };
      document.head.appendChild(script);
    } else {
      initializeAutocomplete();
    }

    function initializeAutocomplete() {
      if (!autocompleteRef.current || !window.google) return;

      const autocomplete = new window.google.maps.places.Autocomplete(
        autocompleteRef.current,
        {
          types: ['address'],
          componentRestrictions: { country: 'us' },
        }
      );

      autocompleteInstanceRef.current = autocomplete;

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry && place.address_components) {
          const address = parseGooglePlace(place);
          if (address) {
            setAddressInput(formatAddressString(address));
            onSearch(address);
          }
        }
      });
    }

    return () => {
      if (autocompleteInstanceRef.current) {
        window.google?.maps?.event?.clearInstanceListeners?.(autocompleteInstanceRef.current);
      }
    };
  }, [onSearch]);

  // Update input when initialAddress changes and auto-search if valid
  useEffect(() => {
    if (initialAddress && initialAddress !== addressInput) {
      setAddressInput(initialAddress);
      // Auto-search if address looks complete (has state and zip)
      const hasStateZip = /\b([A-Z]{2})\s+(\d{5}(?:-\d{4})?)\b/i.test(initialAddress);
      if (hasStateZip) {
        // Small delay to ensure input is updated
        setTimeout(() => {
          handleManualAddress(initialAddress);
        }, 100);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAddress]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!addressInput.trim()) {
      alert('Please enter an address');
      return;
    }

    // If Google Maps is available, try to geocode the address
    if (window.google && window.google.maps && window.google.maps.Geocoder) {
      try {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: addressInput }, (results: any[] | null, status: string) => {
          if (status === 'OK' && results && results.length > 0 && results[0]) {
            const address = parseGooglePlace(results[0]);
            if (address) {
              onSearch(address);
              return;
            }
          }
          // Fallback to manual parsing if geocoding fails or returns invalid data
          handleManualAddress(addressInput);
        });
      } catch (error) {
        console.error('Error geocoding address:', error);
        // Fallback to manual parsing on error
        handleManualAddress(addressInput);
      }
    } else {
      // Fallback to manual parsing if Google Maps not available
      handleManualAddress(addressInput);
    }
  };

  const handleManualAddress = (addressString: string) => {
    const trimmed = addressString.trim();
    
    // State abbreviations list
    const states = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'];
    
    // Try parsing with commas first (format: "Street, City, State ZIP")
    const commaParts = trimmed.split(',').map(p => p.trim());
    
    if (commaParts.length >= 3) {
      const street = commaParts[0];
      const city = commaParts[1];
      const stateZip = commaParts[2];
      
      // Extract state and zip
      const stateZipMatch = stateZip.match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i);
      
      if (stateZipMatch) {
        const state = stateZipMatch[1].toUpperCase();
        const zip = stateZipMatch[2];
        
        if (states.includes(state)) {
          const address = createAddress(street, city, state, zip);
          onSearch(address);
          return;
        }
      }
    }
    
    // Try parsing without commas (format: "Street City State ZIP")
    // Look for state abbreviation followed by zip code
    const stateZipRegex = /\b([A-Z]{2})\s+(\d{5}(?:-\d{4})?)\b/i;
    const stateZipMatch = trimmed.match(stateZipRegex);
    
    if (stateZipMatch) {
      const state = stateZipMatch[1].toUpperCase();
      const zip = stateZipMatch[2];
      const stateZipIndex = stateZipMatch.index!;
      
      if (states.includes(state)) {
        // Everything before state/zip is street + city
        const beforeStateZip = trimmed.substring(0, stateZipIndex).trim();
        
        // Try to split street and city (usually city is the last word before state)
        // For addresses like "274 ganton drive raeford nc 28376"
        // We'll take everything except the last word as street, last word as city
        const words = beforeStateZip.split(/\s+/);
        
        if (words.length >= 2) {
          // Last word is likely the city, rest is street
          const city = words[words.length - 1];
          const street = words.slice(0, -1).join(' ');
          
          const address = createAddress(street, city, state, zip);
          onSearch(address);
          return;
        } else if (words.length === 1) {
          // Only one word before state - treat as street, use city from state
          const street = words[0];
          const city = 'Unknown'; // Fallback
          
          const address = createAddress(street, city, state, zip);
          onSearch(address);
          return;
        }
      }
    }
    
    // If we still haven't parsed it, try to find just a zip code
    const zipMatch = trimmed.match(/\b(\d{5}(?:-\d{4})?)\b/);
    if (zipMatch) {
      const zip = zipMatch[1];
      const zipIndex = zipMatch.index!;
      const beforeZip = trimmed.substring(0, zipIndex).trim();
      
      // Try to find state abbreviation before zip
      const stateMatch = beforeZip.match(/\b([A-Z]{2})\s*$/i);
      if (stateMatch && states.includes(stateMatch[1].toUpperCase())) {
        const state = stateMatch[1].toUpperCase();
        const beforeState = beforeZip.substring(0, stateMatch.index!).trim();
        const words = beforeState.split(/\s+/);
        
        if (words.length >= 2) {
          const city = words[words.length - 1];
          const street = words.slice(0, -1).join(' ');
          const address = createAddress(street, city, state, zip);
          onSearch(address);
          return;
        }
      }
    }

    alert('Please enter a valid address (e.g., "123 Main St, Phoenix, AZ 85001" or "123 Main St Phoenix AZ 85001")');
  };

  const createAddress = (street: string, city: string, state: string, zip: string): Address => {
    // Use approximate geocoding
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
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-navy mb-1">
          Customer Address
        </label>
        <Input
          ref={autocompleteRef}
          id="address"
          type="text"
          placeholder="Enter or paste full address (e.g., 123 Main St, Phoenix, AZ 85001)"
          value={addressInput}
          onChange={(e) => setAddressInput(e.target.value)}
          disabled={isLoading}
          required
          className="border-gray-300 focus:border-primary focus:ring-primary text-base"
        />
        <p className="mt-1 text-xs text-navy/60">
          Start typing to see address suggestions, or paste a full address
        </p>
      </div>
      
      <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary-dark text-white">
        <Search className="mr-2 h-4 w-4" />
        {isLoading ? 'Searching...' : 'Find Available Times'}
      </Button>
    </form>
  );
}
