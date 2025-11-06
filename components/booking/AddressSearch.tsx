'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import type { Address } from '@/types';

interface AddressSearchProps {
  onSearch: (address: Address) => void;
  isLoading?: boolean;
}

export function AddressSearch({ onSearch, isLoading }: AddressSearchProps) {
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!street || !city || !state || !zip) {
      alert('Please fill in all address fields');
      return;
    }

    // For MVP, we'll use approximate geocoding
    // In production, this would call a geocoding API
    const address: Address = {
      street: street.trim(),
      city: city.trim(),
      state: state.trim().toUpperCase(),
      zip: zip.trim(),
      lat: 0, // Would be geocoded
      lng: 0  // Would be geocoded
    };

    // Simple geocoding approximation based on state
    // This is a placeholder - real implementation would use an API
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

    const center = stateCenters[address.state] || { lat: 33.7490, lng: -84.3880 };
    // Add some variation based on zip code
    const zipNum = parseInt(address.zip.substring(0, 2)) || 0;
    address.lat = center.lat + (zipNum % 10 - 5) * 0.05;
    address.lng = center.lng + (zipNum % 10 - 5) * 0.05;

    onSearch(address);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="street" className="block text-sm font-medium text-navy mb-1">
          Street Address
        </label>
        <Input
          id="street"
          type="text"
          placeholder="123 Main St"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          disabled={isLoading}
          required
          className="border-gray-300 focus:border-primary focus:ring-primary"
        />
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-navy mb-1">
            City
          </label>
          <Input
            id="city"
            type="text"
            placeholder="Phoenix"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={isLoading}
            required
            className="border-gray-300 focus:border-primary focus:ring-primary"
          />
        </div>
        
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-navy mb-1">
            State
          </label>
          <Input
            id="state"
            type="text"
            placeholder="AZ"
            value={state}
            onChange={(e) => setState(e.target.value.toUpperCase())}
            disabled={isLoading}
            maxLength={2}
            required
            className="border-gray-300 focus:border-primary focus:ring-primary"
          />
        </div>
        
        <div>
          <label htmlFor="zip" className="block text-sm font-medium text-navy mb-1">
            ZIP Code
          </label>
          <Input
            id="zip"
            type="text"
            placeholder="85001"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            disabled={isLoading}
            maxLength={5}
            required
            className="border-gray-300 focus:border-primary focus:ring-primary"
          />
        </div>
      </div>
      
      <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary-dark text-white">
        <Search className="mr-2 h-4 w-4" />
        {isLoading ? 'Searching...' : 'Find Available Times'}
      </Button>
    </form>
  );
}

