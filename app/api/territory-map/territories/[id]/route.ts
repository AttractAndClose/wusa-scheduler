import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { Territory } from '@/types/territory-map';

export const dynamic = 'force-dynamic';

const TERRITORIES_FILE = path.join(process.cwd(), 'public', 'data', 'territory-map', 'territories.json');

// GET - Get single territory by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fileContents = await fs.readFile(TERRITORIES_FILE, 'utf8');
    const territories: Territory[] = JSON.parse(fileContents);
    const territory = territories.find(t => t.id === params.id);
    
    if (!territory) {
      return NextResponse.json({ error: 'Territory not found' }, { status: 404 });
    }
    
    return NextResponse.json(territory);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return NextResponse.json({ error: 'Territory not found' }, { status: 404 });
    }
    console.error('Error loading territory:', error);
    return NextResponse.json({ error: 'Failed to load territory' }, { status: 500 });
  }
}

// PUT - Update territory
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json();
    
    const fileContents = await fs.readFile(TERRITORIES_FILE, 'utf8');
    const territories: Territory[] = JSON.parse(fileContents);
    
    const index = territories.findIndex(t => t.id === params.id);
    if (index === -1) {
      return NextResponse.json({ error: 'Territory not found' }, { status: 404 });
    }
    
    // Update territory
    territories[index] = { ...territories[index], ...updates };
    
    await fs.writeFile(TERRITORIES_FILE, JSON.stringify(territories, null, 2), 'utf8');
    
    return NextResponse.json({ success: true, territory: territories[index] });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return NextResponse.json({ error: 'Territory not found' }, { status: 404 });
    }
    console.error('Error updating territory:', error);
    return NextResponse.json({ error: 'Failed to update territory' }, { status: 500 });
  }
}

// DELETE - Delete territory
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fileContents = await fs.readFile(TERRITORIES_FILE, 'utf8');
    const territories: Territory[] = JSON.parse(fileContents);
    
    const index = territories.findIndex(t => t.id === params.id);
    if (index === -1) {
      return NextResponse.json({ error: 'Territory not found' }, { status: 404 });
    }
    
    // Remove territory
    territories.splice(index, 1);
    
    await fs.writeFile(TERRITORIES_FILE, JSON.stringify(territories, null, 2), 'utf8');
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return NextResponse.json({ error: 'Territory not found' }, { status: 404 });
    }
    console.error('Error deleting territory:', error);
    return NextResponse.json({ error: 'Failed to delete territory' }, { status: 500 });
  }
}

