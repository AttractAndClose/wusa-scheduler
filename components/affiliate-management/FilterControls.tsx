'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, Calendar, Layers, BarChart3 } from 'lucide-react';
import type { DatePreset, TimeGranularity } from '@/lib/affiliate-analytics';

interface FilterControlsProps {
  datePreset: DatePreset;
  onDatePresetChange: (preset: DatePreset) => void;
  timeGranularity: TimeGranularity;
  onTimeGranularityChange: (granularity: TimeGranularity) => void;
  selectedTerritories: string[];
  availableTerritories: string[];
  onTerritoriesChange: (territories: string[]) => void;
  selectedLeadSources: string[];
  availableLeadSources: string[];
  onLeadSourcesChange: (sources: string[]) => void;
}

export default function FilterControls({
  datePreset,
  onDatePresetChange,
  timeGranularity,
  onTimeGranularityChange,
  selectedTerritories,
  availableTerritories,
  onTerritoriesChange,
  selectedLeadSources,
  availableLeadSources,
  onLeadSourcesChange,
}: FilterControlsProps) {
  const [showTerritoryDropdown, setShowTerritoryDropdown] = useState(false);
  const [showLeadSourceDropdown, setShowLeadSourceDropdown] = useState(false);
  const territoryDropdownRef = useRef<HTMLDivElement>(null);
  const leadSourceDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        territoryDropdownRef.current &&
        !territoryDropdownRef.current.contains(event.target as Node)
      ) {
        setShowTerritoryDropdown(false);
      }
      if (
        leadSourceDropdownRef.current &&
        !leadSourceDropdownRef.current.contains(event.target as Node)
      ) {
        setShowLeadSourceDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleTerritory = (territory: string) => {
    if (selectedTerritories.includes(territory)) {
      onTerritoriesChange(selectedTerritories.filter(t => t !== territory));
    } else {
      onTerritoriesChange([...selectedTerritories, territory]);
    }
  };

  const toggleLeadSource = (source: string) => {
    if (selectedLeadSources.includes(source)) {
      onLeadSourcesChange(selectedLeadSources.filter(s => s !== source));
    } else {
      onLeadSourcesChange([...selectedLeadSources, source]);
    }
  };

  const selectAllTerritories = () => {
    onTerritoriesChange(availableTerritories);
  };

  const clearAllTerritories = () => {
    onTerritoriesChange([]);
  };

  const selectAllLeadSources = () => {
    onLeadSourcesChange(availableLeadSources);
  };

  const clearAllLeadSources = () => {
    onLeadSourcesChange([]);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="h-5 w-5" />
          Filters & Controls
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Preset */}
          <div>
            <label className="text-sm font-medium text-navy mb-2 block flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Range
            </label>
            <Select value={datePreset} onValueChange={(value) => onDatePresetChange(value as DatePreset)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="last7">Last 7 Days</SelectItem>
                <SelectItem value="last30">Last 30 Days</SelectItem>
                <SelectItem value="last90">Last 90 Days</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="thisYear">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Time Granularity */}
          <div>
            <label className="text-sm font-medium text-navy mb-2 block flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Time Granularity
            </label>
            <Select value={timeGranularity} onValueChange={(value) => onTimeGranularityChange(value as TimeGranularity)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Territory Multi-Select */}
          <div className="relative" ref={territoryDropdownRef}>
            <label className="text-sm font-medium text-navy mb-2 block flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Territories
              {selectedTerritories.length > 0 && (
                <span className="text-xs text-gray-500">({selectedTerritories.length} selected)</span>
              )}
            </label>
            <div className="relative">
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => setShowTerritoryDropdown(!showTerritoryDropdown)}
              >
                <span>
                  {selectedTerritories.length === 0
                    ? 'All Territories'
                    : selectedTerritories.length === 1
                    ? selectedTerritories[0]
                    : `${selectedTerritories.length} selected`}
                </span>
              </Button>
              {showTerritoryDropdown && (
                <div className="absolute z-50 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  <div className="p-2 border-b flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAllTerritories}
                      className="text-xs"
                    >
                      Select All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllTerritories}
                      className="text-xs"
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className="p-2 space-y-1">
                    {availableTerritories.map((territory) => (
                      <label
                        key={territory}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer rounded"
                      >
                        <Checkbox
                          checked={selectedTerritories.includes(territory)}
                          onCheckedChange={() => toggleTerritory(territory)}
                        />
                        <span className="text-sm">{territory}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Lead Source Multi-Select */}
          <div className="relative" ref={leadSourceDropdownRef}>
            <label className="text-sm font-medium text-navy mb-2 block flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Lead Sources
              {selectedLeadSources.length > 0 && (
                <span className="text-xs text-gray-500">({selectedLeadSources.length} selected)</span>
              )}
            </label>
            <div className="relative">
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => setShowLeadSourceDropdown(!showLeadSourceDropdown)}
              >
                <span>
                  {selectedLeadSources.length === 0
                    ? 'All Lead Sources'
                    : selectedLeadSources.length === 1
                    ? selectedLeadSources[0]
                    : `${selectedLeadSources.length} selected`}
                </span>
              </Button>
              {showLeadSourceDropdown && (
                <div className="absolute z-50 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  <div className="p-2 border-b flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAllLeadSources}
                      className="text-xs"
                    >
                      Select All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllLeadSources}
                      className="text-xs"
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className="p-2 space-y-1">
                    {availableLeadSources.map((source) => (
                      <label
                        key={source}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer rounded"
                      >
                        <Checkbox
                          checked={selectedLeadSources.includes(source)}
                          onCheckedChange={() => toggleLeadSource(source)}
                        />
                        <span className="text-sm">{source}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

