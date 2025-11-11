'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Save, Loader2, Upload, X, FileText } from 'lucide-react';
import { useIsAdmin } from '@/lib/use-admin';
import type { VoiceTone, AnalysisMode, GlobalAISettings, UserAISettings } from '@/types/ai-settings';

interface AISettingsSectionProps {
  onSave?: () => void;
}

export function AISettingsSection({ onSave }: AISettingsSectionProps) {
  const { user } = useUser();
  const isAdmin = useIsAdmin();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [globalSettings, setGlobalSettings] = useState<GlobalAISettings | null>(null);
  const [userSettings, setUserSettings] = useState<UserAISettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [user?.id, isAdmin]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const globalRes = await fetch('/api/ai/settings/global');
        if (globalRes.ok) {
          const globalData = await globalRes.json();
          setGlobalSettings(globalData.settings);
        }
      }

      const userRes = await fetch('/api/ai/settings/user');
      if (userRes.ok) {
        const userData = await userRes.json();
        setUserSettings(userData.settings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isAdmin && globalSettings) {
        await fetch('/api/ai/settings/global', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(globalSettings),
        });
      }

      if (userSettings) {
        await fetch('/api/ai/settings/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userSettings),
        });
      }

      setHasChanges(false);
      onSave?.();
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 bg-white mb-6">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white mb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-600/10 rounded-lg">
          <Sparkles className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-navy">AI Analysis Configuration</h2>
          <p className="text-sm text-gray-600">Configure AI analysis behavior and preferences</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Global Settings (Admin only) */}
        {isAdmin && globalSettings && (
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-md font-semibold text-gray-800 mb-4">Global Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Voice/Tone</label>
                <Select
                  value={globalSettings.voice}
                  onValueChange={(value: VoiceTone) => {
                    setGlobalSettings({ ...globalSettings, voice: value });
                    setHasChanges(true);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">System Instructions</label>
                <Textarea
                  value={globalSettings.systemInstructions}
                  onChange={(e) => {
                    setGlobalSettings({ ...globalSettings, systemInstructions: e.target.value });
                    setHasChanges(true);
                  }}
                  rows={6}
                  placeholder="Enter default system instructions and company knowledge..."
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  These instructions will be used as the base for all AI analysis. Include company-specific knowledge and analysis preferences.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Default Analysis Mode</label>
                <Select
                  value={globalSettings.defaultAnalysisMode}
                  onValueChange={(value: AnalysisMode) => {
                    setGlobalSettings({ ...globalSettings, defaultAnalysisMode: value });
                    setHasChanges(true);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quick">Quick Analysis</SelectItem>
                    <SelectItem value="standard">Standard Analysis</SelectItem>
                    <SelectItem value="deep-research">Deep Research</SelectItem>
                    <SelectItem value="vision">Vision Analysis</SelectItem>
                    <SelectItem value="auto">Auto Select</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Monthly Cost Limit (optional)
                </label>
                <Input
                  type="number"
                  value={globalSettings.costLimit || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : undefined;
                    setGlobalSettings({ ...globalSettings, costLimit: value });
                    setHasChanges(true);
                  }}
                  placeholder="No limit"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Set a monthly cost limit for AI analysis (in USD). Leave empty for no limit.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Reference Files</label>
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Company-wide reference documents</span>
                    <Button size="sm" variant="outline" className="border-blue-600 text-blue-700">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                  {globalSettings.referenceFiles.length === 0 ? (
                    <p className="text-sm text-gray-500">No reference files uploaded</p>
                  ) : (
                    <div className="space-y-2">
                      {globalSettings.referenceFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{file}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const newFiles = globalSettings.referenceFiles.filter((_, i) => i !== index);
                              setGlobalSettings({ ...globalSettings, referenceFiles: newFiles });
                              setHasChanges(true);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Settings */}
        {userSettings && (
          <div>
            <h3 className="text-md font-semibold text-gray-800 mb-4">Your Personal Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Personal Voice/Tone Override (optional)
                </label>
                <Select
                  value={userSettings.voiceOverride || userSettings.voice}
                  onValueChange={(value: VoiceTone) => {
                    setUserSettings({ ...userSettings, voiceOverride: value });
                    setHasChanges(true);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Override the global voice setting for your personal use
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Personal Instructions (optional)
                </label>
                <Textarea
                  value={userSettings.personalInstructions || ''}
                  onChange={(e) => {
                    setUserSettings({ ...userSettings, personalInstructions: e.target.value });
                    setHasChanges(true);
                  }}
                  rows={4}
                  placeholder="Add your personal preferences or additional context..."
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  These instructions will be added to the system instructions for your analyses
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Personal Reference Files</label>
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Your personal reference documents</span>
                    <Button size="sm" variant="outline" className="border-blue-600 text-blue-700">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                  {(!userSettings.personalReferenceFiles || userSettings.personalReferenceFiles.length === 0) ? (
                    <p className="text-sm text-gray-500">No personal reference files uploaded</p>
                  ) : (
                    <div className="space-y-2">
                      {userSettings.personalReferenceFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{file}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const newFiles = (userSettings.personalReferenceFiles || []).filter((_, i) => i !== index);
                              setUserSettings({ ...userSettings, personalReferenceFiles: newFiles });
                              setHasChanges(true);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}

