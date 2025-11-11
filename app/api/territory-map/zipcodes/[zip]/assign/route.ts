import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { TerritoryAssignment } from '@/types/territory-map';

export const dynamic = 'force-dynamic';

const ASSIGNMENTS_FILE = path.join(process.cwd(), 'public', 'data', 'territory-map', 'assignments.json');

// POST - Assign/unassign zip code to territory
export async function POST(
  request: NextRequest,
  { params }: { params: { zip: string } }
) {
  try {
    const { territoryId } = await request.json();
    const zipCode = params.zip;
    
    // Read existing assignments
    let assignments: TerritoryAssignment = {};
    try {
      const fileContents = await fs.readFile(ASSIGNMENTS_FILE, 'utf8');
      assignments = JSON.parse(fileContents);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // File doesn't exist, start with empty object
    }
    
    // Update assignment (null means unassigned)
    if (territoryId === null || territoryId === undefined || territoryId === '') {
      delete assignments[zipCode];
    } else {
      assignments[zipCode] = territoryId;
    }
    
    // Write back to file
    await fs.writeFile(ASSIGNMENTS_FILE, JSON.stringify(assignments, null, 2), 'utf8');
    
    return NextResponse.json({ success: true, assignment: { zipCode, territoryId } });
  } catch (error) {
    console.error('Error assigning zip code:', error);
    return NextResponse.json({ error: 'Failed to assign zip code' }, { status: 500 });
  }
}


