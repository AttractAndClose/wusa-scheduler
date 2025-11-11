'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { getAllServiceableZips } from '@/lib/serviceable-zips';
import type { ServiceableZip } from '@/types/serviceable-zips';

function ServiceableZipsContent() {
  const { isLoaded, isSignedIn } = useUser();
  const searchParams = useSearchParams();
  const [zips, setZips] = useState<ServiceableZip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

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
      try {
        const data = await getAllServiceableZips();
        console.log('Loaded zip codes:', data.length);
        setZips(data);
      } catch (error) {
        console.error('Error loading zip codes:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadZips();
  }, []);

  // Filter and paginate zip codes
  const filteredZips = useMemo(() => {
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

    return filtered;
  }, [searchTerm, stateFilter, zips]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredZips.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedZips = filteredZips.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, stateFilter]);

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
    <AppLayout>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-navy mb-2">Serviceable Zip Codes</h1>
          <p className="text-navy/70">Manage zip codes where installation services are available</p>
        </div>

        {/* Filters and Actions */}
        <Card className="p-4 mb-6 border border-gray-300 bg-white">
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
          </div>
          <div className="mt-4 text-sm text-navy/70">
            Showing {filteredZips.length} of {zips.length} zip codes
            {zips.length === 0 && (
              <span className="text-red-600 ml-2">⚠️ No zip codes loaded. Check browser console for errors.</span>
            )}
          </div>
        </Card>

        {/* Table */}
        <Card className="border border-gray-300 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-navy text-white">
                <tr>
                  <th className="px-4 py-3 text-center text-sm font-medium">Excluded</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">State</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">Zip Code</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">County</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedZips.map((zip) => (
                  <tr
                    key={zip.zip}
                    className={zip.excluded ? 'bg-red-50' : 'bg-white hover:bg-gray-50'}
                  >
                    <td className="px-4 py-3 text-center text-sm text-navy">
                      {zip.excluded ? 'Yes' : 'No'}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-navy font-medium">
                      {zip.stateName} ({zip.state})
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-navy font-mono">
                      {zip.zip}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-navy/70">
                      {zip.county}
                    </td>
                    <td className="px-4 py-3 text-sm text-navy/70">
                      {zip.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="text-sm text-navy/70">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredZips.length)} of {filteredZips.length} zip codes
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="text-sm text-navy/70 px-3">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>
    </AppLayout>
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

