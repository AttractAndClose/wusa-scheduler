import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { Representative } from '@/types/territory-map';

export const dynamic = 'force-dynamic';

const REPRESENTATIVES_FILE = path.join(process.cwd(), 'public', 'data', 'territory-map', 'representatives.json');

// GET - Load all representatives
export async function GET() {
  try {
    const fileContents = await fs.readFile(REPRESENTATIVES_FILE, 'utf8');
    const representatives = JSON.parse(fileContents);
    return NextResponse.json(representatives);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist yet, return empty array
      return NextResponse.json([]);
    }
    console.error('Error loading representatives:', error);
    return NextResponse.json({ error: 'Failed to load representatives' }, { status: 500 });
  }
}

// POST - Create/update representatives
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // If body is an array, replace entire file (for bulk save)
    if (Array.isArray(body)) {
      await fs.writeFile(REPRESENTATIVES_FILE, JSON.stringify(body, null, 2), 'utf8');
      return NextResponse.json({ success: true, representatives: body });
    }
    
    // Otherwise, create single representative
    const newRepresentative: Representative = {
      id: body.id || `rep-${Date.now()}`,
      name: body.name || 'New Representative',
      email: body.email || '',
      phone: body.phone || '',
      location: body.location || { lat: 0, lng: 0 },
      territoryId: body.territoryId || null,
      active: body.active !== undefined ? body.active : true
    };
    
    // Read existing representatives
    let representatives: Representative[] = [];
    try {
      const fileContents = await fs.readFile(REPRESENTATIVES_FILE, 'utf8');
      representatives = JSON.parse(fileContents);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // File doesn't exist, start with empty array
    }
    
    // Check if updating existing
    const index = representatives.findIndex(r => r.id === newRepresentative.id);
    if (index >= 0) {
      representatives[index] = newRepresentative;
    } else {
      representatives.push(newRepresentative);
    }
    
    // Write back to file
    await fs.writeFile(REPRESENTATIVES_FILE, JSON.stringify(representatives, null, 2), 'utf8');
    
    return NextResponse.json({ success: true, representative: newRepresentative });
  } catch (error) {
    console.error('Error saving representative:', error);
    return NextResponse.json({ error: 'Failed to save representative' }, { status: 500 });
  }
}

