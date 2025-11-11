/**
 * Formatting helpers for AI analysis data
 * Provides utilities for number formatting, list truncation, and data normalization
 */

/**
 * Safely convert a value to a number
 */
export function safeNumber(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined || isNaN(value)) return defaultValue;
  return Number(value);
}

/**
 * Format a number with a custom formatter, with fallback
 */
export function safeFormat(
  value: any,
  formatter: (n: number) => string,
  defaultValue: string = '0'
): string {
  const num = safeNumber(value);
  try {
    return formatter(num);
  } catch (e) {
    return defaultValue;
  }
}

/**
 * Format currency
 */
export function formatCurrency(value: any, defaultValue: string = '$0'): string {
  const num = safeNumber(value);
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: any, decimals: number = 1, defaultValue: string = '0%'): string {
  const num = safeNumber(value);
  return `${num.toFixed(decimals)}%`;
}

/**
 * Format number with locale string
 */
export function formatNumber(value: any, defaultValue: string = '0'): string {
  const num = safeNumber(value);
  return num.toLocaleString();
}

/**
 * Truncate an array to top N items based on a sort function
 */
export function truncateToTopN<T>(
  items: T[],
  n: number,
  sortFn: (a: T, b: T) => number
): T[] {
  if (!Array.isArray(items) || items.length === 0) return [];
  if (items.length <= n) return items;
  
  return [...items].sort(sortFn).slice(0, n);
}

/**
 * Truncate comparison data to top N by a metric
 */
export function truncateComparisonData(
  data: any[],
  maxItems: number,
  metricKey: string = 'totalLeads'
): any[] {
  if (!Array.isArray(data) || data.length === 0) return [];
  if (data.length <= maxItems) return data;
  
  return truncateToTopN(
    data,
    maxItems,
    (a, b) => {
      const aValue = safeNumber(a?.metrics?.[metricKey] || 0);
      const bValue = safeNumber(b?.metrics?.[metricKey] || 0);
      return bValue - aValue; // Descending order
    }
  );
}

/**
 * Truncate territory metrics to top N
 */
export function truncateTerritoryMetrics(
  data: any[],
  maxItems: number
): any[] {
  return truncateComparisonData(data, maxItems, 'totalLeads');
}

/**
 * Round to specified decimal places
 */
export function round(value: any, decimals: number = 2): number {
  const num = safeNumber(value);
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Calculate percentage safely
 */
export function calculatePercentage(part: any, total: any, defaultValue: number = 0): number {
  const partNum = safeNumber(part);
  const totalNum = safeNumber(total);
  if (totalNum === 0) return defaultValue;
  return (partNum / totalNum) * 100;
}

/**
 * Verify that a percentage calculation is correct
 * Returns true if the calculation matches within tolerance
 */
export function verifyPercentage(
  part: any,
  total: any,
  reportedPercentage: any,
  tolerance: number = 0.1
): boolean {
  const calculated = calculatePercentage(part, total);
  const reported = safeNumber(reportedPercentage);
  return Math.abs(calculated - reported) <= tolerance;
}

