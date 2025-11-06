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
  }
}

interface AddressSearchProps {
  onSearch: (address: Address) => void;
  isLoading?: boolean;
  initialAddress?: string;
}

export function AddressSearch({ onSearch, isLoading, initialAddress }: AddressSearchProps) {
  const [addressInput, setAddressInput] = useState(initialAddress || '');
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const autocompleteRef = useRef<HTMLInputElement>(null);
  const autocompleteInstanceRef = useRef<any>(null);

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
      return;
    }

    // Load Google Maps script
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        setIsGoogleMapsLoaded(true);
        initializeAutocomplete();
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
            onSearch(address);
          }
        }
      });
    } catch (error) {
      console.error('Error initializing autocomplete:', error);
    }
  };

  // Update input when initialAddress changes
  useEffect(() => {
    if (initialAddress && initialAddress !== addressInput) {
      setAddressInput(initialAddress);
    }
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
    if (window.google?.maps?.Geocoder) {
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
          // Fallback to manual parsing if geocoding fails
          handleManualAddress(addressInput);
        });
      } catch (error) {
        console.error('Error geocoding address:', error);
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
          onSearch(address);
          return;
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
          onSearch(address);
          return;
        }
      }
    }

    alert('Please enter a valid address (e.g., "123 Main St, Phoenix, AZ 85001" or "123 Main St Phoenix AZ 85001")');
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
          autoComplete="off"
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
