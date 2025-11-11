/**
 * API endpoint for managing individual connections
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { isAdmin } from '@/lib/auth';
import { getConnection, deleteConnection } from '@/lib/ai/connections';

export const dynamic = 'force-dynamic';

/**
 * DELETE - Disconnect a connection
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connectionId = params.id;
    const connection = await getConnection(connectionId, userId);

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Check permissions
    if (connection.type === 'global') {
      const admin = await isAdmin();
      if (!admin) {
        return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
      }
    } else if (connection.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const deleted = await deleteConnection(connectionId, userId);
    if (!deleted) {
      return NextResponse.json({ error: 'Failed to delete connection' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[AI Connections Delete] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete connection', details: error.message },
      { status: 500 }
    );
  }
}

