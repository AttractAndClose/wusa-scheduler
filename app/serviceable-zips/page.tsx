'use client';

import { useState, useEffect, Suspense } from 'react';
import { useUser } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Save, Search } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getAllServiceableZips, saveServiceableZips } from '@/lib/serviceable-zips';
import type { ServiceableZip } from '@/types/serviceable-zips';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

function ServiceableZipsContent() {
  const { isLoaded, isSignedIn } = useUser();
  const searchParams = useSearchParams();
  const [zips, setZips] = useState<ServiceableZip[]>([]);
  const [filteredZips, setFilteredZips] = useState<ServiceableZip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      window.location.href = '/sign-in';
    }
  }, [isLoaded, isSignedIn]);

  // Load zip codes
  useEffect(() => {
    async function loadZips() {
      setIsLoading(true);
      const data = await getAllServiceableZips();
      setZips(data);
      setFilteredZips(data);
      setIsLoading(false);
    }
    loadZips();
  }, []);

  // Filter zip codes
  useEffect(() => {
    let filtered = [...zips];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        z => 
          z.zip.toLowerCase().includes(term) ||
          z.county.toLowerCase().includes(term) ||
          z.state.toLowerCase().includes(term) ||
          z.stateName.toLowerCase().includes(term)
      );
    }

    if (stateFilter) {
      filtered = filtered.filter(z => z.state === stateFilter);
    }

    setFilteredZips(filtered);
  }, [searchTerm, stateFilter, zips]);

  const handleExcludedChange = (zip: string, excluded: boolean) => {
    setZips(prevZips =>
      prevZips.map(z =>
        z.zip === zip ? { ...z, excluded } : z
      )
    );
    setHasChanges(true);
  };

  const handleNotesChange = (zip: string, notes: string) => {
    setZips(prevZips =>
      prevZips.map(z =>
        z.zip === zip ? { ...z, notes } : z
      )
    );
    setHasChanges(true);
  };

  const handleSave = () => {
    saveServiceableZips(zips);
    setHasChanges(false);
    alert('Serviceable zip codes saved successfully!');
  };

  const states = ['AL', 'AR', 'GA', 'IL', 'KS', 'KY', 'LA', 'MS', 'MO', 'NC', 'OK', 'SC', 'TN', 'TX'];
  const stateNames: Record<string, string> = {
    'AL': 'Alabama',
    'AR': 'Arkansas',
    'GA': 'Georgia',
    'IL': 'Illinois',
    'KS': 'Kansas',
    'KY': 'Kentucky',
    'LA': 'Louisiana',
    'MS': 'Mississippi',
    'MO': 'Missouri',
    'NC': 'North Carolina',
    'OK': 'Oklahoma',
    'SC': 'South Carolina',
    'TN': 'Tennessee',
    'TX': 'Texas'
  };

  if (!isLoaded || !isSignedIn || isLoading) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-navy">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-light">
      {/* Header */}
      <header className="bg-white border-b-2 border-primary shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center">
                <img 
                  src="/windowsusa-logo.png" 
                  alt="Windows USA" 
                  className="h-10 w-auto"
                />
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" className="border-navy text-navy hover:bg-navy hover:text-white">
                  Back to Booking
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-navy mb-2">Serviceable Zip Codes</h1>
          <p className="text-navy/70">Manage zip codes where installation services are available</p>
        </div>

        {/* Filters and Actions */}
        <Card className="p-4 mb-6 border border-gray-300">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search" className="text-navy mb-1">Search</Label>
              <Input
                id="search"
                type="text"
                placeholder="Search by zip code, county, or state..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-gray-300 focus:border-primary focus:ring-primary"
              />
            </div>
            <div className="w-full md:w-48">
              <Label htmlFor="state" className="text-navy mb-1">Filter by State</Label>
              <select
                id="state"
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-primary focus:ring-primary"
              >
                <option value="">All States</option>
                {states.map(state => (
                  <option key={state} value={state}>{stateNames[state]}</option>
                ))}
              </select>
            </div>
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              className="bg-primary hover:bg-primary-dark text-white"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
          <div className="mt-4 text-sm text-navy/70">
            Showing {filteredZips.length} of {zips.length} zip codes
          </div>
        </Card>

        {/* Table */}
        <Card className="border border-gray-300 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-navy text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Exclude</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">State</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Zip Code</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">County</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredZips.map((zip) => (
                  <tr
                    key={zip.zip}
                    className={zip.excluded ? 'bg-red-50' : 'bg-white hover:bg-gray-50'}
                  >
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={zip.excluded}
                        onCheckedChange={(checked) => handleExcludedChange(zip.zip, checked === true)}
                        className="border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-navy font-medium">
                      {zip.stateName} ({zip.state})
                    </td>
                    <td className="px-4 py-3 text-sm text-navy font-mono">
                      {zip.zip}
                    </td>
                    <td className="px-4 py-3 text-sm text-navy/70">
                      {zip.county}
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="text"
                        placeholder="Add notes..."
                        value={zip.notes}
                        onChange={(e) => handleNotesChange(zip.zip, e.target.value)}
                        className="border-gray-300 focus:border-primary focus:ring-primary text-sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}

export default function ServiceableZipsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-navy">Loading...</p>
        </div>
      </div>
    }>
      <ServiceableZipsContent />
    </Suspense>
  );
}

