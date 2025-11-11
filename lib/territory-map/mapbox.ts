import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
import type { Territory, TerritoryAssignment, Representative } from '@/types/territory-map';
import { logger } from '@/lib/logger';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

/**
 * Initialize Mapbox map instance
 */
export function initializeMap(container: HTMLDivElement, center: [number, number] = [-98.5795, 39.8283], zoom: number = 4): mapboxgl.Map {
  if (!MAPBOX_TOKEN) {
    throw new Error('Mapbox token not configured');
  }
  
  mapboxgl.accessToken = MAPBOX_TOKEN;
  
  const map = new mapboxgl.Map({
    container,
    style: 'mapbox://styles/mapbox/light-v11',
    center,
    zoom,
    attributionControl: false
  });
  
  // Add navigation controls
  map.addControl(new mapboxgl.NavigationControl(), 'top-right');
  
  return map;
}

/**
 * Add zip code GeoJSON source to map using URL-based loading
 * This is more efficient than inline data as Mapbox handles caching and progressive loading
 */
export function addZipCodeSource(map: mapboxgl.Map, url?: string): void {
  const sourceUrl = url || '/data/territory-map/zipcode-boundaries.geojson';
  
  if (map.getSource('zipcodes')) {
    // Update existing source URL if different
    const existingSource = map.getSource('zipcodes') as mapboxgl.GeoJSONSource;
    if (existingSource._options?.data !== sourceUrl) {
      map.removeSource('zipcodes');
      map.addSource('zipcodes', {
        type: 'geojson',
        data: sourceUrl,
        // Add error handling
        generateId: true // Generate IDs for features if not present
      });
    }
    return;
  }
  
  map.addSource('zipcodes', {
    type: 'geojson',
    data: sourceUrl,
    // Add error handling
    generateId: true // Generate IDs for features if not present
  });
  
  // Add error handler for source loading
  map.on('error', (e) => {
    if (e.error && e.error.message && e.error.message.includes('zipcodes')) {
      console.error('Error loading zipcode source:', e.error);
    }
  });
}

/**
 * Create merged territory boundaries by combining zip code polygons by territory
 */
export function createMergedTerritoryBoundaries(
  geoJson: GeoJSON.FeatureCollection,
  assignments: TerritoryAssignment
): GeoJSON.FeatureCollection {
  // Group features by territory ID
  const territoryGroups = new Map<string, GeoJSON.Feature[]>();
  
  for (const feature of geoJson.features) {
    const zipCode = extractZipCode(feature.properties);
    if (zipCode) {
      const territoryId = assignments[zipCode] || '';
      if (territoryId) {
        if (!territoryGroups.has(territoryId)) {
          territoryGroups.set(territoryId, []);
        }
        territoryGroups.get(territoryId)!.push(feature);
      }
    }
  }
  
  // Merge polygons for each territory
  const mergedFeatures: GeoJSON.Feature[] = [];
  
  for (const [territoryId, features] of territoryGroups.entries()) {
    if (features.length === 0) continue;
    
    try {
      // Collect all polygons for this territory
      const polygons: GeoJSON.Feature<GeoJSON.Polygon>[] = [];
      
      for (const feature of features) {
        if (feature.geometry.type === 'Polygon') {
          try {
            // Clean the polygon first to avoid issues
            const cleaned = turf.cleanCoords(turf.polygon(feature.geometry.coordinates));
            polygons.push(cleaned);
          } catch (e) {
            logger.warn(`Failed to process polygon for territory ${territoryId}:`, e);
          }
        } else if (feature.geometry.type === 'MultiPolygon') {
          // Convert MultiPolygon to individual polygons
          for (const polygonCoords of feature.geometry.coordinates) {
            try {
              const cleaned = turf.cleanCoords(turf.polygon(polygonCoords));
              polygons.push(cleaned);
            } catch (e) {
              logger.warn(`Failed to process MultiPolygon part for territory ${territoryId}:`, e);
            }
          }
        }
      }
      
      if (polygons.length === 0) continue;
      
      logger.debug(`Merging ${polygons.length} polygons for territory ${territoryId}`);
      
      // If only one polygon, use it directly
      if (polygons.length === 1) {
        mergedFeatures.push({
          type: 'Feature',
          geometry: polygons[0].geometry,
          properties: {
            territoryId,
            ...features[0].properties
          }
        });
        continue;
      }
      
      // Merge all polygons using union
      // Start with the first polygon
      let merged: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> = polygons[0];
      let successCount = 0;
      
      // Union each subsequent polygon
      for (let i = 1; i < polygons.length; i++) {
        try {
          // Clean both polygons before union
          const cleaned1 = turf.cleanCoords(merged);
          const cleaned2 = turf.cleanCoords(polygons[i]);
          
          const unionResult = turf.union(cleaned1, cleaned2);
          if (unionResult && unionResult.geometry) {
            merged = unionResult as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
            successCount++;
          } else {
            logger.warn(`Union returned null for polygon ${i} in territory ${territoryId}`);
          }
        } catch (e) {
          // If union fails, log and continue with next polygon
          logger.warn(`Failed to merge polygon ${i} for territory ${territoryId}:`, e);
          // Continue with next polygon - we'll still use what we have
        }
      }
      
      logger.debug(`Successfully merged ${successCount + 1} of ${polygons.length} polygons for territory ${territoryId}`);
      
      // Clean the final merged result
      try {
        const cleaned = turf.cleanCoords(merged);
        mergedFeatures.push({
          type: 'Feature',
          geometry: cleaned.geometry,
          properties: {
            territoryId,
            ...features[0].properties
          }
        });
      } catch (e) {
        logger.warn(`Failed to clean merged polygon for territory ${territoryId}:`, e);
        // Still add it even if cleaning fails
        mergedFeatures.push({
          type: 'Feature',
          geometry: merged.geometry,
          properties: {
            territoryId,
            ...features[0].properties
          }
        });
      }
    } catch (error) {
      logger.warn(`Error merging territory ${territoryId}:`, error);
    }
  }
  
  return {
    type: 'FeatureCollection',
    features: mergedFeatures
  };
}

