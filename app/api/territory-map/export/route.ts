import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { Territory, TerritoryAssignment } from '@/types/territory-map';

export const dynamic = 'force-dynamic';

const TERRITORIES_FILE = path.join(process.cwd(), 'public', 'data', 'territory-map', 'territories.json');
const ASSIGNMENTS_FILE = path.join(process.cwd(), 'public', 'data', 'territory-map', 'assignments.json');

// GET - Export territory assignments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    
    // Load territories and assignments
    let territories: Territory[] = [];
    let assignments: TerritoryAssignment = {};
    
    try {
      const territoriesContent = await fs.readFile(TERRITORIES_FILE, 'utf8');
      territories = JSON.parse(territoriesContent);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    
    try {
      const assignmentsContent = await fs.readFile(ASSIGNMENTS_FILE, 'utf8');
      assignments = JSON.parse(assignmentsContent);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    
    // Combine data
    const exportData = Object.entries(assignments).map(([zipCode, territoryId]) => ({
      zipCode,
      territoryId: territoryId || null,
      territoryName: territoryId 
        ? territories.find(t => t.id === territoryId)?.name || 'Unknown'
        : 'Unassigned'
    }));
    
    if (format === 'csv') {
      // Generate CSV
      const headers = ['zipCode', 'territoryId', 'territoryName'];
      const rows = exportData.map(row => [
        row.zipCode,
        row.territoryId || '',
        row.territoryName
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="territory-assignments-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }
    
    // Return JSON
    return NextResponse.json(exportData, {
      headers: {
        'Content-Disposition': `attachment; filename="territory-assignments-${new Date().toISOString().split('T')[0]}.json"`
      }
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}

