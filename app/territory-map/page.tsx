'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { BarChart3, MapPin, Download, Database } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import TerritoryMap from '@/components/territory-map/TerritoryMap';
import TerritorySidebar from '@/components/territory-map/TerritorySidebar';
import VisualizationModal from '@/components/territory-map/VisualizationModal';
import DriveTimeModal from '@/components/territory-map/DriveTimeModal';
import ExportModal from '@/components/territory-map/ExportModal';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { loadRepresentatives, loadAffiliatePurchaseZips } from '@/lib/territory-map/dataLoader';
import type { Representative, VisualizationData, VisualizationMetric, ColorScale } from '@/types/territory-map';

export default function TerritoryMapPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
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
  const [showVisualizationModal, setShowVisualizationModal] = useState(false);
  const [showDriveTimeModal, setShowDriveTimeModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [zipFilterMode, setZipFilterMode] = useState<'all' | 'affiliate'>('all');
  const [affiliatePurchaseZips, setAffiliatePurchaseZips] = useState<string[]>([]);
  const [showRepMarkers, setShowRepMarkers] = useState(true);
  const [showAllTerritoryZips, setShowAllTerritoryZips] = useState(true);
  const [showAffiliatePurchaseZipsToggle, setShowAffiliatePurchaseZipsToggle] = useState(false);
  const [showFunnelData, setShowFunnelData] = useState(false);

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
      const [reps, affiliateZips] = await Promise.all([
        loadRepresentatives(),
        loadAffiliatePurchaseZips()
      ]);
      setRepresentatives(reps);
      setAffiliatePurchaseZips(affiliateZips);
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
      <main className="flex flex-col h-full min-h-0">
        {/* Button Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant={visualizationMode === 'data' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowVisualizationModal(true)}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Visualization
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDriveTimeModal(true)}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Drive Time
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportModal(true)}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/territory-map/data-sets')}
            >
              <Database className="h-4 w-4 mr-2" />
              Data Sets
            </Button>
          </div>
          
          {/* Layer Toggles */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border-l border-gray-300 pl-4">
              <span className="text-sm font-medium text-gray-700 mr-2">Layers:</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="show-reps"
                    checked={showRepMarkers}
                    onCheckedChange={(checked) => setShowRepMarkers(checked === true)}
                  />
                  <Label htmlFor="show-reps" className="text-sm text-gray-700 cursor-pointer">
                    Reps
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="show-territory-zips"
                    checked={showAllTerritoryZips && zipFilterMode === 'all'}
                    onCheckedChange={(checked) => {
                      const isChecked = checked === true;
                      setShowAllTerritoryZips(isChecked);
                      if (isChecked) {
                        setZipFilterMode('all');
                        setShowAffiliatePurchaseZipsToggle(false);
                      }
                    }}
                  />
                  <Label htmlFor="show-territory-zips" className="text-sm text-gray-700 cursor-pointer">
                    All Territory Zips
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="show-affiliate-zips"
                    checked={showAffiliatePurchaseZipsToggle && zipFilterMode === 'affiliate'}
                    onCheckedChange={(checked) => {
                      const isChecked = checked === true;
                      setShowAffiliatePurchaseZipsToggle(isChecked);
                      if (isChecked) {
                        setZipFilterMode('affiliate');
                        setShowAllTerritoryZips(false);
                      }
                    }}
                  />
                  <Label htmlFor="show-affiliate-zips" className="text-sm text-gray-700 cursor-pointer">
                    Affiliate Purchase Zips
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="show-funnel-data"
                    checked={showFunnelData}
                    onCheckedChange={(checked) => {
                      setShowFunnelData(checked === true);
                      if (checked) {
                        setVisualizationMode('data');
                      }
                    }}
                  />
                  <Label htmlFor="show-funnel-data" className="text-sm text-gray-700 cursor-pointer">
                    Funnel Data
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Map Area */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          <div className="flex-1 relative h-full w-full min-h-0">
            <TerritoryMap
              onZipCodeSelect={setSelectedZipCode}
              selectedZipCode={selectedZipCode}
              showDriveTime={showDriveTime}
              driveTimeMinutes={driveTimeMinutes}
              driveTimeZipCodes={driveTimeZipCodes}
              showDataVisualization={visualizationMode === 'data' || showFunnelData}
              visualizationData={visualizationData}
              visualizationMetric={visualizationMetric}
              visualizationMin={visualizationMin}
              visualizationMax={visualizationMax}
              visualizationColorScale={visualizationColorScale}
              zipFilterMode={zipFilterMode}
              affiliatePurchaseZips={affiliatePurchaseZips}
              showRepMarkers={showRepMarkers}
              showAllTerritoryZips={showAllTerritoryZips}
              showAffiliatePurchaseZips={showAffiliatePurchaseZipsToggle}
              showFunnelData={showFunnelData}
            />
          </div>

          {/* Right Sidebar - Territories */}
          <TerritorySidebar
            selectedZipCode={selectedZipCode}
            onTerritoryChange={loadData}
          />
        </div>

        {/* Modals */}
        <VisualizationModal
          open={showVisualizationModal}
          onOpenChange={setShowVisualizationModal}
          currentMode={visualizationMode}
          currentMetric={visualizationMetric}
          currentColorScale={visualizationColorScale}
          visualizationData={visualizationData}
          onModeChange={setVisualizationMode}
          onMetricChange={setVisualizationMetric}
          onColorScaleChange={setVisualizationColorScale}
          onDataLoad={loadVisualizationData}
        />

        <DriveTimeModal
          open={showDriveTimeModal}
          onOpenChange={setShowDriveTimeModal}
          representatives={representatives}
          onCalculate={handleDriveTimeCalculate}
          isCalculating={false}
          coveredZipCodes={driveTimeZipCodes}
        />

        <ExportModal
          open={showExportModal}
          onOpenChange={setShowExportModal}
        />
      </main>
    </AppLayout>
  );
}

