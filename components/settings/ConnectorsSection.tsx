'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plug, CheckCircle2, XCircle, AlertCircle, Loader2, Mail, Building2, Share2 } from 'lucide-react';
import { useIsAdmin } from '@/lib/use-admin';
import type { ConnectionProvider, ConnectionConfig } from '@/types/ai-settings';

interface ConnectorsSectionProps {
  onConnect?: () => void;
}

export function ConnectorsSection({ onConnect }: ConnectorsSectionProps) {
  const { user } = useUser();
  const isAdmin = useIsAdmin();
  const [loading, setLoading] = useState(true);
  const [globalConnections, setGlobalConnections] = useState<ConnectionConfig[]>([]);
  const [userConnections, setUserConnections] = useState<ConnectionConfig[]>([]);

  useEffect(() => {
    loadConnections();
  }, [user?.id, isAdmin]);

  const loadConnections = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const globalRes = await fetch('/api/ai/connections/global');
        if (globalRes.ok) {
          const globalData = await globalRes.json();
          setGlobalConnections(globalData.connections || []);
        }
      }

      const userRes = await fetch('/api/ai/connections/user');
      if (userRes.ok) {
        const userData = await userRes.json();
        setUserConnections(userData.connections || []);
      }
    } catch (error) {
      console.error('Error loading connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (provider: ConnectionProvider, type: 'global' | 'user') => {
    try {
      const endpoint = `/api/ai/connections/${provider}/connect`;
      
      const res = await fetch(endpoint, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authUrl) {
          // Redirect to OAuth
          window.location.href = data.authUrl;
        }
      } else {
        const error = await res.json();
        alert(`Failed to connect: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error connecting:', error);
      alert('Failed to initiate connection');
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm('Are you sure you want to disconnect this service?')) {
      return;
    }

    try {
      const res = await fetch(`/api/ai/connections/connection/${connectionId}`, { method: 'DELETE' });
      if (res.ok) {
        await loadConnections();
        onConnect?.();
      } else {
        const error = await res.json();
        alert(`Failed to disconnect: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      alert('Failed to disconnect');
    }
  };

  const handleTestConnection = async (connectionId: string) => {
    try {
      const res = await fetch(`/api/ai/connections/${connectionId}/test`, { method: 'POST' });
      if (res.ok) {
        alert('Connection test successful!');
      } else {
        const error = await res.json();
        alert(`Connection test failed: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      alert('Failed to test connection');
    }
  };

  const getConnectionIcon = (provider: ConnectionProvider) => {
    switch (provider) {
      case 'hubspot':
        return <Building2 className="h-5 w-5" />;
      case 'sharepoint':
        return <Share2 className="h-5 w-5" />;
      case 'outlook':
        return <Mail className="h-5 w-5" />;
    }
  };

  const getConnectionName = (provider: ConnectionProvider) => {
    switch (provider) {
      case 'hubspot':
        return 'HubSpot';
      case 'sharepoint':
        return 'SharePoint';
      case 'outlook':
        return 'Outlook';
    }
  };

  const getConnectionStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const providers: ConnectionProvider[] = ['hubspot', 'sharepoint', 'outlook'];

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
          <Plug className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-navy">Connectors</h2>
          <p className="text-sm text-gray-600">Connect external services for enhanced AI analysis</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Global Connectors (Admin only) */}
        {isAdmin && (
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-md font-semibold text-gray-800 mb-4">Global Connections</h3>
            <p className="text-sm text-gray-600 mb-4">
              Global connections are available to all users. These are typically used for company-wide data access.
            </p>
            
            <div className="space-y-3">
              {providers.map((provider) => {
                const connection = globalConnections.find(c => c.provider === provider);
                const isConnected = connection?.status === 'connected';

                return (
                  <div
                    key={provider}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded">
                        {getConnectionIcon(provider)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{getConnectionName(provider)}</span>
                          {connection && getConnectionStatusIcon(connection.status)}
                        </div>
                        <p className="text-xs text-gray-500">
                          {isConnected ? 'Connected' : 'Not connected'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isConnected && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTestConnection(connection.id)}
                          >
                            Test
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDisconnect(connection.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Disconnect
                          </Button>
                        </>
                      )}
                      {!isConnected && (
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => handleConnect(provider, 'global')}
                        >
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* User-Specific Connectors */}
        <div>
          <h3 className="text-md font-semibold text-gray-800 mb-4">Your Personal Connections</h3>
          <p className="text-sm text-gray-600 mb-4">
            Personal connections are only accessible to you. Use these for personal reports and scheduled emails.
          </p>
          
          <div className="space-y-3">
            {providers.map((provider) => {
              const connection = userConnections.find(c => c.provider === provider);
              const isConnected = connection?.status === 'connected';

              return (
                <div
                  key={provider}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded">
                      {getConnectionIcon(provider)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{getConnectionName(provider)}</span>
                        {connection && getConnectionStatusIcon(connection.status)}
                      </div>
                      <p className="text-xs text-gray-500">
                        {isConnected ? 'Connected' : 'Not connected'}
                        {provider === 'outlook' && ' - For scheduled email reports'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isConnected && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTestConnection(connection.id)}
                        >
                          Test
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDisconnect(connection.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Disconnect
                        </Button>
                      </>
                    )}
                    {!isConnected && (
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => handleConnect(provider, 'user')}
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

