import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const BOUNDARIES_FILE = path.join(process.cwd(), 'public', 'data', 'territory-map', 'zipcode-boundaries.geojson');
const METADATA_FILE = path.join(process.cwd(), 'public', 'data', 'territory-map', 'zipcode-metadata.json');

// GET - Return zip code boundaries and metadata
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeMetadata = searchParams.get('metadata') === 'true';
    
    // Load boundaries
    let boundaries: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };
    try {
      const boundariesContent = await fs.readFile(BOUNDARIES_FILE, 'utf8');
      boundaries = JSON.parse(boundariesContent);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    
    // Load metadata if requested
    let metadata = {};
    if (includeMetadata) {
      try {
        const metadataContent = await fs.readFile(METADATA_FILE, 'utf8');
        metadata = JSON.parse(metadataContent);
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    }
    
    return NextResponse.json({
      boundaries,
      metadata: includeMetadata ? metadata : undefined
    });
  } catch (error) {
    console.error('Error loading zip codes:', error);
    return NextResponse.json({ error: 'Failed to load zip codes' }, { status: 500 });
  }
}