/**
 * Add territory layers (fill and border) with data-driven styling
 * Uses property-based coloring for efficient rendering
 */
export function addTerritoryLayers(map: mapboxgl.Map): void {
  // Fill layer - color comes from territoryColor property
  if (!map.getLayer('zipcode-fill')) {
    map.addLayer({
      id: 'zipcode-fill',
      type: 'fill',
      source: 'zipcodes',
      paint: {
        'fill-color': ['coalesce', ['get', 'territoryColor'], '#ffffff'],
        'fill-opacity': 0.6
      }
    });
  }
  
  // Regular border layer (thin borders between zip codes)
  if (!map.getLayer('zipcode-border')) {
    map.addLayer({
      id: 'zipcode-border',
      type: 'line',
      source: 'zipcodes',
      paint: {
        'line-color': '#888',
        'line-width': 1,
        'line-opacity': 0.5
      }
    });
  }

  // Territory border layer will be added separately with merged boundaries
}

// Helper function to extract zip code from feature properties
function extractZipCode(properties: any): string {
  return properties?.zipCode || 
         properties?.ZCTA5CE20 || 
         properties?.ZCTA5CE10 || 
         properties?.ZIP_CODE ||
         properties?.ZIPCODE ||
         properties?.ZIP ||
         properties?.GEOID20?.substring(0, 5) ||
         '';
}

/**
 * Update zip code colors based on territory assignments
 * For URL-based sources, we fetch and update colors efficiently
 * This function is called to trigger a refresh of the source with updated colors
 */
export async function updateZipCodeColors(
  map: mapboxgl.Map,
  territories: Territory[],
  assignments: TerritoryAssignment
): Promise<void> {
  const source = map.getSource('zipcodes') as mapboxgl.GeoJSONSource;
  if (!source) {
    logger.warn('Zipcode source not found');
    return;
  }

  // Create a map of zipCode -> territoryColor and territoryId for quick lookup
  const colorMap = new Map<string, string>();
  const territoryIdMap = new Map<string, string>();
  for (const [zipCode, territoryId] of Object.entries(assignments)) {
    if (territoryId) {
      const territory = territories.find(t => t.id === territoryId);
      if (territory) {
        colorMap.set(zipCode, territory.color);
        territoryIdMap.set(zipCode, territoryId);
      }
    }
  }

  // For URL-based sources, we'll fetch the GeoJSON, update colors, and use setData
  // This is more efficient than keeping full GeoJSON in memory
  try {
    const response = await fetch('/data/territory-map/zipcode-boundaries.geojson');
    if (!response.ok) {
      logger.warn('Failed to fetch GeoJSON for color update');
      return;
    }

    const geoJson: GeoJSON.FeatureCollection = await response.json();
    
    // Update only the territoryColor and territoryId properties for each feature
    // This minimizes object creation - we only modify the properties object
    for (const feature of geoJson.features) {
      const zipCode = extractZipCode(feature.properties);
      if (zipCode) {
        const color = colorMap.get(zipCode) || '#ffffff';
        const territoryId = territoryIdMap.get(zipCode) || '';
        // Directly update the property instead of creating new objects
        if (!feature.properties) feature.properties = {};
        feature.properties.territoryColor = color;
        feature.properties.territoryId = territoryId;
      }
    }

    // Update the source with modified data
    source.setData(geoJson);
  } catch (error) {
    logger.error('Error updating zip code colors:', error);
  }
}

