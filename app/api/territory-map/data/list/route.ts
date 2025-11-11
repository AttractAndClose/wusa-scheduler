import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const FUNNEL_DATA_FILE = path.join(process.cwd(), 'public', 'data', 'territory-map', 'funnel-data.json');
const METADATA_FILE = path.join(process.cwd(), 'public', 'data', 'territory-map', 'zipcode-metadata.json');

// GET - List all uploaded data sets
export async function GET() {
  try {
    const dataSets = [];

    // Check funnel data
    try {
      const stats = await fs.stat(FUNNEL_DATA_FILE);
      const content = await fs.readFile(FUNNEL_DATA_FILE, 'utf8');
      const data = JSON.parse(content);
      
      dataSets.push({
        id: 'funnel-data',
        name: 'Funnel Data',
        type: 'funnel',
        description: 'Leads, appointments, sales, and revenue data by zip code',
        recordCount: Array.isArray(data) ? data.length : 0,
        uploadedAt: stats.mtime.toISOString(),
        fileSize: stats.size
      });
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error('Error reading funnel data:', error);
      }
    }

    // Check metadata
    try {
      const stats = await fs.stat(METADATA_FILE);
      const content = await fs.readFile(METADATA_FILE, 'utf8');
      const data = JSON.parse(content);
      
      dataSets.push({
        id: 'zipcode-metadata',
        name: 'Zip Code Metrics',
        type: 'metrics',
        description: 'Population, household income, and demographic data by zip code',
        recordCount: typeof data === 'object' && !Array.isArray(data) ? Object.keys(data).length : 0,
        uploadedAt: stats.mtime.toISOString(),
        fileSize: stats.size
      });
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error('Error reading metadata:', error);
      }
    }

    return NextResponse.json(dataSets);
  } catch (error) {
    console.error('Error listing data sets:', error);
    return NextResponse.json({ error: 'Failed to list data sets' }, { status: 500 });
  }
}


