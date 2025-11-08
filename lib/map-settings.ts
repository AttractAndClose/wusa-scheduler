'use client';

export interface MapVisibilitySettings {
  leadFilters: Set<'ef-640-plus' | 'ef-1' | 'ef-0'>;
  daysAgoFilter: number;
  referralSourceFilters: Set<string>; // Referral Lead Source Details filters
}

const STORAGE_KEY = 'map-visibility-settings';

const REFERRAL_SOURCE_DETAILS = [
  'ReferralBD', 'ReferralEX', 'ReferralNG', 'ReferralPL', 'ReferralSA',
  'ReferralTH', 'ReferralTM', 'ReferralTP', 'ReferralTX', 'ReferralYS',
  'ReferralEX-PLUS'
];

const DEFAULT_SETTINGS: MapVisibilitySettings = {
  leadFilters: new Set(),
  daysAgoFilter: 30,
  referralSourceFilters: new Set(), // Empty set = show all by default
};

/**
 * Load map visibility settings from localStorage
 */
export function loadMapSettings(): MapVisibilitySettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        leadFilters: new Set(parsed.leadFilters || []),
        daysAgoFilter: parsed.daysAgoFilter ?? DEFAULT_SETTINGS.daysAgoFilter,
        referralSourceFilters: new Set(parsed.referralSourceFilters || []), // Empty array = show all
      };
    }
  } catch (error) {
    console.error('Error loading map settings:', error);
  }

  return DEFAULT_SETTINGS;
}

/**
 * Save map visibility settings to localStorage
 */
export function saveMapSettings(settings: MapVisibilitySettings): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const toStore = {
      leadFilters: Array.from(settings.leadFilters),
      daysAgoFilter: settings.daysAgoFilter,
      referralSourceFilters: Array.from(settings.referralSourceFilters),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch (error) {
    console.error('Error saving map settings:', error);
  }
}

