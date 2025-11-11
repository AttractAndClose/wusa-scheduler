import { NextRequest, NextResponse } from 'next/server';
import { addNoteToPartner } from '@/lib/affiliate-partners';

export const dynamic = 'force-dynamic';

// POST - Add note to partner
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const note = await addNoteToPartner(params.id, body);
    return NextResponse.json({ success: true, note });
  } catch (error: any) {
    console.error('Error adding note:', error);
    return NextResponse.json({ error: error.message || 'Failed to add note' }, { status: 500 });
  }
}

