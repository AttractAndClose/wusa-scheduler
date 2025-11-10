import mapboxgl from 'mapbox-gl';
import type { Territory, TerritoryAssignment, Representative } from '@/types/territory-map';

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
 * Add zip code GeoJSON source to map
 */
export function addZipCodeSource(map: mapboxgl.Map, geoJson: GeoJSON.FeatureCollection): void {
  if (map.getSource('zipcodes')) {
    (map.getSource('zipcodes') as mapboxgl.GeoJSONSource).setData(geoJson);
    return;
  }
  
  map.addSource('zipcodes', {
    type: 'geojson',
    data: geoJson
  });
}

/**
 * Add territory layers (fill and border)
 */
export function addTerritoryLayers(map: mapboxgl.Map): void {
  // Fill layer
  if (!map.getLayer('zipcode-fill')) {
    map.addLayer({
      id: 'zipcode-fill',
      type: 'fill',
      source: 'zipcodes',
      paint: {
        'fill-color': ['get', 'territoryColor'],
        'fill-opacity': 0.6
      }
    });
  }
  
  // Border layer
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
}

/**
 * Update zip code colors based on territory assignments
 */
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

export function updateZipCodeColors(
  map: mapboxgl.Map,
  geoJson: GeoJSON.FeatureCollection,
  territories: Territory[],
  assignments: TerritoryAssignment
): void {
  const features = geoJson.features.map(feature => {
    const zipCode = extractZipCode(feature.properties);
    const territoryId = assignments[zipCode] || null;
    const territory = territoryId ? territories.find(t => t.id === territoryId) : null;
    
    return {
      ...feature,
      properties: {
        ...feature.properties,
        zipCode,
        territoryId: territoryId || null,
        territoryColor: territory?.color || '#ffffff'
      }
    };
  });
  
  const updatedGeoJson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features
  };
  
  addZipCodeSource(map, updatedGeoJson);
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
  
  for (const rep of representatives) {
    if (!rep.active || !rep.location) continue;
    
    const territory = rep.territoryId 
      ? territories.find(t => t.id === rep.territoryId)
      : null;
    
    const el = document.createElement('div');
    el.className = 'rep-marker';
    el.style.width = '20px';
    el.style.height = '20px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = territory?.color || '#2563EB';
    el.style.border = '2px solid white';
    el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    el.style.cursor = 'pointer';
    
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
  }
  
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
    const zipCode = extractZipCode(feature.properties);
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
export function removeDataVisualizationLayer(
  map: mapboxgl.Map,
  geoJson: GeoJSON.FeatureCollection,
  territories: Territory[],
  assignments: TerritoryAssignment
): void {
  updateZipCodeColors(map, geoJson, territories, assignments);
}

