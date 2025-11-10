'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { AppLayout } from '@/components/layout/AppLayout';
import TerritoryMap from '@/components/territory-map/TerritoryMap';
import TerritorySidebar from '@/components/territory-map/TerritorySidebar';
import DriveTimeLayer from '@/components/territory-map/DriveTimeLayer';
import DataUpload from '@/components/territory-map/DataUpload';
import VisualizationControls from '@/components/territory-map/VisualizationControls';
import ExportButton from '@/components/territory-map/ExportButton';
import { loadRepresentatives } from '@/lib/territory-map/dataLoader';
import type { Representative, VisualizationData, VisualizationMetric, ColorScale } from '@/types/territory-map';

export const dynamic = 'force-dynamic';

export default function TerritoryMapPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [selectedZipCode, setSelectedZipCode] = useState<string | null>(null);
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [showDriveTime, setShowDriveTime] = useState(false);
  const [driveTimeMinutes, setDriveTimeMinutes] = useState(30);
  const [driveTimeZipCodes, setDriveTimeZipCodes] = useState<string[]>([]);
  const [visualizationMode, setVisualizationMode] = useState<'territory' | 'data'>('territory');
  const [visualizationMetric, setVisualizationMetric] = useState<VisualizationMetric>('leads');
  const [visualizationColorScale, setVisualizationColorScale] = useState<ColorScale>('sequential');
  const [visualizationData, setVisualizationData] = useState<VisualizationData[]>([]);
  const [visualizationMin, setVisualizationMin] = useState(0);
  const [visualizationMax, setVisualizationMax] = useState(100);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      window.location.href = '/sign-in';
    }
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (visualizationMode === 'data') {
      loadVisualizationData();
    }
  }, [visualizationMode, visualizationMetric]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const reps = await loadRepresentatives();
      setRepresentatives(reps);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadVisualizationData = async () => {
    try {
      const response = await fetch(`/api/territory-map/data/visualization?metric=${visualizationMetric}`);
      if (response.ok) {
        const data: VisualizationData[] = await response.json();
        setVisualizationData(data);
        if (data.length > 0) {
          const values = data.map(d => d.value);
          setVisualizationMin(Math.min(...values));
          setVisualizationMax(Math.max(...values));
        }
      }
    } catch (error) {
      console.error('Error loading visualization data:', error);
    }
  };

  const handleDriveTimeCalculate = (minutes: number, coveredZipCodes: string[]) => {
    setDriveTimeMinutes(minutes);
    setDriveTimeZipCodes(coveredZipCodes);
    setShowDriveTime(true);
  };

  const handleUploadComplete = () => {
    if (visualizationMode === 'data') {
      loadVisualizationData();
    }
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
      <main className="flex h-[calc(100vh-4rem)]">
        {/* Left Sidebar - Controls */}
        <div className="w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto p-4">
          <h1 className="text-2xl font-bold text-navy mb-4">Territory Map</h1>
          
          <DataUpload onUploadComplete={handleUploadComplete} />
          
          <VisualizationControls
            onModeChange={setVisualizationMode}
            onMetricChange={setVisualizationMetric}
            onColorScaleChange={setVisualizationColorScale}
            currentMode={visualizationMode}
            currentMetric={visualizationMetric}
            currentColorScale={visualizationColorScale}
            visualizationData={visualizationData}
            onDataLoad={loadVisualizationData}
          />
          
          <DriveTimeLayer
            representatives={representatives}
            onCalculate={handleDriveTimeCalculate}
            isCalculating={false}
            coveredZipCodes={driveTimeZipCodes}
          />
          
          <ExportButton />
        </div>

        {/* Main Map Area */}
        <div className="flex-1 flex">
          <div className="flex-1 relative">
            <TerritoryMap
              onZipCodeSelect={setSelectedZipCode}
              selectedZipCode={selectedZipCode}
              showDriveTime={showDriveTime}
              driveTimeMinutes={driveTimeMinutes}
              driveTimeZipCodes={driveTimeZipCodes}
              showDataVisualization={visualizationMode === 'data'}
              visualizationData={visualizationData}
              visualizationMetric={visualizationMetric}
              visualizationMin={visualizationMin}
              visualizationMax={visualizationMax}
              visualizationColorScale={visualizationColorScale}
            />
          </div>

          {/* Right Sidebar - Territories */}
          <TerritorySidebar
            selectedZipCode={selectedZipCode}
            onTerritoryChange={loadData}
          />
        </div>
      </main>
    </AppLayout>
  );
}

