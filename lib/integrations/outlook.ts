/**
 * Outlook integration for sending scheduled email reports
 */

import type { ConnectionConfig } from '@/types/ai-settings';
import { getConnectionByProvider } from '@/lib/ai/connections';

/**
 * Get Microsoft Graph API client for Outlook
 */
async function getOutlookClient(userId: string) {
  const connection = await getConnectionByProvider('outlook', 'user', userId);
  if (!connection || connection.status !== 'connected') {
    throw new Error('Outlook not connected');
  }

  return {
    accessToken: connection.accessToken,
    baseUrl: 'https://graph.microsoft.com/v1.0',
  };
}

/**
 * Send email via Outlook
 */
export async function sendOutlookEmail(
  userId: string,
  to: string[],
  subject: string,
  body: string,
  isHtml: boolean = true
): Promise<void> {
  try {
    const client = await getOutlookClient(userId);
    
    const response = await fetch(
      `${client.baseUrl}/me/sendMail`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${client.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            subject,
            body: {
              contentType: isHtml ? 'HTML' : 'Text',
              content: body,
            },
            toRecipients: to.map(email => ({ emailAddress: { address: email } })),
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Microsoft Graph API error: ${response.statusText} - ${error}`);
    }
  } catch (error) {
    console.error('[Outlook] Error sending email:', error);
    throw error;
  }
}

/**
 * Create a draft email
 */
export async function createDraftEmail(
  userId: string,
  to: string[],
  subject: string,
  body: string,
  isHtml: boolean = true
): Promise<string> {
  try {
    const client = await getOutlookClient(userId);
    
    const response = await fetch(
      `${client.baseUrl}/me/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${client.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          body: {
            contentType: isHtml ? 'HTML' : 'Text',
            content: body,
          },
          toRecipients: to.map(email => ({ emailAddress: { address: email } })),
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Microsoft Graph API error: ${response.statusText} - ${error}`);
    }

    const message = await response.json();
    return message.id;
  } catch (error) {
    console.error('[Outlook] Error creating draft:', error);
    throw error;
  }
}

