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
      const parsed = JSON.parse(stored);
      // If stored data is the old small sample (less than 1000 zips), clear it
      // This ensures we use the new comprehensive JSON file
      if (parsed.length > 0 && parsed.length < 1000) {
        console.log('Clearing old zip code cache, using new comprehensive list');
        localStorage.removeItem('serviceableZips');
        return [];
      }
      return parsed;
    }
  } catch (error) {
    console.error('Error loading serviceable zip codes from storage:', error);
  }
  
  return [];
}

/**
 * Clear localStorage cache (useful when zip code list is updated)
 */
export function clearServiceableZipsCache(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('serviceableZips');
  cachedServiceableZips = null;
}

/**
 * Get all serviceable zip codes (combines JSON file + localStorage)
 * JSON file is the source of truth, localStorage only stores user modifications
 */
export async function getAllServiceableZips(): Promise<ServiceableZip[]> {
  const jsonZips = await loadServiceableZips();
  const storedZips = loadServiceableZipsFromStorage();
  
  // If no JSON zips loaded, return empty array
  if (jsonZips.length === 0) {
    return storedZips.length > 0 ? storedZips : [];
  }
  
  // If we have stored zips (user modifications), merge them with JSON
  // Create a map of stored zips by zip code for quick lookup
  const storedZipMap = new Map<string, ServiceableZip>();
  storedZips.forEach(zip => {
    storedZipMap.set(zip.zip, zip);
  });
  
  // Merge: use JSON as base, but override with stored modifications (exclusions, notes)
  const mergedZips = jsonZips.map(jsonZip => {
    const storedZip = storedZipMap.get(jsonZip.zip);
    if (storedZip) {
      // Use stored zip's excluded and notes, but keep JSON's other data
      return {
        ...jsonZip,
        excluded: storedZip.excluded,
        notes: storedZip.notes
      };
    }
    return jsonZip;
  });
  
  return mergedZips;
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

