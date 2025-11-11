/**
 * Type definitions for AI Analysis settings and configuration
 */

export type VoiceTone = 'professional' | 'casual' | 'technical' | 'executive';

export type AnalysisMode = 'quick' | 'standard' | 'deep-research' | 'vision' | 'auto';

export type ConnectionProvider = 'hubspot' | 'sharepoint' | 'outlook';

export type ConnectionStatus = 'connected' | 'disconnected' | 'error';

export interface AISettings {
  voice: VoiceTone;
  systemInstructions: string;
  referenceFiles: string[];
  defaultAnalysisMode: AnalysisMode;
  costLimit?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface GlobalAISettings extends AISettings {
  // Global settings may have additional fields
}

export interface UserAISettings extends AISettings {
  userId: string;
  // User can override global settings
  voiceOverride?: VoiceTone;
  personalInstructions?: string;
  personalReferenceFiles?: string[];
}

export interface ConnectionConfig {
  id: string;
  provider: ConnectionProvider;
  type: 'global' | 'user';
  userId?: string;
  accessToken: string; // encrypted
  refreshToken?: string; // encrypted
  expiresAt?: number;
  scopes: string[];
  status: ConnectionStatus;
  errorMessage?: string;
  connectedAt?: string;
  lastUsedAt?: string;
}

export interface DocumentMetadata {
  id: string;
  filename: string;
  type: 'document' | 'image';
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  isGlobal: boolean;
  processed: boolean;
  processedAt?: string;
  embeddingIds?: string[];
}

export interface ScheduledReport {
  id: string;
  userId: string;
  name: string;
  query: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  schedule: string; // Cron expression or time
  recipients: string[];
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  createdAt: string;
}

export interface ModelSelection {
  model: string;
  maxTokens: number;
  temperature: number;
  reasoning: 'auto' | 'fast' | 'deep';
}

export interface AnalysisRequest {
  prompt: string;
  mode: AnalysisMode;
  attachments?: Array<{
    id: string;
    type: 'document' | 'image';
    url: string;
    name: string;
  }>;
  dateRange?: { start: string; end: string };
  selectedTerritories?: string[];
  selectedLeadSources?: string[];
  useConnections?: ConnectionProvider[];
  useReferenceFiles?: boolean;
}

