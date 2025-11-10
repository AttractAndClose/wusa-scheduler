import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Lead } from '@/types';

const LEADS_FILE = path.join(process.cwd(), 'public', 'data', 'leads.json');

// GET - Get a specific lead by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fileContents = await fs.readFile(LEADS_FILE, 'utf8');
    const leads: Lead[] = JSON.parse(fileContents);
    
    const lead = leads.find(l => l.id === params.id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }
    
    return NextResponse.json(lead);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return NextResponse.json({ error: 'Leads file not found' }, { status: 404 });
    }
    console.error('Error reading lead:', error);
    return NextResponse.json({ error: 'Failed to read lead' }, { status: 500 });
  }
}

// PUT - Update a lead
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json();
    
    const fileContents = await fs.readFile(LEADS_FILE, 'utf8');
    const leads: Lead[] = JSON.parse(fileContents);
    
    const index = leads.findIndex(l => l.id === params.id);
    if (index === -1) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }
    
    // Update lead - merge with existing data
    const updatedLead: Lead = {
      ...leads[index],
      ...updates,
      // Preserve ID and createdAt
      id: leads[index].id,
      createdAt: leads[index].createdAt,
    };
    
    leads[index] = updatedLead;
    
    await fs.writeFile(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf8');
    
    return NextResponse.json({ success: true, lead: updatedLead });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return NextResponse.json({ error: 'Leads file not found' }, { status: 404 });
    }
    console.error('Error updating lead:', error);
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}

