/**
 * SharePoint integration for AI analysis
 */

import type { ConnectionConfig } from '@/types/ai-settings';
import { getConnectionByProvider } from '@/lib/ai/connections';

/**
 * Get Microsoft Graph API client
 */
async function getGraphClient(type: 'global' | 'user', userId?: string) {
  const connection = await getConnectionByProvider('sharepoint', type, userId);
  if (!connection || connection.status !== 'connected') {
    throw new Error('SharePoint not connected');
  }

  return {
    accessToken: connection.accessToken,
    baseUrl: 'https://graph.microsoft.com/v1.0',
  };
}

/**
 * Search SharePoint documents
 */
export async function searchSharePointDocuments(
  query: string,
  type: 'global' | 'user' = 'global',
  userId?: string
): Promise<any[]> {
  try {
    const client = await getGraphClient(type, userId);
    const response = await fetch(
      `${client.baseUrl}/sites?search=${encodeURIComponent(query)}`,
      {
        headers: {
          'Authorization': `Bearer ${client.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Microsoft Graph API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.value || [];
  } catch (error) {
    console.error('[SharePoint] Error searching documents:', error);
    throw error;
  }
}

/**
 * Read SharePoint document content
 */
export async function readSharePointDocument(
  siteId: string,
  itemId: string,
  type: 'global' | 'user' = 'global',
  userId?: string
): Promise<string> {
  try {
    const client = await getGraphClient(type, userId);
    const response = await fetch(
      `${client.baseUrl}/sites/${siteId}/drive/items/${itemId}/content`,
      {
        headers: {
          'Authorization': `Bearer ${client.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Microsoft Graph API error: ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    console.error('[SharePoint] Error reading document:', error);
    throw error;
  }
}

/**
 * List SharePoint sites
 */
export async function listSharePointSites(
  type: 'global' | 'user' = 'global',
  userId?: string
): Promise<any[]> {
  try {
    const client = await getGraphClient(type, userId);
    const response = await fetch(
      `${client.baseUrl}/sites`,
      {
        headers: {
          'Authorization': `Bearer ${client.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Microsoft Graph API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.value || [];
  } catch (error) {
    console.error('[SharePoint] Error listing sites:', error);
    throw error;
  }
}

