/**
 * API endpoint for initiating OAuth connection
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { isAdmin } from '@/lib/auth';
import type { ConnectionProvider } from '@/types/ai-settings';

export const dynamic = 'force-dynamic';

/**
 * POST - Initiate OAuth connection
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const provider = params.provider as ConnectionProvider;
    const { type } = await request.json(); // 'global' or 'user'

    if (type === 'global') {
      const admin = await isAdmin();
      if (!admin) {
        return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
      }
    }

    // Generate OAuth URL based on provider
    let authUrl = '';
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/connections/${provider}/callback`;

    switch (provider) {
      case 'hubspot':
        const hubspotClientId = process.env.HUBSPOT_CLIENT_ID;
        if (!hubspotClientId) {
          return NextResponse.json({ error: 'HubSpot client ID not configured' }, { status: 500 });
        }
        const hubspotScopes = 'contacts deals companies tickets';
        authUrl = `https://app.hubspot.com/oauth/authorize?client_id=${hubspotClientId}&scope=${hubspotScopes}&redirect_uri=${encodeURIComponent(redirectUri)}`;
        break;

      case 'sharepoint':
      case 'outlook':
        const msClientId = process.env.MICROSOFT_CLIENT_ID;
        if (!msClientId) {
          return NextResponse.json({ error: 'Microsoft client ID not configured' }, { status: 500 });
        }
        const msScopes = provider === 'sharepoint'
          ? 'https://graph.microsoft.com/Sites.Read.All https://graph.microsoft.com/Files.Read.All'
          : 'https://graph.microsoft.com/Mail.Send';
        authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${msClientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&response_mode=query&scope=${encodeURIComponent(msScopes)}`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    // Store state in session/cookie for verification
    // For now, we'll include type in the redirect URI
    const state = Buffer.from(JSON.stringify({ userId, type })).toString('base64');
    authUrl += `&state=${encodeURIComponent(state)}`;

    return NextResponse.json({ success: true, authUrl });
  } catch (error: any) {
    console.error('[AI Connections Connect] Error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate connection', details: error.message },
      { status: 500 }
    );
  }
}

