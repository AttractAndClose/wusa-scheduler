import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { FunnelData, ZipCodeMetadata } from '@/types/territory-map';

export const dynamic = 'force-dynamic';

const FUNNEL_DATA_FILE = path.join(process.cwd(), 'public', 'data', 'territory-map', 'funnel-data.json');
const METADATA_FILE = path.join(process.cwd(), 'public', 'data', 'territory-map', 'zipcode-metadata.json');

// POST - Upload CSV data (expects JSON body with type and data)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;
    
    if (type === 'funnel') {
      // Save funnel data
      const funnelData: FunnelData[] = Array.isArray(data) ? data : [];
      await fs.writeFile(FUNNEL_DATA_FILE, JSON.stringify(funnelData, null, 2), 'utf8');
      return NextResponse.json({ 
        success: true, 
        count: funnelData.length,
        type: 'funnel'
      });
    } else if (type === 'metrics') {
      // Save zip code metadata
      const metadata: ZipCodeMetadata = typeof data === 'object' && !Array.isArray(data) ? data : {};
      await fs.writeFile(METADATA_FILE, JSON.stringify(metadata, null, 2), 'utf8');
      return NextResponse.json({ 
        success: true, 
        count: Object.keys(metadata).length,
        type: 'metrics'
      });
    } else {
      return NextResponse.json({ error: 'Invalid type. Must be "funnel" or "metrics"' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error uploading data:', error);
    return NextResponse.json({ error: 'Failed to upload data' }, { status: 500 });
  }
}

