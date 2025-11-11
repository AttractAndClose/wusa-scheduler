/**
 * HubSpot integration for AI analysis
 */

import type { ConnectionConfig } from '@/types/ai-settings';
import { getConnectionByProvider } from '@/lib/ai/connections';

/**
 * Get HubSpot API client
 */
async function getHubSpotClient(type: 'global' | 'user', userId?: string) {
  const connection = await getConnectionByProvider('hubspot', type, userId);
  if (!connection || connection.status !== 'connected') {
    throw new Error('HubSpot not connected');
  }

  // In production, use @hubspot/api-client
  // For now, return a simple fetch-based client
  return {
    accessToken: connection.accessToken,
    baseUrl: 'https://api.hubapi.com',
  };
}

/**
 * Search HubSpot contacts
 */
export async function searchHubSpotContacts(
  query: string,
  type: 'global' | 'user' = 'global',
  userId?: string
): Promise<any[]> {
  try {
    const client = await getHubSpotClient(type, userId);
    const response = await fetch(
      `${client.baseUrl}/crm/v3/objects/contacts/search`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${client.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          limit: 10,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HubSpot API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('[HubSpot] Error searching contacts:', error);
    throw error;
  }
}

/**
 * Search HubSpot deals
 */
export async function searchHubSpotDeals(
  query: string,
  type: 'global' | 'user' = 'global',
  userId?: string
): Promise<any[]> {
  try {
    const client = await getHubSpotClient(type, userId);
    const response = await fetch(
      `${client.baseUrl}/crm/v3/objects/deals/search`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${client.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          limit: 10,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HubSpot API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('[HubSpot] Error searching deals:', error);
    throw error;
  }
}

/**
 * Get HubSpot deal pipeline data
 */
export async function getHubSpotPipeline(
  type: 'global' | 'user' = 'global',
  userId?: string
): Promise<any> {
  try {
    const client = await getHubSpotClient(type, userId);
    const response = await fetch(
      `${client.baseUrl}/crm/v3/pipelines/deals`,
      {
        headers: {
          'Authorization': `Bearer ${client.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HubSpot API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[HubSpot] Error getting pipeline:', error);
    throw error;
  }
}

