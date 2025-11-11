import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { Territory } from '@/types/territory-map';

export const dynamic = 'force-dynamic';

const TERRITORIES_FILE = path.join(process.cwd(), 'public', 'data', 'territory-map', 'territories.json');

// GET - Load all territories
export async function GET() {
  try {
    const fileContents = await fs.readFile(TERRITORIES_FILE, 'utf8');
    const territories = JSON.parse(fileContents);
    return NextResponse.json(territories);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist yet, return empty array
      return NextResponse.json([]);
    }
    console.error('Error loading territories:', error);
    return NextResponse.json({ error: 'Failed to load territories' }, { status: 500 });
  }
}

// POST - Create new territory
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // If body is an array, replace entire file (for bulk save)
    if (Array.isArray(body)) {
      await fs.writeFile(TERRITORIES_FILE, JSON.stringify(body, null, 2), 'utf8');
      return NextResponse.json({ success: true, territories: body });
    }
    
    // Otherwise, create single territory
    const newTerritory: Territory = {
      id: `territory-${Date.now()}`,
      name: body.name || 'New Territory',
      color: body.color || '#FF6B6B',
      createdAt: new Date().toISOString()
    };
    
    // Read existing territories
    let territories: Territory[] = [];
    try {
      const fileContents = await fs.readFile(TERRITORIES_FILE, 'utf8');
      territories = JSON.parse(fileContents);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // File doesn't exist, start with empty array
    }
    
    // Add new territory
    territories.push(newTerritory);
    
    // Write back to file
    await fs.writeFile(TERRITORIES_FILE, JSON.stringify(territories, null, 2), 'utf8');
    
    return NextResponse.json({ success: true, territory: newTerritory });
  } catch (error) {
    console.error('Error creating territory:', error);
    return NextResponse.json({ error: 'Failed to create territory' }, { status: 500 });
  }
}


