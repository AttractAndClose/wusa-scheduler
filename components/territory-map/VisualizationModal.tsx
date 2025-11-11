'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Layers, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { VisualizationMetric, ColorScale, VisualizationData } from '@/types/territory-map';

interface VisualizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMode: 'territory' | 'data';
  currentMetric: VisualizationMetric;
  currentColorScale: ColorScale;
  visualizationData: VisualizationData[];
  onModeChange: (mode: 'territory' | 'data') => void;
  onMetricChange: (metric: VisualizationMetric) => void;
  onColorScaleChange: (scale: ColorScale) => void;
  onDataLoad?: () => void;
}

export default function VisualizationModal({
  open,
  onOpenChange,
  currentMode,
  currentMetric,
  currentColorScale,
  visualizationData,
  onModeChange,
  onMetricChange,
  onColorScaleChange,
  onDataLoad
}: VisualizationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Visualization Settings
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-navy mb-2 block">View Mode</label>
            <div className="flex gap-2">
              <Button
                variant={currentMode === 'territory' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onModeChange('territory')}
                className="flex-1"
              >
                <Layers className="h-4 w-4 mr-1" />
                Territories
              </Button>
              <Button
                variant={currentMode === 'data' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onModeChange('data')}
                className="flex-1"
                disabled={visualizationData.length === 0}
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                Data
              </Button>
            </div>
          </div>
          {currentMode === 'data' && (
            <>
              <div>
                <label className="text-sm font-medium text-navy mb-2 block">Metric</label>
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
                <label className="text-sm font-medium text-navy mb-2 block">Color Scale</label>
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
                <div className="text-sm text-gray-500 pt-2 border-t">
                  <p>No data available. Upload data to visualize.</p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


