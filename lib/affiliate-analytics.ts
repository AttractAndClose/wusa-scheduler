import type { AffiliateFunnelData } from '@/types/territory-map';
import { 
  parse, 
  format, 
  startOfDay, 
  startOfWeek, 
  startOfMonth,
  isWithinInterval,
  subDays,
  subWeeks,
  subMonths,
  startOfToday,
  endOfToday,
  startOfYear,
  endOfYear
} from 'date-fns';

export type TimeGranularity = 'daily' | 'weekly' | 'monthly';
export type DatePreset = 'today' | 'last7' | 'last30' | 'last90' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface AggregatedMetrics {
  // Funnel metrics
  totalLeads: number;
  appointmentsSet: number;
  pitches: number;
  sales: number;
  installed: number;
  
  // Financial metrics
  totalSoldAmount: number;
  totalInstalledRevenue: number;
  averageSaleAmount: number;
  revenuePerLead: number;
  
  // Quality metrics
  averageCreditScore: number;
  averageEfScore: number;
  leadToAppointmentRate: number;
  appointmentToPitchRate: number;
  pitchToSaleRate: number;
  cancellationRate: number;
  prospectScoreDistribution: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
    unknown: number;
  };
  
  // Credit & Finance metrics
  creditRan: number;
  creditRanRate: number; // % of pitches that had credit run
  lenderApproved: number;
  lenderApprovalRate: number; // % of credit runs that were approved
  financeDecline: number;
  financeDeclineRate: number; // % of credit runs that were declined
  financeRejectedByCustomer: number;
  financeRejectedRate: number; // % of approved that customer rejected
  cashDeal: number;
  cashDealRate: number; // % of sales that were cash
  
  // Additional funnel metrics
  apptCanceled: number;
  noPitch: number;
  noPitchRate: number; // % of appointments where rep showed but couldn't pitch
  saleCanceled: number;
  saleCanceledRate: number; // % of sales that were canceled
}

export interface TimeSeriesDataPoint {
  date: string;
  metrics: AggregatedMetrics;
}

export interface ComparisonData {
  leadSource: string;
  metrics: AggregatedMetrics;
  recordCount: number;
}

export interface TerritoryMetrics {
  territory: string;
  metrics: AggregatedMetrics;
  recordCount: number;
}

/**
 * Parse date string from CSV format (e.g., "7/1/24", "7/24/24")
 */
export function parseAffiliateDate(dateStr: string | null): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;
  
  // Try various date formats
  const formats = ['M/d/yy', 'M/dd/yy', 'MM/d/yy', 'MM/dd/yy', 'M/d/yyyy', 'M/dd/yyyy', 'MM/d/yyyy', 'MM/dd/yyyy'];
  
  for (const fmt of formats) {
    try {
      const parsed = parse(dateStr.trim(), fmt, new Date());
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    } catch {
      continue;
    }
  }
  
  // Fallback to Date constructor
  try {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  } catch {
    // Ignore
  }
  
  return null;
}

/**
 * Get date range for preset
 */
export function getDateRangeForPreset(preset: DatePreset, customRange?: DateRange): DateRange {
  const today = startOfToday();
  
  switch (preset) {
    case 'today':
      return { start: startOfDay(today), end: endOfToday() };
    case 'last7':
      return { start: startOfDay(subDays(today, 7)), end: endOfToday() };
    case 'last30':
      return { start: startOfDay(subDays(today, 30)), end: endOfToday() };
    case 'last90':
      return { start: startOfDay(subDays(today, 90)), end: endOfToday() };
    case 'thisMonth':
      return { start: startOfMonth(today), end: endOfToday() };
    case 'lastMonth':
      const lastMonth = subMonths(today, 1);
      return { start: startOfMonth(lastMonth), end: startOfMonth(today) };
    case 'thisYear':
      return { start: startOfYear(today), end: endOfToday() };
    case 'custom':
      return customRange || { start: subDays(today, 30), end: today };
    default:
      return { start: subDays(today, 30), end: today };
  }
}

/**
 * Filter data by territories
 */
export function filterByTerritories(
  data: AffiliateFunnelData[],
  territories: string[]
): AffiliateFunnelData[] {
  if (territories.length === 0) return data;
  return data.filter(item => territories.includes(item.territory));
}

/**
 * Filter data by lead source details
 */
export function filterByLeadSources(
  data: AffiliateFunnelData[],
  leadSources: string[]
): AffiliateFunnelData[] {
  if (leadSources.length === 0) return data;
  return data.filter(item => leadSources.includes(item.leadSourceDetails));
}

