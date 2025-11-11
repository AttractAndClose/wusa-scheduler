import { NextRequest, NextResponse } from 'next/server';
import {
  loadAffiliatePartners,
  saveAffiliatePartners,
  createAffiliatePartner,
  updateAffiliatePartner,
} from '@/lib/affiliate-partners';
import type { AffiliatePartner } from '@/types/affiliate-partner';

export const dynamic = 'force-dynamic';

// GET - Load all partners
export async function GET() {
  try {
    const partners = await loadAffiliatePartners();
    return NextResponse.json(partners);
  } catch (error) {
    console.error('Error loading partners:', error);
    return NextResponse.json({ error: 'Failed to load partners' }, { status: 500 });
  }
}

// POST - Create new partner
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const partner = await createAffiliatePartner(body);
    return NextResponse.json({ success: true, partner });
  } catch (error: any) {
    console.error('Error creating partner:', error);
    return NextResponse.json({ error: error.message || 'Failed to create partner' }, { status: 500 });
  }
}

// PUT - Update partner
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    const partner = await updateAffiliatePartner(id, updates);
    return NextResponse.json({ success: true, partner });
  } catch (error: any) {
    console.error('Error updating partner:', error);
    return NextResponse.json({ error: error.message || 'Failed to update partner' }, { status: 500 });
  }
}