/**
 * Add representative markers to map
 */
export function addRepresentativeMarkers(
  map: mapboxgl.Map,
  representatives: Representative[],
  territories: Territory[]
): mapboxgl.Marker[] {
  // Remove existing markers first
  const existingMarkers = document.querySelectorAll('.rep-marker');
  existingMarkers.forEach(marker => marker.remove());
  
  const markers: mapboxgl.Marker[] = [];
  
  logger.debug(`Adding markers for ${representatives.length} representatives`);
  
  for (const rep of representatives) {
    // Check if rep is active (default to true if not specified)
    const isActive = rep.active !== false;
    if (!isActive || !rep.location || !rep.location.lat || !rep.location.lng) {
      logger.debug(`Skipping rep ${rep.id}: active=${isActive}, location=${!!rep.location}`);
      continue;
    }
    
    const territory = rep.territoryId 
      ? territories.find(t => t.id === rep.territoryId)
      : null;
    
    const el = document.createElement('div');
    el.className = 'rep-marker';
    el.style.width = '14px';
    el.style.height = '14px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = territory?.color || '#2563EB';
    el.style.border = '2px solid white';
    el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';
    el.style.cursor = 'pointer';
    el.style.zIndex = '1000';
    
    const popup = new mapboxgl.Popup({ offset: 25 })
      .setHTML(`
        <div class="text-sm">
          <div class="font-semibold">${rep.name}</div>
          <div class="text-gray-600">${rep.email}</div>
          <div class="text-gray-600">${rep.phone}</div>
          ${territory ? `<div class="text-gray-600">Territory: ${territory.name}</div>` : ''}
        </div>
      `);
    
    const marker = new mapboxgl.Marker(el)
      .setLngLat([rep.location.lng, rep.location.lat])
      .setPopup(popup)
      .addTo(map);
    
    markers.push(marker);
    logger.debug(`Added marker for ${rep.name} at [${rep.location.lng}, ${rep.location.lat}]`);
  }
  
  logger.info(`Added ${markers.length} representative markers to map`);
  return markers;
}

/**
 * Add isochrone layer to map
 */
export function addIsochroneLayer(
  map: mapboxgl.Map,
  isochrones: GeoJSON.Feature[]
): void {
  // Remove existing isochrone source and layers
  if (map.getLayer('isochrone-fill')) {
    map.removeLayer('isochrone-fill');
  }
  if (map.getLayer('isochrone-border')) {
    map.removeLayer('isochrone-border');
  }
  if (map.getSource('isochrones')) {
    map.removeSource('isochrones');
  }
  
  if (isochrones.length === 0) return;
  
  const isochroneCollection: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: isochrones
  };
  
  map.addSource('isochrones', {
    type: 'geojson',
    data: isochroneCollection
  });
  
  // Fill layer
  map.addLayer({
    id: 'isochrone-fill',
    type: 'fill',
    source: 'isochrones',
    paint: {
      'fill-color': '#4ECDC4',
      'fill-opacity': 0.2
    }
  });
  
  // Border layer
  map.addLayer({
    id: 'isochrone-border',
    type: 'line',
    source: 'isochrones',
    paint: {
      'line-color': '#4ECDC4',
      'line-width': 2,
      'line-opacity': 0.6
    }
  });
}

// Helper function to extract zip code from feature properties (for data visualization)
function extractZipCodeForViz(properties: any): string {
  return properties?.zipCode || 
         properties?.ZCTA5CE20 || 
         properties?.ZCTA5CE10 || 
         properties?.ZIP_CODE ||
         properties?.ZIPCODE ||
         properties?.ZIP ||
         properties?.GEOID20?.substring(0, 5) ||
         '';
}

/**
 * Add data visualization layer (color scale)
 */
