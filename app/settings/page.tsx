'use client';

import { Suspense, useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { useIsAdmin } from '@/lib/use-admin';
import { Card } from '@/components/ui/card';
import { Users, MapPin } from 'lucide-react';
import { loadMapSettings, saveMapSettings, type MapVisibilitySettings } from '@/lib/map-settings';
import { AISettingsSection } from '@/components/settings/AISettingsSection';
import { ConnectorsSection } from '@/components/settings/ConnectorsSection';

const REFERRAL_SOURCE_DETAILS = [
  'ReferralBD', 'ReferralEX', 'ReferralNG', 'ReferralPL', 'ReferralSA',
  'ReferralTH', 'ReferralTM', 'ReferralTP', 'ReferralTX', 'ReferralYS',
  'ReferralEX-PLUS'
] as const;

function SettingsContent() {
  const { isLoaded, isSignedIn, user } = useUser();
  const isAdmin = useIsAdmin();
  const router = useRouter();
  const [mapSettings, setMapSettings] = useState<MapVisibilitySettings>({
    leadFilters: new Set(),
    daysAgoFilter: 30,
    referralSourceFilters: new Set(), // Empty set = show all by default
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const settings = loadMapSettings();
    setMapSettings(settings);
  }, []);

  const handleSaveSettings = () => {
    saveMapSettings(mapSettings);
    setHasChanges(false);
    // Show success message (you could add a toast notification here)
    alert('Map visibility settings saved! These will be the default for all non-admin users.');
  };

  // Redirect if not signed in
  if (isLoaded && !isSignedIn) {
    router.push('/sign-in');
    return null;
  }

  // Note: Settings page is accessible to all users, but some sections are admin-only

  if (!isLoaded) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy mb-2">Settings</h1>
          <p className="text-gray-600">Manage application settings and preferences</p>
        </div>

        {/* User Management */}
        <Card className="p-6 bg-white mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-navy/10 rounded-lg">
              <Users className="h-5 w-5 text-navy" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-navy">User Management</h2>
              <p className="text-sm text-gray-600">Manage users and their roles. Add new users, assign roles, and control access to features.</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Coming soon: User management interface
          </p>
        </Card>

        {/* Map Visibility Settings */}
        <Card className="p-6 bg-white mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-navy/10 rounded-lg">
              <MapPin className="h-5 w-5 text-navy" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-navy">Map Visibility</h2>
              <p className="text-sm text-gray-600">Configure default lead filters for non-admin users on the map page</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* EF Score Filter Toggles */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">Lead Filters (Default for Members):</label>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => {
                    setMapSettings(prev => ({ ...prev, leadFilters: new Set() }));
                    setHasChanges(true);
                  }}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    mapSettings.leadFilters.size === 0
                      ? 'bg-navy text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Leads
                </button>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mapSettings.leadFilters.has('ef-640-plus')}
                    onChange={(e) => {
                      const newFilters = new Set(mapSettings.leadFilters);
                      if (e.target.checked) {
                        newFilters.add('ef-640-plus');
                      } else {
                        newFilters.delete('ef-640-plus');
                      }
                      setMapSettings(prev => ({ ...prev, leadFilters: newFilters }));
                      setHasChanges(true);
                    }}
                    className="w-4 h-4 text-navy border-gray-300 rounded focus:ring-navy"
                  />
                  <span className="text-xs text-gray-700">EF Score ≥ 640</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mapSettings.leadFilters.has('ef-1')}
                    onChange={(e) => {
                      const newFilters = new Set(mapSettings.leadFilters);
                      if (e.target.checked) {
                        newFilters.add('ef-1');
                      } else {
                        newFilters.delete('ef-1');
                      }
                      setMapSettings(prev => ({ ...prev, leadFilters: newFilters }));
                      setHasChanges(true);
                    }}
                    className="w-4 h-4 text-navy border-gray-300 rounded focus:ring-navy"
                  />
                  <span className="text-xs text-gray-700">EF Score 1</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mapSettings.leadFilters.has('ef-0')}
                    onChange={(e) => {
                      const newFilters = new Set(mapSettings.leadFilters);
                      if (e.target.checked) {
                        newFilters.add('ef-0');
                      } else {
                        newFilters.delete('ef-0');
                      }
                      setMapSettings(prev => ({ ...prev, leadFilters: newFilters }));
                      setHasChanges(true);
                    }}
                    className="w-4 h-4 text-navy border-gray-300 rounded focus:ring-navy"
                  />
                  <span className="text-xs text-gray-700">EF Score 0</span>
                </label>
              </div>
            </div>
            
            {/* Referral Lead Source Details Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">Referral Lead Source Details (Default for Members):</label>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => {
                    setMapSettings(prev => ({ ...prev, referralSourceFilters: new Set() }));
                    setHasChanges(true);
                  }}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    mapSettings.referralSourceFilters.size === 0
                      ? 'bg-navy text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {REFERRAL_SOURCE_DETAILS.map((sourceDetail) => (
                  <label key={sourceDetail} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mapSettings.referralSourceFilters.has(sourceDetail)}
                      onChange={(e) => {
                        const newFilters = new Set(mapSettings.referralSourceFilters);
                        if (e.target.checked) {
                          newFilters.add(sourceDetail);
                        } else {
                          newFilters.delete(sourceDetail);
                        }
                        setMapSettings(prev => ({ ...prev, referralSourceFilters: newFilters }));
                        setHasChanges(true);
                      }}
                      className="w-4 h-4 text-navy border-gray-300 rounded focus:ring-navy"
                    />
                    <span className="text-xs text-gray-700">{sourceDetail}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Created Date Slider */}
            <div>
              <label htmlFor="settingsDaysAgoSlider" className="text-sm font-medium text-gray-700 mb-3 block">
                Created within last (Default for Members):
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="settingsDaysAgoSlider"
                  type="range"
                  min="0"
                  max="365"
                  value={mapSettings.daysAgoFilter}
                  onChange={(e) => {
                    setMapSettings(prev => ({ ...prev, daysAgoFilter: Number(e.target.value) }));
                    setHasChanges(true);
                  }}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-900 min-w-[60px] text-right">
                  {mapSettings.daysAgoFilter} days
                </span>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={handleSaveSettings}
                disabled={!hasChanges}
                className="px-4 py-2 bg-navy text-white text-sm font-medium rounded hover:bg-navy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </Card>

        {/* AI Analysis Configuration */}
        <AISettingsSection />

        {/* Connectors */}
        <ConnectorsSection />
      </div>
    </AppLayout>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </AppLayout>
    }>
      <SettingsContent />
    </Suspense>
  );
}

