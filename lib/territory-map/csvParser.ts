import Papa from 'papaparse';
import type { FunnelData, ZipCodeMetadata } from '@/types/territory-map';

/**
 * Parse funnel data CSV
 */
export function parseFunnelCSV(csvText: string): FunnelData[] {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => {
      // Normalize header names
      const normalized = header.toLowerCase().trim();
      if (normalized.includes('zip')) return 'zipCode';
      if (normalized.includes('date')) return 'date';
      if (normalized.includes('lead')) return 'leads';
      if (normalized.includes('appointment')) return 'appointments';
      if (normalized.includes('sale')) return 'sales';
      if (normalized.includes('revenue')) return 'revenue';
      return normalized;
    }
  });
  
  if (result.errors.length > 0) {
    console.warn('CSV parsing errors:', result.errors);
  }
  
  const funnelData: FunnelData[] = [];
  
  for (const row of result.data as any[]) {
    if (!row.zipCode) continue;
    
    funnelData.push({
      zipCode: row.zipCode.toString().padStart(5, '0'),
      date: row.date || new Date().toISOString().split('T')[0],
      leads: parseFloat(row.leads) || 0,
      appointments: parseFloat(row.appointments) || 0,
      sales: parseFloat(row.sales) || 0,
      revenue: parseFloat(row.revenue) || 0
    });
  }
  
  return funnelData;
}

/**
 * Parse metrics CSV (population, income, etc.)
 */
export function parseMetricsCSV(csvText: string): ZipCodeMetadata {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => {
      // Normalize header names
      const normalized = header.toLowerCase().trim();
      if (normalized.includes('zip')) return 'zipCode';
      if (normalized.includes('population')) return 'population';
      if (normalized.includes('income')) return 'householdIncome';
      if (normalized.includes('county')) return 'county';
      if (normalized.includes('state')) return 'state';
      return normalized;
    }
  });
  
  if (result.errors.length > 0) {
    console.warn('CSV parsing errors:', result.errors);
  }
  
  const metadata: ZipCodeMetadata = {};
  
  for (const row of result.data as any[]) {
    if (!row.zipCode) continue;
    
    const zipCode = row.zipCode.toString().padStart(5, '0');
    metadata[zipCode] = {
      population: row.population ? parseFloat(row.population) : undefined,
      householdIncome: row.householdIncome ? parseFloat(row.householdIncome) : undefined,
      county: row.county || undefined,
      state: row.state || undefined
    };
  }
  
  return metadata;
}

/**
 * Validate CSV format
 */
export function validateCSVFormat(csvText: string, type: 'funnel' | 'metrics'): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  try {
    const result = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true
    });
    
    if (result.data.length === 0) {
      errors.push('CSV file is empty');
      return { valid: false, errors };
    }
    
    const headers = result.meta.fields || [];
    const headerLower = headers.map(h => h.toLowerCase());
    
    if (type === 'funnel') {
      if (!headerLower.some(h => h.includes('zip'))) {
        errors.push('Missing zip code column');
      }
      if (!headerLower.some(h => h.includes('date'))) {
        errors.push('Missing date column');
      }
    } else if (type === 'metrics') {
      if (!headerLower.some(h => h.includes('zip'))) {
        errors.push('Missing zip code column');
      }
    }
    
    return { valid: errors.length === 0, errors };
  } catch (error) {
    errors.push(`Failed to parse CSV: ${error}`);
    return { valid: false, errors };
  }
}