export function addDataVisualizationLayer(
  map: mapboxgl.Map,
  geoJson: GeoJSON.FeatureCollection,
  data: Array<{ zipCode: string; value: number }>,
  minValue: number,
  maxValue: number,
  colorScale: 'sequential' | 'diverging' = 'sequential'
): void {
  // Create color scale
  const getColor = (value: number): string => {
    const normalized = (value - minValue) / (maxValue - minValue || 1);
    
    if (colorScale === 'diverging') {
      // Blue to red diverging
      if (normalized < 0.5) {
        const t = normalized * 2;
        const r = Math.round(255 * t);
        const g = Math.round(255 * t);
        const b = 255;
        return `rgb(${r},${g},${b})`;
      } else {
        const t = (normalized - 0.5) * 2;
        const r = 255;
        const g = Math.round(255 * (1 - t));
        const b = Math.round(255 * (1 - t));
        return `rgb(${r},${g},${b})`;
      }
    } else {
      // Sequential: light to dark blue
      const r = Math.round(255 * (1 - normalized));
      const g = Math.round(255 * (1 - normalized));
      const b = 255;
      return `rgb(${r},${g},${b})`;
    }
  };
  
  // Create data map
  const dataMap = new Map<string, number>();
  for (const item of data) {
    dataMap.set(item.zipCode, item.value);
  }
  
  // Update features with colors
  const features = geoJson.features.map(feature => {
    const zipCode = extractZipCodeForViz(feature.properties);
    const value = dataMap.get(zipCode) || 0;
    const color = getColor(value);
    
    return {
      ...feature,
      properties: {
        ...feature.properties,
        zipCode,
        dataValue: value,
        dataColor: color
      }
    };
  });
  
  const updatedGeoJson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features
  };
  
  // Update or add source
  if (map.getSource('zipcodes')) {
    (map.getSource('zipcodes') as mapboxgl.GeoJSONSource).setData(updatedGeoJson);
  } else {
    map.addSource('zipcodes', {
      type: 'geojson',
      data: updatedGeoJson
    });
  }
  
  // Update fill layer to use data color
  if (map.getLayer('zipcode-fill')) {
    map.setPaintProperty('zipcode-fill', 'fill-color', ['get', 'dataColor']);
  }
}

/**
 * Remove data visualization layer (revert to territory colors)
 */
export async function removeDataVisualizationLayer(
  map: mapboxgl.Map,
  territories: Territory[],
  assignments: TerritoryAssignment
): Promise<void> {
  await updateZipCodeColors(map, territories, assignments);
  
  // Update fill layer to use territory color
  if (map.getLayer('zipcode-fill')) {
    map.setPaintProperty('zipcode-fill', 'fill-color', [
      'coalesce',
      ['get', 'territoryColor'],
      '#ffffff'
    ]);
  }
}

/**
 * Add or update territory border layer
 * Uses a performant approach: highlights borders between different territories
 * without expensive polygon merging operations
 */
export function updateTerritoryBorders(
  map: mapboxgl.Map,
  geoJson: GeoJSON.FeatureCollection | null,
  assignments: TerritoryAssignment,
  showTerritoryBorders: boolean
): void {
  // Remove existing territory border layer if it exists (from old implementation)
  if (map.getLayer('territory-border')) {
    map.removeLayer('territory-border');
  }
  if (map.getSource('territory-borders')) {
    map.removeSource('territory-borders');
  }
  
  // Check if zipcode-border layer exists (it should, from addTerritoryLayers)
  const zipcodeBorderLayer = map.getLayer('zipcode-border');
  if (!zipcodeBorderLayer) {
    logger.warn('zipcode-border layer not found, cannot update territory borders');
    return;
  }
  
  // Update the existing zipcode-border layer styling
  try {
    if (showTerritoryBorders) {
      // Show thicker, darker borders for zip codes with territory assignments
      map.setPaintProperty('zipcode-border', 'line-color', [
        'case',
        ['has', 'territoryId'],
        ['case',
          ['!=', ['get', 'territoryId'], ''],
          '#000000',  // Black for territory borders
          '#888'      // Gray for unassigned
        ],
        '#888'        // Gray for unassigned
      ]);
      
      map.setPaintProperty('zipcode-border', 'line-width', [
        'case',
        ['has', 'territoryId'],
        ['case',
          ['!=', ['get', 'territoryId'], ''],
          2.5,  // Thicker for territory borders
          1     // Thin for unassigned
        ],
        1      // Thin for unassigned
      ]);
      
      map.setPaintProperty('zipcode-border', 'line-opacity', [
        'case',
        ['has', 'territoryId'],
        ['case',
          ['!=', ['get', 'territoryId'], ''],
          0.9,  // More opaque for territory borders
          0.5   // Less opaque for unassigned
        ],
        0.5    // Less opaque for unassigned
      ]);
      
      logger.info('Territory borders enabled using performant styling');
    } else {
      // Restore original border styling when disabled
      map.setPaintProperty('zipcode-border', 'line-color', '#888');
      map.setPaintProperty('zipcode-border', 'line-width', 1);
      map.setPaintProperty('zipcode-border', 'line-opacity', 0.5);
      logger.info('Territory borders disabled, restored default styling');
    }
  } catch (error) {
    logger.error('Error updating territory borders:', error);
    // Fallback: just restore default styling
    try {
      map.setPaintProperty('zipcode-border', 'line-width', 1);
      map.setPaintProperty('zipcode-border', 'line-color', '#888');
      map.setPaintProperty('zipcode-border', 'line-opacity', 0.5);
    } catch (fallbackError) {
      logger.error('Fallback border update also failed:', fallbackError);
    }
  }
}

