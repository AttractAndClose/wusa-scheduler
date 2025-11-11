/**
 * Utility functions for getting zip code coordinates
 */

/**
 * Calculate centroid of a polygon
 */
function calculatePolygonCentroid(coordinates: number[][][]): { lat: number; lng: number } | null {
  if (!coordinates || coordinates.length === 0) return null;
  
  // For Polygon, coordinates[0] is the outer ring
  const ring = coordinates[0];
  if (!ring || ring.length === 0) return null;
  
  let latSum = 0;
  let lngSum = 0;
  let count = 0;
  
  for (const [lng, lat] of ring) {
    latSum += lat;
    lngSum += lng;
    count++;
  }
  
  if (count === 0) return null;
  
  return {
    lat: latSum / count,
    lng: lngSum / count
  };
}

/**
 * Get zip code coordinates from GeoJSON boundaries
 * This loads the boundaries file and calculates centroids for zip codes
 */
let zipCoordinatesCache: Map<string, { lat: number; lng: number }> | null = null;

export async function getZipCodeCoordinates(zipCode: string): Promise<{ lat: number; lng: number } | null> {
  // Normalize zip code (first 5 digits)
  const normalizedZip = zipCode.substring(0, 5);
  
  // Check cache first
  if (zipCoordinatesCache && zipCoordinatesCache.has(normalizedZip)) {
    return zipCoordinatesCache.get(normalizedZip) || null;
  }
  
  // Load boundaries if cache is empty
  if (!zipCoordinatesCache) {
    zipCoordinatesCache = new Map();
    
    try {
      const response = await fetch('/data/territory-map/zipcode-boundaries.geojson');
      if (response.ok) {
        const geoJson = await response.json();
        
        if (geoJson.features) {
          for (const feature of geoJson.features) {
            const props = feature.properties || {};
            const zip = props.zipCode || 
                       props.ZCTA5CE20 || 
                       props.ZCTA5CE10 || 
                       props.ZIP_CODE ||
                       props.ZIPCODE ||
                       props.ZIP ||
                       props.GEOID20?.substring(0, 5);
            
            if (!zip) continue;
            
            const normalized = zip.toString().substring(0, 5);
            
            // Calculate centroid from geometry
            if (feature.geometry) {
              let centroid: { lat: number; lng: number } | null = null;
              
              if (feature.geometry.type === 'Polygon') {
                centroid = calculatePolygonCentroid(feature.geometry.coordinates);
              } else if (feature.geometry.type === 'MultiPolygon') {
                // For MultiPolygon, use the first polygon
                if (feature.geometry.coordinates.length > 0 && feature.geometry.coordinates[0].length > 0) {
                  centroid = calculatePolygonCentroid(feature.geometry.coordinates[0]);
                }
              }
              
              if (centroid) {
                zipCoordinatesCache.set(normalized, centroid);
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('Error loading zip code boundaries for coordinates:', error);
    }
  }
  
  // Return from cache
  return zipCoordinatesCache.get(normalizedZip) || null;
}

/**
 * Get coordinates for multiple zip codes at once
 * More efficient than calling getZipCodeCoordinates multiple times
 */
export async function getZipCodeCoordinatesBatch(zipCodes: string[]): Promise<Map<string, { lat: number; lng: number }>> {
  const result = new Map<string, { lat: number; lng: number }>();
  
  // Ensure cache is loaded by trying to load boundaries file
  if (!zipCoordinatesCache) {
    zipCoordinatesCache = new Map();
    
    try {
      const response = await fetch('/data/territory-map/zipcode-boundaries.geojson');
      if (response.ok) {
        const geoJson = await response.json();
        
        if (geoJson.features) {
          for (const feature of geoJson.features) {
            const props = feature.properties || {};
            const zip = props.zipCode || 
                       props.ZCTA5CE20 || 
                       props.ZCTA5CE10 || 
                       props.ZIP_CODE ||
                       props.ZIPCODE ||
                       props.ZIP ||
                       props.GEOID20?.substring(0, 5);
            
            if (!zip) continue;
            
            const normalized = zip.toString().substring(0, 5);
            
            // Calculate centroid from geometry
            if (feature.geometry) {
              let centroid: { lat: number; lng: number } | null = null;
              
              if (feature.geometry.type === 'Polygon') {
                centroid = calculatePolygonCentroid(feature.geometry.coordinates);
              } else if (feature.geometry.type === 'MultiPolygon') {
                // For MultiPolygon, use the first polygon
                if (feature.geometry.coordinates.length > 0 && feature.geometry.coordinates[0].length > 0) {
                  centroid = calculatePolygonCentroid(feature.geometry.coordinates[0]);
                }
              }
              
              if (centroid) {
                zipCoordinatesCache.set(normalized, centroid);
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('Error loading zip code boundaries for coordinates:', error);
    }
  }
  
  // Get coordinates for all requested zip codes
  for (const zipCode of zipCodes) {
    const normalizedZip = zipCode.substring(0, 5);
    const coords = zipCoordinatesCache.get(normalizedZip);
    if (coords) {
      result.set(normalizedZip, coords);
    }
  }
  
  return result;
}

/**
 * Fallback geocoding function for zip codes when boundaries aren't available
 * Uses state-based approximation similar to MapPageView
 */
export function approximateZipCodeCoordinates(zip: string, state?: string): { lat: number; lng: number } | null {
  const zipNum = parseInt(zip.trim());
  if (isNaN(zipNum) || zipNum < 1000 || zipNum > 99999) {
    return null;
  }

  // State centers for approximation
  const stateCenters: Record<string, { lat: number; lng: number }> = {
    'AL': { lat: 32.806671, lng: -86.791130 },
    'AR': { lat: 34.969704, lng: -92.373123 },
    'AZ': { lat: 33.729759, lng: -111.431221 },
    'CA': { lat: 36.116203, lng: -119.681564 },
    'CO': { lat: 39.059811, lng: -105.311104 },
    'CT': { lat: 41.597782, lng: -72.755371 },
    'DC': { lat: 38.907192, lng: -77.036873 },
    'DE': { lat: 39.318523, lng: -75.507141 },
    'FL': { lat: 27.766279, lng: -81.686783 },
    'GA': { lat: 33.040619, lng: -83.643074 },
    'IA': { lat: 42.011539, lng: -93.210526 },
    'ID': { lat: 44.240459, lng: -114.478828 },
    'IL': { lat: 40.349457, lng: -88.986137 },
    'IN': { lat: 39.849426, lng: -86.258278 },
    'KS': { lat: 38.526600, lng: -96.726486 },
    'KY': { lat: 37.668140, lng: -84.670067 },
    'LA': { lat: 31.169546, lng: -91.867805 },
    'MA': { lat: 42.230171, lng: -71.530106 },
    'MD': { lat: 39.063946, lng: -76.802101 },
    'ME': { lat: 44.323535, lng: -69.765261 },
    'MI': { lat: 43.326618, lng: -84.536095 },
    'MN': { lat: 45.694454, lng: -93.900192 },
    'MO': { lat: 38.456085, lng: -92.288368 },
    'MS': { lat: 32.741646, lng: -89.678696 },
    'MT': { lat: 46.921925, lng: -110.454353 },
    'NC': { lat: 35.630066, lng: -79.806419 },
    'ND': { lat: 47.528912, lng: -99.784012 },
    'NE': { lat: 41.125370, lng: -98.268082 },
    'NH': { lat: 43.452492, lng: -71.563896 },
    'NJ': { lat: 40.298904, lng: -74.521011 },
    'NM': { lat: 34.840515, lng: -106.248482 },
    'NV': { lat: 38.313515, lng: -117.055374 },
    'NY': { lat: 42.165726, lng: -74.948051 },
    'OH': { lat: 40.388783, lng: -82.764915 },
    'OK': { lat: 35.565342, lng: -96.928917 },
    'OR': { lat: 44.572021, lng: -122.070938 },
    'PA': { lat: 40.590752, lng: -77.209755 },
    'RI': { lat: 41.680893, lng: -71.51178 },
    'SC': { lat: 33.856892, lng: -80.945007 },
    'SD': { lat: 44.299782, lng: -99.438828 },
    'TN': { lat: 35.747845, lng: -86.692345 },
    'TX': { lat: 31.054487, lng: -97.563461 },
    'UT': { lat: 40.150032, lng: -111.862434 },
    'VA': { lat: 37.769337, lng: -78.169968 },
    'VT': { lat: 44.045876, lng: -72.710686 },
    'WA': { lat: 47.400902, lng: -121.490494 },
    'WI': { lat: 44.268543, lng: -89.616508 },
    'WV': { lat: 38.491226, lng: -80.954453 },
    'WY': { lat: 42.755966, lng: -107.302490 },
  };

  // Determine state from zip code ranges if not provided
  let determinedState = state || 'TX'; // default
  if (!state) {
    if (zipNum >= 35000 && zipNum < 37000) determinedState = 'AL';
    else if (zipNum >= 70000 && zipNum < 72000) determinedState = 'LA';
    else if (zipNum >= 37000 && zipNum < 39000) determinedState = 'TN';
    else if (zipNum >= 38000 && zipNum < 39000) determinedState = 'MS';
    else if (zipNum >= 30000 && zipNum < 32000) determinedState = 'GA';
    else if (zipNum >= 27000 && zipNum < 29000) determinedState = 'NC';
    else if (zipNum >= 29000 && zipNum < 30000) determinedState = 'SC';
    else if (zipNum >= 73000 && zipNum < 75000) determinedState = 'OK';
    else if (zipNum >= 63000 && zipNum < 66000) determinedState = 'MO';
    else if (zipNum >= 60000 && zipNum < 63000) determinedState = 'IL';
    else if (zipNum >= 19000 && zipNum < 20000) determinedState = 'PA';
    else if (zipNum >= 7000 && zipNum < 9000) determinedState = 'NJ';
  }

  const center = stateCenters[determinedState] || stateCenters['TX'];
  
  // Add some variation based on zip code
  const zipMod = zipNum % 100;
  return {
    lat: center.lat + (zipMod % 10 - 5) * 0.1,
    lng: center.lng + (Math.floor(zipMod / 10) - 5) * 0.1,
  };
}

