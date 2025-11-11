/**
 * API endpoint for managing global AI settings (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { isAdmin } from '@/lib/auth';
import { loadGlobalSettings, saveGlobalSettings } from '@/lib/ai/settings';
import type { GlobalAISettings } from '@/types/ai-settings';

export const dynamic = 'force-dynamic';

/**
 * GET - Retrieve global AI settings
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

    const settings = await loadGlobalSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error('[AI Settings Global] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load global settings', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST - Update global AI settings
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const updates: Partial<GlobalAISettings> = body;

    // Load existing settings
    const currentSettings = await loadGlobalSettings();

    // Merge updates
    const updatedSettings: GlobalAISettings = {
      ...currentSettings,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Validate required fields
    if (!updatedSettings.voice || !updatedSettings.systemInstructions) {
      return NextResponse.json(
        { error: 'Missing required fields: voice, systemInstructions' },
        { status: 400 }
      );
    }

    await saveGlobalSettings(updatedSettings);

    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (error: any) {
    console.error('[AI Settings Global] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update global settings', details: error.message },
      { status: 500 }
    );
  }
}

