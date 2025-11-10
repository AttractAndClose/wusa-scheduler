import type { IsochroneRequest, IsochroneResponse } from '@/types/territory-map';

/**
 * Calculate drive time coverage using Mapbox Isochrone API
 */
export async function calculateIsochrone(request: IsochroneRequest): Promise<IsochroneResponse> {
  const response = await fetch('/api/territory-map/drive-time', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  
  if (!response.ok) {
    throw new Error('Failed to calculate isochrone');
  }
  
  return response.json();
}

/**
 * Load cached drive time results
 */
export async function loadCachedDriveTime(
  minutes: number,
  repLocations: Array<{ lat: number; lng: number }>
): Promise<string[] | null> {
  try {
    const response = await fetch('/data/territory-map/drive-time-cache.json', {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return null;
    }
    
    const cache = await response.json();
    const cacheKey = `${minutes}-${repLocations.map(l => `${l.lat},${l.lng}`).join('|')}`;
    
    const cached = cache[cacheKey];
    if (!cached) {
      return null;
    }
    
    // Check if cache is less than 24 hours old
    const cacheAge = Date.now() - new Date(cached.calculatedAt).getTime();
    if (cacheAge < 24 * 60 * 60 * 1000) {
      return cached.coveredZipCodes;
    }
    
    return null;
  } catch (error) {
    console.error('Error loading cached drive time:', error);
    return null;
  }
}

