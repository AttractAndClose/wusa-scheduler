/**
 * Connection storage and management for external service integrations
 */

import fs from 'fs/promises';
import path from 'path';
import { encrypt, decrypt } from './encryption';
import type { ConnectionConfig, ConnectionProvider } from '@/types/ai-settings';

const DATA_DIR = path.join(process.cwd(), 'data');
const CONNECTIONS_DIR = path.join(DATA_DIR, 'ai-connections');
const GLOBAL_CONNECTIONS_FILE = path.join(CONNECTIONS_DIR, 'global.json');
const USER_CONNECTIONS_DIR = path.join(CONNECTIONS_DIR, 'users');

/**
 * Ensure directories exist
 */
async function ensureDirectories(): Promise<void> {
  try {
    await fs.mkdir(CONNECTIONS_DIR, { recursive: true });
    await fs.mkdir(USER_CONNECTIONS_DIR, { recursive: true });
  } catch (error) {
    console.error('[AI Connections] Error creating directories:', error);
    throw error;
  }
}

/**
 * Load global connections
 */
export async function loadGlobalConnections(): Promise<ConnectionConfig[]> {
  try {
    await ensureDirectories();
    const content = await fs.readFile(GLOBAL_CONNECTIONS_FILE, 'utf8');
    const connections = JSON.parse(content) as ConnectionConfig[];
    // Decrypt tokens (they're stored encrypted)
    return connections.map(conn => {
      try {
        return {
          ...conn,
          accessToken: decrypt(conn.accessToken),
          refreshToken: conn.refreshToken ? decrypt(conn.refreshToken) : undefined,
        };
      } catch (decryptError) {
        console.error('[AI Connections] Error decrypting token:', decryptError);
        return { ...conn, status: 'error' as const };
      }
    });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return [];
    }
    console.error('[AI Connections] Error loading global connections:', error);
    throw error;
  }
}

/**
 * Save global connections
 */
export async function saveGlobalConnections(connections: ConnectionConfig[]): Promise<void> {
  try {
    await ensureDirectories();
    // Encrypt tokens before saving
    const encrypted = connections.map(conn => ({
      ...conn,
      accessToken: encrypt(conn.accessToken),
      refreshToken: conn.refreshToken ? encrypt(conn.refreshToken) : undefined,
    }));
    await fs.writeFile(
      GLOBAL_CONNECTIONS_FILE,
      JSON.stringify(encrypted, null, 2),
      'utf8'
    );
  } catch (error) {
    console.error('[AI Connections] Error saving global connections:', error);
    throw error;
  }
}

/**
 * Load user connections
 */
export async function loadUserConnections(userId: string): Promise<ConnectionConfig[]> {
  try {
    await ensureDirectories();
    const userConnectionsFile = path.join(USER_CONNECTIONS_DIR, `${userId}.json`);
    const content = await fs.readFile(userConnectionsFile, 'utf8');
    const connections = JSON.parse(content) as ConnectionConfig[];
    // Decrypt tokens (they're stored encrypted)
    return connections.map(conn => {
      try {
        return {
          ...conn,
          accessToken: decrypt(conn.accessToken),
          refreshToken: conn.refreshToken ? decrypt(conn.refreshToken) : undefined,
        };
      } catch (decryptError) {
        console.error('[AI Connections] Error decrypting token:', decryptError);
        return { ...conn, status: 'error' as const };
      }
    });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return [];
    }
    console.error('[AI Connections] Error loading user connections:', error);
    throw error;
  }
}

/**
 * Save user connections
 */
export async function saveUserConnections(userId: string, connections: ConnectionConfig[]): Promise<void> {
  try {
    await ensureDirectories();
    const userConnectionsFile = path.join(USER_CONNECTIONS_DIR, `${userId}.json`);
    // Encrypt tokens before saving
    const encrypted = connections.map(conn => ({
      ...conn,
      accessToken: encrypt(conn.accessToken),
      refreshToken: conn.refreshToken ? encrypt(conn.refreshToken) : undefined,
    }));
    await fs.writeFile(
      userConnectionsFile,
      JSON.stringify(encrypted, null, 2),
      'utf8'
    );
  } catch (error) {
    console.error('[AI Connections] Error saving user connections:', error);
    throw error;
  }
}

/**
 * Add or update a connection
 */
export async function upsertConnection(connection: ConnectionConfig): Promise<void> {
  if (connection.type === 'global') {
    const connections = await loadGlobalConnections();
    const index = connections.findIndex(c => c.id === connection.id);
    if (index >= 0) {
      connections[index] = connection;
    } else {
      connections.push(connection);
    }
    await saveGlobalConnections(connections);
  } else {
    if (!connection.userId) {
      throw new Error('User ID required for user connections');
    }
    const connections = await loadUserConnections(connection.userId);
    const index = connections.findIndex(c => c.id === connection.id);
    if (index >= 0) {
      connections[index] = connection;
    } else {
      connections.push(connection);
    }
    await saveUserConnections(connection.userId, connections);
  }
}

/**
 * Get connection by ID
 */
export async function getConnection(connectionId: string, userId?: string): Promise<ConnectionConfig | null> {
  // Try global first
  const globalConnections = await loadGlobalConnections();
  const globalConn = globalConnections.find(c => c.id === connectionId);
  if (globalConn) return globalConn;

  // Try user connections if userId provided
  if (userId) {
    const userConnections = await loadUserConnections(userId);
    const userConn = userConnections.find(c => c.id === connectionId);
    if (userConn) return userConn;
  }

  return null;
}

/**
 * Delete a connection
 */
export async function deleteConnection(connectionId: string, userId?: string): Promise<boolean> {
  // Try global first
  const globalConnections = await loadGlobalConnections();
  const globalIndex = globalConnections.findIndex(c => c.id === connectionId);
  if (globalIndex >= 0) {
    globalConnections.splice(globalIndex, 1);
    await saveGlobalConnections(globalConnections);
    return true;
  }

  // Try user connections if userId provided
  if (userId) {
    const userConnections = await loadUserConnections(userId);
    const userIndex = userConnections.findIndex(c => c.id === connectionId);
    if (userIndex >= 0) {
      userConnections.splice(userIndex, 1);
      await saveUserConnections(userId, userConnections);
      return true;
    }
  }

  return false;
}

/**
 * Get connection by provider
 */
export async function getConnectionByProvider(
  provider: ConnectionProvider,
  type: 'global' | 'user',
  userId?: string
): Promise<ConnectionConfig | null> {
  if (type === 'global') {
    const connections = await loadGlobalConnections();
    return connections.find(c => c.provider === provider && c.status === 'connected') || null;
  } else {
    if (!userId) return null;
    const connections = await loadUserConnections(userId);
    return connections.find(c => c.provider === provider && c.status === 'connected') || null;
  }
}

