'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { ArrowLeft, Upload, FileText, Database, Calendar, Hash } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DataUpload from '@/components/territory-map/DataUpload';

interface DataSet {
  id: string;
  name: string;
  type: 'funnel' | 'metrics';
  description: string;
  recordCount: number;
  uploadedAt: string;
  fileSize: number;
}

export default function DataSetsPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [dataSets, setDataSets] = useState<DataSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      window.location.href = '/sign-in';
    }
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    loadDataSets();
  }, []);

  const loadDataSets = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/territory-map/data/list');
      if (response.ok) {
        const data = await response.json();
        setDataSets(data);
      }
    } catch (error) {
      console.error('Error loading data sets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadComplete = () => {
    loadDataSets();
    setShowUpload(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isLoaded) {
    return (
      <AppLayout>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-navy">Initializing...</p>
          </div>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/territory-map')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Map
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-navy">Data Sets</h1>
              <p className="text-gray-600 mt-1">Manage your uploaded data for territory mapping</p>
            </div>
            <Button onClick={() => setShowUpload(!showUpload)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload New Data
            </Button>
          </div>
        </div>

        {/* Upload Section */}
        {showUpload && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Upload New Data Set</CardTitle>
            </CardHeader>
            <CardContent>
              <DataUpload onUploadComplete={handleUploadComplete} />
            </CardContent>
          </Card>
        )}

        {/* Data Sets List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-navy">Loading data sets...</p>
          </div>
        ) : dataSets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-navy mb-2">No Data Sets</h3>
              <p className="text-gray-600 mb-4">Upload your first data set to get started</p>
              <Button onClick={() => setShowUpload(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Data
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {dataSets.map((dataSet) => (
              <Card key={dataSet.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {dataSet.type === 'funnel' ? (
                          <FileText className="h-5 w-5 text-primary" />
                        ) : (
                          <Database className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{dataSet.name}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{dataSet.description}</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">
                      {dataSet.type}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Hash className="h-4 w-4" />
                      <span>{dataSet.recordCount.toLocaleString()} records</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Uploaded {formatDate(dataSet.uploadedAt)}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Size:</span> {formatFileSize(dataSet.fileSize)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </AppLayout>
  );
}


