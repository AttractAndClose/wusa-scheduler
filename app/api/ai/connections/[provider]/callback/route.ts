/**
 * API endpoint for OAuth callback
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { isAdmin } from '@/lib/auth';
import { upsertConnection } from '@/lib/ai/connections';
import type { ConnectionProvider, ConnectionConfig } from '@/types/ai-settings';

export const dynamic = 'force-dynamic';

/**
 * GET - Handle OAuth callback
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    const provider = params.provider as ConnectionProvider;
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL(`/settings?error=${encodeURIComponent(error)}`, request.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/settings?error=missing_params', request.url));
    }

    // Decode state
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const { type } = stateData;

    if (type === 'global') {
      const admin = await isAdmin();
      if (!admin) {
        return NextResponse.redirect(new URL('/settings?error=unauthorized', request.url));
      }
    }

    // Exchange code for token
    let accessToken = '';
    let refreshToken = '';
    let expiresAt: number | undefined;

    switch (provider) {
      case 'hubspot':
        const hubspotRes = await fetch('https://api.hubapi.com/oauth/v1/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: process.env.HUBSPOT_CLIENT_ID!,
            client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
            redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/connections/hubspot/callback`,
            code,
          }),
        });
        const hubspotData = await hubspotRes.json();
        accessToken = hubspotData.access_token;
        refreshToken = hubspotData.refresh_token;
        expiresAt = Date.now() + (hubspotData.expires_in * 1000);
        break;

      case 'sharepoint':
      case 'outlook':
        const msRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: process.env.MICROSOFT_CLIENT_ID!,
            client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
            code,
            redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/connections/${provider}/callback`,
            grant_type: 'authorization_code',
          }),
        });
        const msData = await msRes.json();
        accessToken = msData.access_token;
        refreshToken = msData.refresh_token;
        expiresAt = Date.now() + (msData.expires_in * 1000);
        break;
    }

    if (!accessToken) {
      return NextResponse.redirect(new URL('/settings?error=token_exchange_failed', request.url));
    }

    // Create connection config
    const connectionId = `${provider}-${type}-${Date.now()}`;
    const connection: ConnectionConfig = {
      id: connectionId,
      provider,
      type,
      userId: type === 'user' ? userId : undefined,
      accessToken,
      refreshToken,
      expiresAt,
      scopes: [], // TODO: Extract from token response
      status: 'connected',
      connectedAt: new Date().toISOString(),
    };

    await upsertConnection(connection);

    return NextResponse.redirect(new URL('/settings?connected=true', request.url));
  } catch (error: any) {
    console.error('[AI Connections Callback] Error:', error);
    return NextResponse.redirect(new URL(`/settings?error=${encodeURIComponent(error.message)}`, request.url));
  }
}

