'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { AppLayout } from '@/components/layout/AppLayout';
import { loadAffiliateFunnelData } from '@/lib/territory-map/dataLoader';
import type { AffiliateFunnelData } from '@/types/territory-map';
import {
  filterByTerritories,
  filterByLeadSources,
  filterByDateRange,
  getDateRangeForPreset,
  aggregateByTimePeriod,
  calculateMetrics,
  compareLeadSources,
  getMetricsByTerritory,
  getUniqueTerritories,
  getUniqueLeadSources,
  type DatePreset,
  type TimeGranularity,
} from '@/lib/affiliate-analytics';
import FilterControls from '@/components/affiliate-management/FilterControls';
import MetricBlocks from '@/components/affiliate-management/MetricBlocks';
import AffiliateCharts from '@/components/affiliate-management/AffiliateCharts';
import ComparisonTable from '@/components/affiliate-management/ComparisonTable';
import TerritoryBreakdown from '@/components/affiliate-management/TerritoryBreakdown';
import { Card, CardContent } from '@/components/ui/card';
import { useIsAuthorizedEmail } from '@/lib/use-admin';

const AUTHORIZED_EMAIL = 'dan@windowsusa.com';

export default function AffiliateManagementPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const isAuthorized = useIsAuthorizedEmail(AUTHORIZED_EMAIL);
  const [data, setData] = useState<AffiliateFunnelData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter state
  const [datePreset, setDatePreset] = useState<DatePreset>('last30');
  const [timeGranularity, setTimeGranularity] = useState<TimeGranularity>('weekly');
  const [selectedTerritories, setSelectedTerritories] = useState<string[]>([]);
  const [selectedLeadSources, setSelectedLeadSources] = useState<string[]>([]);

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  // Redirect if not authorized
  useEffect(() => {
    if (isLoaded && isSignedIn && !isAuthorized) {
      router.push('/dashboard');
    }
  }, [isLoaded, isSignedIn, isAuthorized, router]);

  // Load data
  useEffect(() => {
    if (!isAuthorized) return; // Don't load data if not authorized
    
    async function loadData() {
      setIsLoading(true);
      try {
        const affiliateData = await loadAffiliateFunnelData();
        setData(affiliateData);
      } catch (error) {
        console.error('Error loading affiliate funnel data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [isAuthorized]);

  // Get unique values for filters
  const availableTerritories = useMemo(() => getUniqueTerritories(data), [data]);
  const availableLeadSources = useMemo(() => getUniqueLeadSources(data), [data]);

  // Apply filters
  const filteredData = useMemo(() => {
    let result = [...data];
    
    // Filter by date range
    const dateRange = getDateRangeForPreset(datePreset);
    result = filterByDateRange(result, dateRange);
    
    // Filter by territories
    if (selectedTerritories.length > 0) {
      result = filterByTerritories(result, selectedTerritories);
    }
    
    // Filter by lead sources
    if (selectedLeadSources.length > 0) {
      result = filterByLeadSources(result, selectedLeadSources);
    }
    
    return result;
  }, [data, datePreset, selectedTerritories, selectedLeadSources]);

  // Calculate overall metrics
  const overallMetrics = useMemo(() => calculateMetrics(filteredData), [filteredData]);

  // Time series data
  const timeSeriesData = useMemo(() => {
    return aggregateByTimePeriod(filteredData, timeGranularity);
  }, [filteredData, timeGranularity]);

  // Comparison data - show all selected sources or all sources
  const comparisonData = useMemo(() => {
    return compareLeadSources(filteredData, selectedLeadSources.length > 0 ? selectedLeadSources : undefined);
  }, [filteredData, selectedLeadSources]);

  // Territory metrics
  const territoryMetrics = useMemo(
    () => getMetricsByTerritory(filteredData, selectedTerritories.length > 0 ? selectedTerritories : undefined),
    [filteredData, selectedTerritories]
  );

  // Show loading state while checking auth or loading data
  if (!isLoaded || !isSignedIn) {
    return (
      <AppLayout>
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Checking access...</p>
            </div>
          </div>
        </main>
      </AppLayout>
    );
  }

  // Redirect if not authorized (show loading while redirecting)
  if (!isAuthorized) {
    return (
      <AppLayout>
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Redirecting...</p>
            </div>
          </div>
        </main>
      </AppLayout>
    );
  }

  // Show loading while data is loading
  if (isLoading) {
    return (
      <AppLayout>
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading affiliate data...</p>
            </div>
          </div>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-navy mb-2">Performance Reports</h1>
            <p className="text-gray-600">
              Analyze performance metrics for Lead Source Details over time, broken down by territory.
            </p>
          </div>

          {/* Filter Controls */}
          <FilterControls
            datePreset={datePreset}
            onDatePresetChange={setDatePreset}
            timeGranularity={timeGranularity}
            onTimeGranularityChange={setTimeGranularity}
            selectedTerritories={selectedTerritories}
            availableTerritories={availableTerritories}
            onTerritoriesChange={setSelectedTerritories}
            selectedLeadSources={selectedLeadSources}
            availableLeadSources={availableLeadSources}
            onLeadSourcesChange={setSelectedLeadSources}
          />

          {/* Metric Blocks */}
          <MetricBlocks metrics={overallMetrics} />

          {/* Charts Section */}
          <AffiliateCharts
            timeSeriesData={timeSeriesData}
            comparisonData={comparisonData}
            selectedLeadSources={selectedLeadSources}
            comparisonMode="comparison"
          />

          {/* Comparison Table */}
          <ComparisonTable comparisonData={comparisonData} comparisonMode="comparison" />

          {/* Territory Breakdown */}
          <TerritoryBreakdown territoryMetrics={territoryMetrics} />
        </div>
      </main>
    </AppLayout>
  );
}
