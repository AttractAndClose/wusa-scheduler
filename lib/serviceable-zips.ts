import type { ServiceableZip } from '@/types/serviceable-zips';

/**
 * Load serviceable zip codes from JSON file
 */
let cachedServiceableZips: ServiceableZip[] | null = null;

export async function loadServiceableZips(): Promise<ServiceableZip[]> {
  if (cachedServiceableZips) {
    return cachedServiceableZips;
  }
  
  try {
    const response = await fetch('/data/serviceable-zips.json');
    const data = await response.json();
    cachedServiceableZips = data;
    return data;
  } catch (error) {
    console.error('Error loading serviceable zip codes:', error);
    return [];
  }
}

/**
 * Save serviceable zip codes (for MVP, uses localStorage)
 * In production, this would POST to an API
 */
export function saveServiceableZips(zips: ServiceableZip[]): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('serviceableZips', JSON.stringify(zips));
  
  // Invalidate cache
  cachedServiceableZips = null;
}

export function loadServiceableZipsFromStorage(): ServiceableZip[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem('serviceableZips');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading serviceable zip codes from storage:', error);
  }
  
  return [];
}

/**
 * Get all serviceable zip codes (combines JSON file + localStorage)
 */
export async function getAllServiceableZips(): Promise<ServiceableZip[]> {
  const jsonZips = await loadServiceableZips();
  const storedZips = loadServiceableZipsFromStorage();
  
  // If we have stored zips with actual data, use those (they override JSON)
  // But if stored zips is empty array, use JSON instead
  if (storedZips.length > 0) {
    return storedZips;
  }
  
  // Return JSON zips (or empty array if JSON failed to load)
  return jsonZips;
}

/**
 * Check if a zip code is serviceable and not excluded
 */
export async function isZipServiceable(zip: string): Promise<{ serviceable: boolean; excluded: boolean; notes?: string }> {
  const zips = await getAllServiceableZips();
  const zipCode = zip.substring(0, 5); // Use first 5 digits
  
  const zipData = zips.find(z => z.zip === zipCode);
  
  if (!zipData) {
    return { serviceable: false, excluded: false };
  }
  
  if (zipData.excluded) {
    return { serviceable: false, excluded: true, notes: zipData.notes };
  }
  
  return { serviceable: true, excluded: false };
}

