import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { IsochroneRequest, IsochroneResponse, DriveTimeCache } from '@/types/territory-map';

export const dynamic = 'force-dynamic';

const CACHE_FILE = path.join(process.cwd(), 'public', 'data', 'territory-map', 'drive-time-cache.json');
const BOUNDARIES_FILE = path.join(process.cwd(), 'public', 'data', 'territory-map', 'zipcode-boundaries.geojson');
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// POST - Calculate drive time coverage
export async function POST(request: NextRequest) {
  try {
    const body: IsochroneRequest = await request.json();
    const { minutes, repLocations } = body;
    
    if (!MAPBOX_TOKEN) {
      return NextResponse.json({ error: 'Mapbox token not configured' }, { status: 500 });
    }
    
    // Check cache first
    const cacheKey = `${minutes}-${repLocations.map(l => `${l.lat},${l.lng}`).join('|')}`;
    let cache: DriveTimeCache = {};
    try {
      const cacheContent = await fs.readFile(CACHE_FILE, 'utf8');
      cache = JSON.parse(cacheContent);
      if (cache[cacheKey]) {
        const cached = cache[cacheKey];
        // Check if cache is less than 24 hours old
        const cacheAge = Date.now() - new Date(cached.calculatedAt).getTime();
        if (cacheAge < 24 * 60 * 60 * 1000) {
          return NextResponse.json({
            coveredZipCodes: cached.coveredZipCodes,
            fromCache: true
          });
        }
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.warn('Error reading cache:', error);
      }
    }
    
    // Calculate isochrones for each rep location
    const isochrones: any[] = [];
    for (const location of repLocations) {
      const url = `https://api.mapbox.com/isochrone/v1/mapbox/driving/${location.lng},${location.lat}?contours_minutes=${minutes}&polygons=true&access_token=${MAPBOX_TOKEN}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Mapbox API error: ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        isochrones.push(...data.features);
      }
    }
    
    // Load zip code boundaries
    let boundaries: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };
    try {
      const boundariesContent = await fs.readFile(BOUNDARIES_FILE, 'utf8');
      boundaries = JSON.parse(boundariesContent);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    
    // Find zip codes that intersect with isochrones
    const coveredZipCodes = new Set<string>();
    
    for (const zipFeature of boundaries.features) {
      const props = zipFeature.properties || {};
      const zipCode = props.zipCode || 
                     props.ZCTA5CE20 || 
                     props.ZCTA5CE10 || 
                     props.ZIP_CODE ||
                     props.ZIPCODE ||
                     props.ZIP ||
                     props.GEOID20?.substring(0, 5);
      if (!zipCode) continue;
      
      // Simple point-in-polygon check using zip code centroid
      const zipGeometry = zipFeature.geometry;
      if (zipGeometry.type === 'Polygon') {
        const coordinates = zipGeometry.coordinates[0];
        // Calculate centroid
        let latSum = 0, lngSum = 0;
        for (const [lng, lat] of coordinates) {
          latSum += lat;
          lngSum += lng;
        }
        const centroid = [latSum / coordinates.length, lngSum / coordinates.length];
        
        // Check if centroid is within any isochrone
        for (const isochrone of isochrones) {
          if (isochrone.geometry.type === 'Polygon') {
            if (pointInPolygon(centroid, isochrone.geometry.coordinates[0])) {
              coveredZipCodes.add(zipCode.toString());
              break;
            }
          }
        }
      }
    }
    
    const coveredZipCodesArray = Array.from(coveredZipCodes);
    
    // Cache the result
    cache[cacheKey] = {
      minutes,
      repLocations,
      coveredZipCodes: coveredZipCodesArray,
      calculatedAt: new Date().toISOString()
    };
    
    try {
      await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
    } catch (error) {
      console.warn('Error writing cache:', error);
    }
    
    return NextResponse.json({
      coveredZipCodes: coveredZipCodesArray,
      isochrones,
      fromCache: false
    } as IsochroneResponse);
  } catch (error) {
    console.error('Error calculating drive time:', error);
    return NextResponse.json({ error: 'Failed to calculate drive time' }, { status: 500 });
  }
}

// Simple point-in-polygon check
function pointInPolygon(point: number[], polygon: number[][]): boolean {
  const [lat, lng] = point;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    
    const intersect = ((yi > lng) !== (yj > lng)) &&
      (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
}

