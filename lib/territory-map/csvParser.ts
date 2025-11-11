import Papa from 'papaparse';
import type { FunnelData, ZipCodeMetadata, AffiliateFunnelData } from '@/types/territory-map';

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
 * Parse affiliate funnel CSV (All-Affiliate-Funnel.csv)
 */
export function parseAffiliateFunnelCSV(csvText: string): AffiliateFunnelData[] {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => {
      // Map CSV headers to camelCase property names
      const headerMap: Record<string, string> = {
        'id': 'id',
        'lead source': 'leadSource',
        'lead source details': 'leadSourceDetails',
        'lead create date': 'leadCreateDate',
        'first name': 'firstName',
        'last name': 'lastName',
        'phone': 'phone',
        'email': 'email',
        'street': 'street',
        'city': 'city',
        'state': 'state',
        'zip': 'zip',
        'territory': 'territory',
        'ef score': 'efScore',
        'think unlimited prospect score': 'thinkUnlimitedProspectScore',
        'think unlimited schedule score': 'thinkUnlimitedScheduleScore',
        'set': 'set',
        'set date': 'setDate',
        'appt canceled': 'apptCanceled',
        'no pitch': 'noPitch',
        'pitch': 'pitch',
        'pitch date': 'pitchDate',
        'credit ran': 'creditRan',
        'credit score': 'creditScore',
        'lender approved': 'lenderApproved',
        'finance decline': 'financeDecline',
        'finance rejected by customer': 'financeRejectedByCustomer',
        'cash deal': 'cashDeal',
        'sold': 'sold',
        'sold date': 'soldDate',
        'sold amount': 'soldAmount',
        'sale canceled': 'saleCanceled',
        'sale canceled date': 'saleCanceledDate',
        'installed': 'installed',
        'installed date': 'installedDate',
        'installed # of windows': 'installedNumberOfWindows',
        'installed revenue': 'installedRevenue',
      };
      
      const normalized = header.trim().toLowerCase();
      return headerMap[normalized] || normalized.replace(/\s+/g, '');
    }
  });
  
  if (result.errors.length > 0) {
    console.warn('CSV parsing errors:', result.errors);
  }
  
  const affiliateFunnelData: AffiliateFunnelData[] = [];
  
  for (const row of result.data as any[]) {
    if (!row.id) continue; // Skip rows without ID
    
    // Helper function to parse numeric values
    const parseNumber = (value: any): number | null => {
      if (value === null || value === undefined || value === '') return null;
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    };
    
    // Helper function to parse boolean/numeric flags (0 or 1)
    const parseFlag = (value: any): number => {
      if (value === null || value === undefined || value === '') return 0;
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    };
    
    // Helper function to parse date strings
    const parseDate = (value: any): string | null => {
      if (!value || value === '') return null;
      return String(value).trim();
    };
    
    affiliateFunnelData.push({
      id: String(row.id || '').trim(),
      leadSource: String(row.leadSource || '').trim(),
      leadSourceDetails: String(row.leadSourceDetails || '').trim(),
      leadCreateDate: String(row.leadCreateDate || '').trim(),
      firstName: String(row.firstName || '').trim(),
      lastName: String(row.lastName || '').trim(),
      phone: String(row.phone || '').trim(),
      email: String(row.email || '').trim(),
      street: String(row.street || '').trim(),
      city: String(row.city || '').trim(),
      state: String(row.state || '').trim(),
      zip: String(row.zip || '').trim().padStart(5, '0'),
      territory: String(row.territory || '').trim(),
      efScore: parseNumber(row.efScore),
      thinkUnlimitedProspectScore: row.thinkUnlimitedProspectScore ? String(row.thinkUnlimitedProspectScore).trim() : null,
      thinkUnlimitedScheduleScore: row.thinkUnlimitedScheduleScore ? String(row.thinkUnlimitedScheduleScore).trim() : null,
      set: parseFlag(row.set),
      setDate: parseDate(row.setDate),
      apptCanceled: parseFlag(row.apptCanceled),
      noPitch: parseFlag(row.noPitch),
      pitch: parseFlag(row.pitch),
      pitchDate: parseDate(row.pitchDate),
      creditRan: parseFlag(row.creditRan),
      creditScore: parseNumber(row.creditScore),
      lenderApproved: parseFlag(row.lenderApproved),
      financeDecline: parseFlag(row.financeDecline),
      financeRejectedByCustomer: parseFlag(row.financeRejectedByCustomer),
      cashDeal: parseFlag(row.cashDeal),
      sold: parseFlag(row.sold),
      soldDate: parseDate(row.soldDate),
      soldAmount: parseNumber(row.soldAmount),
      saleCanceled: parseFlag(row.saleCanceled),
      saleCanceledDate: parseDate(row.saleCanceledDate),
      installed: parseFlag(row.installed),
      installedDate: parseDate(row.installedDate),
      installedNumberOfWindows: parseNumber(row.installedNumberOfWindows),
      installedRevenue: parseNumber(row.installedRevenue),
    });
  }
  
  return affiliateFunnelData;
}

/**
 * Validate CSV format
 */
export function validateCSVFormat(csvText: string, type: 'funnel' | 'metrics' | 'affiliateFunnel'): { valid: boolean; errors: string[] } {
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
    } else if (type === 'affiliateFunnel') {
      if (!headerLower.some(h => h.includes('id'))) {
        errors.push('Missing Id column');
      }
      if (!headerLower.some(h => h.includes('zip'))) {
        errors.push('Missing Zip column');
      }
    }
    
    return { valid: errors.length === 0, errors };
  } catch (error) {
    errors.push(`Failed to parse CSV: ${error}`);
    return { valid: false, errors };
  }
}


