/**
 * Settings storage and management for AI Analysis
 * Handles both global and user-specific settings
 */

import fs from 'fs/promises';
import path from 'path';
import type {
  GlobalAISettings,
  UserAISettings,
  AISettings,
} from '@/types/ai-settings';

const DATA_DIR = path.join(process.cwd(), 'data');
const GLOBAL_SETTINGS_FILE = path.join(DATA_DIR, 'ai-settings-global.json');
const USER_SETTINGS_DIR = path.join(DATA_DIR, 'ai-settings-users');

// Default global settings
const DEFAULT_GLOBAL_SETTINGS: GlobalAISettings = {
  voice: 'professional',
  systemInstructions: `You are an expert business intelligence analyst specializing in sales and marketing funnel optimization, financial data analysis, territory management, and vendor performance.

Your role is to analyze comprehensive business data and provide actionable insights.`,
  referenceFiles: [],
  defaultAnalysisMode: 'standard',
  costLimit: undefined,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Default user settings
const DEFAULT_USER_SETTINGS: Omit<UserAISettings, 'userId'> = {
  voice: 'professional',
  systemInstructions: '',
  referenceFiles: [],
  defaultAnalysisMode: 'standard',
  costLimit: undefined,
};

/**
 * Ensure data directories exist
 */
async function ensureDirectories(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(USER_SETTINGS_DIR, { recursive: true });
  } catch (error) {
    console.error('[AI Settings] Error creating directories:', error);
    throw error;
  }
}

/**
 * Load global AI settings
 */
export async function loadGlobalSettings(): Promise<GlobalAISettings> {
  try {
    await ensureDirectories();
    const content = await fs.readFile(GLOBAL_SETTINGS_FILE, 'utf8');
    return JSON.parse(content) as GlobalAISettings;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return defaults and create it
      await saveGlobalSettings(DEFAULT_GLOBAL_SETTINGS);
      return DEFAULT_GLOBAL_SETTINGS;
    }
    console.error('[AI Settings] Error loading global settings:', error);
    throw error;
  }
}

/**
 * Save global AI settings
 */
export async function saveGlobalSettings(settings: GlobalAISettings): Promise<void> {
  try {
    await ensureDirectories();
    const settingsWithTimestamp = {
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    await fs.writeFile(
      GLOBAL_SETTINGS_FILE,
      JSON.stringify(settingsWithTimestamp, null, 2),
      'utf8'
    );
  } catch (error) {
    console.error('[AI Settings] Error saving global settings:', error);
    throw error;
  }
}

/**
 * Load user-specific AI settings
 */
export async function loadUserSettings(userId: string): Promise<UserAISettings> {
  try {
    await ensureDirectories();
    const userSettingsFile = path.join(USER_SETTINGS_DIR, `${userId}.json`);
    
    try {
      const content = await fs.readFile(userSettingsFile, 'utf8');
      return JSON.parse(content) as UserAISettings;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, return defaults
        const defaultSettings: UserAISettings = {
          ...DEFAULT_USER_SETTINGS,
          userId,
        };
        await saveUserSettings(defaultSettings);
        return defaultSettings;
      }
      throw error;
    }
  } catch (error) {
    console.error('[AI Settings] Error loading user settings:', error);
    throw error;
  }
}

/**
 * Save user-specific AI settings
 */
export async function saveUserSettings(settings: UserAISettings): Promise<void> {
  try {
    await ensureDirectories();
    const userSettingsFile = path.join(USER_SETTINGS_DIR, `${settings.userId}.json`);
    const settingsWithTimestamp = {
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    await fs.writeFile(
      userSettingsFile,
      JSON.stringify(settingsWithTimestamp, null, 2),
      'utf8'
    );
  } catch (error) {
    console.error('[AI Settings] Error saving user settings:', error);
    throw error;
  }
}

/**
 * Get merged settings for a user (global + user overrides)
 */
export async function getMergedSettings(userId: string): Promise<AISettings> {
  const globalSettings = await loadGlobalSettings();
  const userSettings = await loadUserSettings(userId);
  
  return {
    voice: userSettings.voiceOverride || userSettings.voice || globalSettings.voice,
    systemInstructions: userSettings.personalInstructions || userSettings.systemInstructions || globalSettings.systemInstructions,
    referenceFiles: [
      ...globalSettings.referenceFiles,
      ...(userSettings.personalReferenceFiles || []),
    ],
    defaultAnalysisMode: userSettings.defaultAnalysisMode || globalSettings.defaultAnalysisMode,
    costLimit: userSettings.costLimit || globalSettings.costLimit,
  };
}