/**
 * Filter data by date range
 */
export function filterByDateRange(
  data: AffiliateFunnelData[],
  dateRange: DateRange
): AffiliateFunnelData[] {
  return data.filter(item => {
    const createDate = parseAffiliateDate(item.leadCreateDate);
    if (!createDate) return false;
    return isWithinInterval(createDate, dateRange);
  });
}

/**
 * Calculate metrics for a dataset
 */
export function calculateMetrics(data: AffiliateFunnelData[]): AggregatedMetrics {
  if (data.length === 0) {
    return {
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
      prospectScoreDistribution: {
        bronze: 0,
        silver: 0,
        gold: 0,
        platinum: 0,
        unknown: 0,
      },
      creditRan: 0,
      creditRanRate: 0,
      lenderApproved: 0,
      lenderApprovalRate: 0,
      financeDecline: 0,
      financeDeclineRate: 0,
      financeRejectedByCustomer: 0,
      financeRejectedRate: 0,
      cashDeal: 0,
      cashDealRate: 0,
      apptCanceled: 0,
      noPitch: 0,
      noPitchRate: 0,
      saleCanceled: 0,
      saleCanceledRate: 0,
    };
  }

  const totalLeads = data.length;
  const appointmentsSet = data.filter(d => d.set === 1).length;
  const pitches = data.filter(d => d.pitch === 1).length;
  const sales = data.filter(d => d.sold === 1).length;
  const installed = data.filter(d => d.installed === 1).length;

  const totalSoldAmount = data
    .filter(d => d.soldAmount !== null)
    .reduce((sum, d) => sum + (d.soldAmount || 0), 0);
  
  const totalInstalledRevenue = data
    .filter(d => d.installedRevenue !== null)
    .reduce((sum, d) => sum + (d.installedRevenue || 0), 0);

  const salesWithAmount = data.filter(d => d.sold === 1 && d.soldAmount !== null);
  const averageSaleAmount = salesWithAmount.length > 0
    ? totalSoldAmount / salesWithAmount.length
    : 0;

  const revenuePerLead = totalLeads > 0 ? totalSoldAmount / totalLeads : 0;

  const creditScores = data
    .filter(d => d.creditScore !== null)
    .map(d => d.creditScore!);
  const averageCreditScore = creditScores.length > 0
    ? creditScores.reduce((sum, score) => sum + score, 0) / creditScores.length
    : 0;

  const efScores = data
    .filter(d => d.efScore !== null && d.efScore !== 0 && d.efScore !== 1)
    .map(d => d.efScore!);
  const averageEfScore = efScores.length > 0
    ? efScores.reduce((sum, score) => sum + score, 0) / efScores.length
    : 0;

  const leadToAppointmentRate = totalLeads > 0 ? (appointmentsSet / totalLeads) * 100 : 0;
  const appointmentToPitchRate = appointmentsSet > 0 ? (pitches / appointmentsSet) * 100 : 0;
  const pitchToSaleRate = pitches > 0 ? (sales / pitches) * 100 : 0;

  const canceledAppointments = data.filter(d => d.apptCanceled === 1).length;
  const cancellationRate = appointmentsSet > 0 ? (canceledAppointments / appointmentsSet) * 100 : 0;

  const prospectScoreDistribution = {
    bronze: data.filter(d => d.thinkUnlimitedProspectScore === 'Bronze').length,
    silver: data.filter(d => d.thinkUnlimitedProspectScore === 'Silver').length,
    gold: data.filter(d => d.thinkUnlimitedProspectScore === 'Gold').length,
    platinum: data.filter(d => d.thinkUnlimitedProspectScore === 'Platinum').length,
    unknown: data.filter(d => !d.thinkUnlimitedProspectScore || 
      !['Bronze', 'Silver', 'Gold', 'Platinum'].includes(d.thinkUnlimitedProspectScore)).length,
  };

  // Credit & Finance metrics
  const creditRan = data.filter(d => d.creditRan === 1).length;
  const creditRanRate = pitches > 0 ? (creditRan / pitches) * 100 : 0;
  
  const lenderApproved = data.filter(d => d.lenderApproved === 1).length;
  const lenderApprovalRate = creditRan > 0 ? (lenderApproved / creditRan) * 100 : 0;
  
  const financeDecline = data.filter(d => d.financeDecline === 1).length;
  const financeDeclineRate = creditRan > 0 ? (financeDecline / creditRan) * 100 : 0;
  
  const financeRejectedByCustomer = data.filter(d => d.financeRejectedByCustomer === 1).length;
  const financeRejectedRate = lenderApproved > 0 ? (financeRejectedByCustomer / lenderApproved) * 100 : 0;
  
  const cashDeal = data.filter(d => d.cashDeal === 1).length;
  const cashDealRate = sales > 0 ? (cashDeal / sales) * 100 : 0;

  // Additional funnel metrics
  const apptCanceled = data.filter(d => d.apptCanceled === 1).length;
  const noPitch = data.filter(d => d.noPitch === 1).length;
  const noPitchRate = appointmentsSet > 0 ? (noPitch / appointmentsSet) * 100 : 0;
  
  const saleCanceled = data.filter(d => d.saleCanceled === 1).length;
  const saleCanceledRate = sales > 0 ? (saleCanceled / sales) * 100 : 0;

  return {
    totalLeads,
    appointmentsSet,
    pitches,
    sales,
    installed,
    totalSoldAmount,
    totalInstalledRevenue,
    averageSaleAmount,
    revenuePerLead,
    averageCreditScore,
    averageEfScore,
    leadToAppointmentRate,
    appointmentToPitchRate,
    pitchToSaleRate,
    cancellationRate,
    prospectScoreDistribution,
    creditRan,
    creditRanRate,
    lenderApproved,
    lenderApprovalRate,
    financeDecline,
    financeDeclineRate,
    financeRejectedByCustomer,
    financeRejectedRate,
    cashDeal,
    cashDealRate,
    apptCanceled,
    noPitch,
    noPitchRate,
    saleCanceled,
    saleCanceledRate,
  };
}

