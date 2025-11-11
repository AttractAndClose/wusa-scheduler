/**
 * API endpoint for managing user-specific AI settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { loadUserSettings, saveUserSettings } from '@/lib/ai/settings';
import type { UserAISettings } from '@/types/ai-settings';

export const dynamic = 'force-dynamic';

/**
 * GET - Retrieve user AI settings
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await loadUserSettings(userId);
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error('[AI Settings User] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load user settings', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST - Update user AI settings
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const updates: Partial<Omit<UserAISettings, 'userId'>> = body;

    // Load existing settings
    const currentSettings = await loadUserSettings(userId);

    // Merge updates
    const updatedSettings: UserAISettings = {
      ...currentSettings,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await saveUserSettings(updatedSettings);

    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (error: any) {
    console.error('[AI Settings User] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update user settings', details: error.message },
      { status: 500 }
    );
  }
}

