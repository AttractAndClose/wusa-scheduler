'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { VisualizationMetric, ColorScale, VisualizationData } from '@/types/territory-map';

interface VisualizationControlsProps {
  onModeChange: (mode: 'territory' | 'data') => void;
  onMetricChange: (metric: VisualizationMetric) => void;
  onColorScaleChange: (scale: ColorScale) => void;
  currentMode: 'territory' | 'data';
  currentMetric: VisualizationMetric;
  currentColorScale: ColorScale;
  visualizationData: VisualizationData[];
  onDataLoad?: () => void;
}

export default function VisualizationControls({
  onModeChange,
  onMetricChange,
  onColorScaleChange,
  currentMode,
  currentMetric,
  currentColorScale,
  visualizationData,
  onDataLoad
}: VisualizationControlsProps) {
  const [minValue, setMinValue] = useState(0);
  const [maxValue, setMaxValue] = useState(100);

  useEffect(() => {
    if (visualizationData.length > 0) {
      const values = visualizationData.map(d => d.value);
      setMinValue(Math.min(...values));
      setMaxValue(Math.max(...values));
    }
  }, [visualizationData]);

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Visualization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-xs text-gray-600 mb-1 block">View Mode</label>
          <div className="flex gap-2">
            <Button
              variant={currentMode === 'territory' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onModeChange('territory')}
              className="flex-1"
            >
              <Layers className="h-3 w-3 mr-1" />
              Territories
            </Button>
            <Button
              variant={currentMode === 'data' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onModeChange('data')}
              className="flex-1"
              disabled={visualizationData.length === 0}
            >
              <BarChart3 className="h-3 w-3 mr-1" />
              Data
            </Button>
          </div>
        </div>
        {currentMode === 'data' && (
          <>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Metric</label>
              <Select value={currentMetric} onValueChange={(value) => onMetricChange(value as VisualizationMetric)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leads">Leads</SelectItem>
                  <SelectItem value="appointments">Appointments</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="population">Population</SelectItem>
                  <SelectItem value="householdIncome">Household Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Color Scale</label>
              <Select value={currentColorScale} onValueChange={(value) => onColorScaleChange(value as ColorScale)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sequential">Sequential</SelectItem>
                  <SelectItem value="diverging">Diverging</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {visualizationData.length === 0 && (
              <div className="text-xs text-gray-500 pt-2 border-t">
                <p>No data available. Upload data to visualize.</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}


