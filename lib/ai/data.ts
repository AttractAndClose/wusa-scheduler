/**
 * Server-side data loading and aggregation for AI analysis
 * Loads data from JSON files and aggregates metrics based on filters
 */

import fs from 'fs/promises';
import path from 'path';
import type { AffiliateFunnelData } from '@/types/territory-map';
import {
  filterByTerritories,
  filterByLeadSources,
  filterByDateRange,
  calculateMetrics,
  compareLeadSources,
  getMetricsByTerritory,
  type DateRange,
} from '@/lib/affiliate-analytics';
import { truncateComparisonData, truncateTerritoryMetrics } from './format';

export interface AIAnalysisFilters {
  dateRange: { start: string; end: string };
  selectedTerritories: string[];
  selectedLeadSources: string[];
  maxLeadSources?: number; // Limit number of lead sources in comparison
  maxTerritories?: number; // Limit number of territories in comparison
}

export interface AIAnalysisInput {
  overallMetrics: any;
  comparisonData: any[];
  territoryMetrics: any[];
  dateRange: { start: string; end: string };
  selectedTerritories: string[];
  selectedLeadSources: string[];
}

// Simple in-memory cache with TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(filters: AIAnalysisFilters): string {
  return JSON.stringify({
    start: filters.dateRange.start,
    end: filters.dateRange.end,
    territories: filters.selectedTerritories.sort().join(','),
    leadSources: filters.selectedLeadSources.sort().join(','),
  });
}

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

function setCached<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Load affiliate funnel data from JSON file (server-side)
 */
async function loadAffiliateFunnelDataFromFile(): Promise<AffiliateFunnelData[]> {
  try {
    const filePath = path.join(
      process.cwd(),
      'public',
      'data',
      'territory-map',
      'affiliate-funnel-data.json'
    );
    
    const fileContents = await fs.readFile(filePath, 'utf8');
    const data: AffiliateFunnelData[] = JSON.parse(fileContents);
    return data;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.warn('[AI Data] Affiliate funnel data file not found');
      return [];
    }
    console.error('[AI Data] Error loading affiliate funnel data:', error);
    return [];
  }
}

/**
 * Load and aggregate data for AI analysis based on filters
 * This is the main entry point for server-side data loading
 */
export async function loadAiAnalysisInput(
  filters: AIAnalysisFilters
): Promise<AIAnalysisInput> {
  // Check cache first
  const cacheKey = getCacheKey(filters);
  const cached = getCached<AIAnalysisInput>(cacheKey);
  if (cached) {
    console.log('[AI Data] Using cached data');
    return cached;
  }

  console.log('[AI Data] Loading data from files...', {
    dateRange: filters.dateRange,
    territoriesCount: filters.selectedTerritories.length,
    leadSourcesCount: filters.selectedLeadSources.length,
  });

  // Load raw data
  let data = await loadAffiliateFunnelDataFromFile();
  
  if (data.length === 0) {
    console.warn('[AI Data] No data loaded, returning empty metrics');
    return {
      overallMetrics: {
        totalLeads: 0,
        appointmentsSet: 0,
        pitches: 0,
        sales: 0,
        installed: 0,
        totalSoldAmount: 0,
        totalInstalledRevenue: 0,
        averageSaleAmount: 0,
        revenuePerLead: 0,
        averageCreditScore: 0,
        averageEfScore: 0,
        leadToAppointmentRate: 0,
        appointmentToPitchRate: 0,
        pitchToSaleRate: 0,
        cancellationRate: 0,
        saleCanceledRate: 0,
        noPitchRate: 0,
        creditRanRate: 0,
        lenderApprovalRate: 0,
        financeDeclineRate: 0,
        cashDealRate: 0,
      },
      comparisonData: [],
      territoryMetrics: [],
      dateRange: filters.dateRange,
      selectedTerritories: filters.selectedTerritories,
      selectedLeadSources: filters.selectedLeadSources,
    };
  }

  // Apply filters
  const dateRange: DateRange = {
    start: new Date(filters.dateRange.start),
    end: new Date(filters.dateRange.end),
  };
  
  data = filterByDateRange(data, dateRange);
  
  if (filters.selectedTerritories.length > 0) {
    data = filterByTerritories(data, filters.selectedTerritories);
  }
  
  if (filters.selectedLeadSources.length > 0) {
    data = filterByLeadSources(data, filters.selectedLeadSources);
  }

  console.log('[AI Data] Data filtered', {
    filteredCount: data.length,
  });

  // Calculate metrics
  const overallMetrics = calculateMetrics(data);
  
  // Get comparison data (lead sources)
  let comparisonData = compareLeadSources(
    data,
    filters.selectedLeadSources.length > 0 ? filters.selectedLeadSources : undefined
  );
  
  // Truncate to top N if specified
  if (filters.maxLeadSources && filters.maxLeadSources > 0) {
    comparisonData = truncateComparisonData(comparisonData, filters.maxLeadSources);
  }

  // Get territory metrics
  let territoryMetrics = getMetricsByTerritory(
    data,
    filters.selectedTerritories.length > 0 ? filters.selectedTerritories : undefined
  );
  
  // Truncate to top N if specified
  if (filters.maxTerritories && filters.maxTerritories > 0) {
    territoryMetrics = truncateTerritoryMetrics(territoryMetrics, filters.maxTerritories);
  }

  const result: AIAnalysisInput = {
    overallMetrics,
    comparisonData,
    territoryMetrics,
    dateRange: filters.dateRange,
    selectedTerritories: filters.selectedTerritories,
    selectedLeadSources: filters.selectedLeadSources,
  };

  // Cache the result
  setCached(cacheKey, result);

  console.log('[AI Data] Data aggregated', {
    totalLeads: overallMetrics.totalLeads,
    comparisonDataCount: comparisonData.length,
    territoryMetricsCount: territoryMetrics.length,
  });

  return result;
}

/**
 * Clear the cache (useful for testing or when data is updated)
 */
export function clearAiDataCache(): void {
  cache.clear();
  console.log('[AI Data] Cache cleared');
}

