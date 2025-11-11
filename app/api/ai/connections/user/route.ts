/**
 * API endpoint for managing user-specific connections
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { loadUserConnections } from '@/lib/ai/connections';

export const dynamic = 'force-dynamic';

/**
 * GET - List user's connections
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connections = await loadUserConnections(userId);
    // Don't expose tokens in list
    const safeConnections = connections.map(conn => ({
      ...conn,
      accessToken: '***',
      refreshToken: '***',
    }));

    return NextResponse.json({ success: true, connections: safeConnections });
  } catch (error: any) {
    console.error('[AI Connections User] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load user connections', details: error.message },
      { status: 500 }
    );
  }
}

