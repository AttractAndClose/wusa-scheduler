'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { CensusStats } from '@/components/booking/CensusStats';
import type { Address } from '@/types';

export default function ZipDemographicsPage() {
  const [zipCode, setZipCode] = useState<string>('');
  const [submittedZip, setSubmittedZip] = useState<string>('');
  const [address, setAddress] = useState<Address | null>(null);

  const handleSearch = () => {
    const trimmedZip = zipCode.trim();
    if (trimmedZip.length >= 5) {
      // Extract just the 5-digit zip code
      const fiveDigitZip = trimmedZip.substring(0, 5);
      setSubmittedZip(fiveDigitZip);
      
      // Create a minimal address object for CensusStats
      // CensusStats only uses the zip property
      setAddress({
        zip: fiveDigitZip,
        lat: 0, // Not used by CensusStats
        lng: 0, // Not used by CensusStats
        street: '',
        city: '',
        state: '',
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <AppLayout>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Census Stats - Always displayed with search in top right */}
          <CensusStats 
            address={address} 
            zipCode={zipCode}
            onZipCodeChange={setZipCode}
            onSearch={handleSearch}
            onKeyPress={handleKeyPress}
          />
        </div>
      </main>
    </AppLayout>
  );
}

