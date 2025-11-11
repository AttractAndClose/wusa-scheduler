import type { 
  Territory, 
  TerritoryAssignment, 
  Representative, 
  ZipCodeMetadata, 
  FunnelData,
  AffiliateFunnelData
} from '@/types/territory-map';
import type { SalesRep } from '@/types';

/**
 * Load data from JSON files in public/data/territory-map/
 */

let cachedTerritories: Territory[] | null = null;
let cachedAssignments: TerritoryAssignment | null = null;
let cachedRepresentatives: Representative[] | null = null;
let cachedZipCodeMetadata: ZipCodeMetadata | null = null;
let cachedFunnelData: FunnelData[] | null = null;
let cachedAffiliateFunnelData: AffiliateFunnelData[] | null = null;

export async function loadTerritories(): Promise<Territory[]> {
  if (cachedTerritories) {
    return cachedTerritories;
  }
  
  try {
    const response = await fetch('/data/territory-map/territories.json', {
      cache: 'no-store'
    });
    if (!response.ok) {
      console.warn('Territories file not found, returning empty array');
      return [];
    }
    const data = await response.json();
    cachedTerritories = data;
    return data;
  } catch (error) {
    console.error('Error loading territories:', error);
    return [];
  }
}

export async function loadAssignments(): Promise<TerritoryAssignment> {
  if (cachedAssignments) {
    return cachedAssignments;
  }
  
  try {
    const response = await fetch('/data/territory-map/assignments.json', {
      cache: 'no-store'
    });
    if (!response.ok) {
      console.warn('Assignments file not found, returning empty object');
      return {};
    }
    const data = await response.json();
    cachedAssignments = data;
    return data;
  } catch (error) {
    console.error('Error loading assignments:', error);
    return {};
  }
}

export async function loadRepresentatives(): Promise<Representative[]> {
  if (cachedRepresentatives) {
    return cachedRepresentatives;
  }
  
  try {
    // First try to load from territory-map specific file
    let response = await fetch('/data/territory-map/representatives.json', {
      cache: 'no-store'
    });
    
    // If not found or empty, load from existing reps.json and convert
    if (!response.ok) {
      response = await fetch('/data/reps.json', {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        console.warn('Representatives file not found, returning empty array');
        return [];
      }
      
      // Convert SalesRep format to Representative format
      const salesReps: SalesRep[] = await response.json();
      const representatives: Representative[] = salesReps.map(rep => ({
        id: rep.id,
        name: rep.name,
        email: rep.email,
        phone: rep.phone,
        location: {
          lat: rep.startingAddress.lat,
          lng: rep.startingAddress.lng
        },
        territoryId: null,
        active: true
      }));
      
      cachedRepresentatives = representatives;
      return representatives;
    }
    
    // Use territory-map specific file if it exists and has data
    const data = await response.json();
    
    // If the array is empty, fall back to reps.json
    if (Array.isArray(data) && data.length === 0) {
      response = await fetch('/data/reps.json', {
        cache: 'no-store'
      });
      
      if (response.ok) {
        // Convert SalesRep format to Representative format
        const salesReps: SalesRep[] = await response.json();
        const representatives: Representative[] = salesReps.map(rep => ({
          id: rep.id,
          name: rep.name,
          email: rep.email,
          phone: rep.phone,
          location: {
            lat: rep.startingAddress.lat,
            lng: rep.startingAddress.lng
          },
          territoryId: null,
          active: true
        }));
        
        cachedRepresentatives = representatives;
        return representatives;
      }
    }
    
    cachedRepresentatives = data;
    return data;
  } catch (error) {
    console.error('Error loading representatives:', error);
    return [];
  }
}

export async function loadZipCodeBoundaries(): Promise<GeoJSON.FeatureCollection> {
  try {
    const response = await fetch('/data/territory-map/zipcode-boundaries.geojson', {
      cache: 'no-store'
    });
    if (!response.ok) {
      console.warn('Zip code boundaries file not found');
      return { type: 'FeatureCollection', features: [] };
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error loading zip code boundaries:', error);
    return { type: 'FeatureCollection', features: [] };
  }
}

export async function loadZipCodeMetadata(): Promise<ZipCodeMetadata> {
  if (cachedZipCodeMetadata) {
    return cachedZipCodeMetadata;
  }
  
  try {
    const response = await fetch('/data/territory-map/zipcode-metadata.json', {
      cache: 'no-store'
    });
    if (!response.ok) {
      console.warn('Zip code metadata file not found, returning empty object');
      return {};
    }
    const data = await response.json();
    cachedZipCodeMetadata = data;
    return data;
  } catch (error) {
    console.error('Error loading zip code metadata:', error);
    return {};
  }
}

export async function loadFunnelData(): Promise<FunnelData[]> {
  if (cachedFunnelData) {
    return cachedFunnelData;
  }
  
  try {
    const response = await fetch('/data/territory-map/funnel-data.json', {
      cache: 'no-store'
    });
    if (!response.ok) {
      console.warn('Funnel data file not found, returning empty array');
      return [];
    }
    const data = await response.json();
    cachedFunnelData = data;
    return data;
  } catch (error) {
    console.error('Error loading funnel data:', error);
    return [];
  }
}

let cachedAffiliatePurchaseZips: string[] | null = null;

export async function loadAffiliatePurchaseZips(): Promise<string[]> {
  if (cachedAffiliatePurchaseZips) {
    return cachedAffiliatePurchaseZips;
  }
  
  try {
    const response = await fetch('/data/territory-map/affiliate-purchase-zips.json', {
      cache: 'no-store'
    });
    if (!response.ok) {
      console.warn('Affiliate purchase zips file not found, returning empty array');
      return [];
    }
    const data = await response.json();
    cachedAffiliatePurchaseZips = data;
    return data;
  } catch (error) {
    console.error('Error loading affiliate purchase zips:', error);
    return [];
  }
}

export async function loadAffiliateFunnelData(): Promise<AffiliateFunnelData[]> {
  if (cachedAffiliateFunnelData) {
    return cachedAffiliateFunnelData;
  }
  
  try {
    const response = await fetch('/data/territory-map/affiliate-funnel-data.json', {
      cache: 'no-store'
    });
    if (!response.ok) {
      console.warn('Affiliate funnel data file not found, returning empty array');
      return [];
    }
    const data = await response.json();
    cachedAffiliateFunnelData = data;
    return data;
  } catch (error) {
    console.error('Error loading affiliate funnel data:', error);
    return [];
  }
}

// Clear cache functions
export function clearTerritoriesCache(): void {
  cachedTerritories = null;
}

export function clearAssignmentsCache(): void {
  cachedAssignments = null;
}

export function clearRepresentativesCache(): void {
  cachedRepresentatives = null;
}

export function clearZipCodeMetadataCache(): void {
  cachedZipCodeMetadata = null;
}

export function clearFunnelDataCache(): void {
  cachedFunnelData = null;
}

export function clearAffiliateFunnelDataCache(): void {
  cachedAffiliateFunnelData = null;
}

export function clearAllCache(): void {
  cachedTerritories = null;
  cachedAssignments = null;
  cachedRepresentatives = null;
  cachedZipCodeMetadata = null;
  cachedFunnelData = null;
  cachedAffiliateFunnelData = null;
}

