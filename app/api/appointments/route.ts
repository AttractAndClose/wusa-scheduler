import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { Appointment } from '@/types';

export const dynamic = 'force-dynamic';

// GET - Load appointments
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'appointments.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const appointments = JSON.parse(fileContents);
    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Error loading appointments:', error);
    return NextResponse.json({ error: 'Failed to load appointments' }, { status: 500 });
  }
}

// POST - Save new appointment
export async function POST(request: NextRequest) {
  try {
    const appointment: Appointment = await request.json();
    
    const filePath = path.join(process.cwd(), 'public', 'data', 'appointments.json');
    
    // Read existing appointments
    let appointments: Appointment[] = [];
    try {
      const fileContents = await fs.readFile(filePath, 'utf8');
      appointments = JSON.parse(fileContents);
    } catch (error) {
      // File doesn't exist yet, start with empty array
      console.log('Appointments file not found, creating new one');
    }
    
    // Add new appointment
    appointments.push(appointment);
    
    // Write back to file
    await fs.writeFile(filePath, JSON.stringify(appointments, null, 2), 'utf8');
    
    return NextResponse.json({ success: true, appointment });
  } catch (error) {
    console.error('Error saving appointment:', error);
    return NextResponse.json({ error: 'Failed to save appointment' }, { status: 500 });
  }
}

