/**
 * API endpoint for managing global connections (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { isAdmin } from '@/lib/auth';
import { loadGlobalConnections } from '@/lib/ai/connections';

export const dynamic = 'force-dynamic';

/**
 * GET - List all global connections
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const connections = await loadGlobalConnections();
    // Don't expose tokens in list
    const safeConnections = connections.map(conn => ({
      ...conn,
      accessToken: '***',
      refreshToken: '***',
    }));

    return NextResponse.json({ success: true, connections: safeConnections });
  } catch (error: any) {
    console.error('[AI Connections Global] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load global connections', details: error.message },
      { status: 500 }
    );
  }
}

