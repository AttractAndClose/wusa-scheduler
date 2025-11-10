'use client';

import { useState } from 'react';
import { Upload, FileText, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { parseFunnelCSV, parseMetricsCSV, validateCSVFormat } from '@/lib/territory-map/csvParser';

interface DataUploadProps {
  onUploadComplete?: () => void;
}

export default function DataUpload({ onUploadComplete }: DataUploadProps) {
  const [dataType, setDataType] = useState<'funnel' | 'metrics'>('funnel');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('idle');
    setErrorMessage('');

    try {
      const text = await file.text();
      
      // Validate CSV format
      const validation = validateCSVFormat(text, dataType);
      if (!validation.valid) {
        setErrorMessage(validation.errors.join(', '));
        setUploadStatus('error');
        setIsUploading(false);
        return;
      }

      // Parse CSV
      let parsedData;
      if (dataType === 'funnel') {
        parsedData = parseFunnelCSV(text);
      } else {
        parsedData = parseMetricsCSV(text);
      }

      // Upload to API
      const response = await fetch('/api/territory-map/data/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: dataType,
          data: parsedData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to upload data');
      }

      setUploadStatus('success');
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setErrorMessage(error.message || 'Failed to upload file');
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Upload Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Data Type</label>
          <select
            value={dataType}
            onChange={(e) => {
              setDataType(e.target.value as 'funnel' | 'metrics');
              setUploadStatus('idle');
              setErrorMessage('');
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="funnel">Funnel Data (leads, appointments, sales)</option>
            <option value="metrics">Zip Code Metrics (population, income)</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">CSV File</label>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark file:cursor-pointer disabled:opacity-50"
            />
          </div>
        </div>
        {uploadStatus === 'success' && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>Upload successful!</span>
          </div>
        )}
        {uploadStatus === 'error' && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <XCircle className="h-4 w-4" />
            <span>{errorMessage || 'Upload failed'}</span>
          </div>
        )}
        {isUploading && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Uploading...</span>
          </div>
        )}
        <div className="text-xs text-gray-500 pt-2 border-t">
          <p className="font-medium mb-1">Expected CSV format:</p>
          {dataType === 'funnel' ? (
            <p className="font-mono">zip_code,date,leads,appointments,sales,revenue</p>
          ) : (
            <p className="font-mono">zip_code,population,household_income,county,state</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