/**
 * Aggregate data by time period
 */
export function aggregateByTimePeriod(
  data: AffiliateFunnelData[],
  granularity: TimeGranularity
): TimeSeriesDataPoint[] {
  const grouped = new Map<string, AffiliateFunnelData[]>();

  for (const item of data) {
    const createDate = parseAffiliateDate(item.leadCreateDate);
    if (!createDate) continue;

    let key: string;
    let periodStart: Date;

    switch (granularity) {
      case 'daily':
        periodStart = startOfDay(createDate);
        key = format(periodStart, 'yyyy-MM-dd');
        break;
      case 'weekly':
        periodStart = startOfWeek(createDate, { weekStartsOn: 0 });
        key = format(periodStart, 'yyyy-MM-dd');
        break;
      case 'monthly':
        periodStart = startOfMonth(createDate);
        key = format(periodStart, 'yyyy-MM');
        break;
    }

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(item);
  }

  const result: TimeSeriesDataPoint[] = [];
  for (const [dateKey, items] of grouped.entries()) {
    result.push({
      date: dateKey,
      metrics: calculateMetrics(items),
    });
  }

  return result.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Compare lead sources
 */
export function compareLeadSources(
  data: AffiliateFunnelData[],
  leadSources?: string[]
): ComparisonData[] {
  const sourcesToCompare = leadSources && leadSources.length > 0
    ? leadSources
    : [...new Set(data.map(d => d.leadSourceDetails))];

  const result: ComparisonData[] = [];

  for (const source of sourcesToCompare) {
    const sourceData = data.filter(d => d.leadSourceDetails === source);
    result.push({
      leadSource: source,
      metrics: calculateMetrics(sourceData),
      recordCount: sourceData.length,
    });
  }

  return result.sort((a, b) => b.metrics.totalLeads - a.metrics.totalLeads);
}

/**
 * Get metrics by territory
 */
export function getMetricsByTerritory(
  data: AffiliateFunnelData[],
  territories?: string[]
): TerritoryMetrics[] {
  const territoriesToAnalyze = territories && territories.length > 0
    ? territories
    : [...new Set(data.map(d => d.territory))];

  const result: TerritoryMetrics[] = [];

  for (const territory of territoriesToAnalyze) {
    const territoryData = data.filter(d => d.territory === territory);
    result.push({
      territory,
      metrics: calculateMetrics(territoryData),
      recordCount: territoryData.length,
    });
  }

  return result.sort((a, b) => b.metrics.totalLeads - a.metrics.totalLeads);
}

/**
 * Get unique territories from data
 */
export function getUniqueTerritories(data: AffiliateFunnelData[]): string[] {
  return [...new Set(data.map(d => d.territory))].sort();
}

/**
 * Get unique lead source details from data
 */
export function getUniqueLeadSources(data: AffiliateFunnelData[]): string[] {
  return [...new Set(data.map(d => d.leadSourceDetails))].sort();
}

