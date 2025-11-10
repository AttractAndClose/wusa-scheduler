import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { TerritoryAssignment } from '@/types/territory-map';

export const dynamic = 'force-dynamic';

const ASSIGNMENTS_FILE = path.join(process.cwd(), 'public', 'data', 'territory-map', 'assignments.json');

// GET - Load all assignments
export async function GET() {
  try {
    const fileContents = await fs.readFile(ASSIGNMENTS_FILE, 'utf8');
    const assignments = JSON.parse(fileContents);
    return NextResponse.json(assignments);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist yet, return empty object
      return NextResponse.json({});
    }
    console.error('Error loading assignments:', error);
    return NextResponse.json({ error: 'Failed to load assignments' }, { status: 500 });
  }
}

// POST - Update entire assignments object
export async function POST(request: NextRequest) {
  try {
    const assignments: TerritoryAssignment = await request.json();
    
    await fs.writeFile(ASSIGNMENTS_FILE, JSON.stringify(assignments, null, 2), 'utf8');
    
    return NextResponse.json({ success: true, assignments });
  } catch (error) {
    console.error('Error saving assignments:', error);
    return NextResponse.json({ error: 'Failed to save assignments' }, { status: 500 });
  }
}

