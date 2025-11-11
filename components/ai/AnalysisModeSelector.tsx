'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, Brain, Search, Eye, Sparkles } from 'lucide-react';
import type { AnalysisMode } from '@/types/ai-settings';

interface AnalysisModeSelectorProps {
  value: AnalysisMode;
  onChange: (mode: AnalysisMode) => void;
  className?: string;
}

interface ModeInfo {
  label: string;
  description: string;
  icon: React.ReactNode;
  estimatedCost: string;
  estimatedTime: string;
}

const MODE_INFO: Record<AnalysisMode, ModeInfo> = {
  quick: {
    label: 'Quick Analysis',
    description: 'Fast, cost-effective responses for simple questions',
    icon: <Zap className="h-4 w-4" />,
    estimatedCost: '$0.01-0.05',
    estimatedTime: '2-5 seconds',
  },
  standard: {
    label: 'Standard Analysis',
    description: 'Balanced performance for most analysis tasks',
    icon: <Brain className="h-4 w-4" />,
    estimatedCost: '$0.05-0.15',
    estimatedTime: '5-10 seconds',
  },
  'deep-research': {
    label: 'Deep Research',
    description: 'Comprehensive analysis with extensive reasoning',
    icon: <Search className="h-4 w-4" />,
    estimatedCost: '$0.15-0.50',
    estimatedTime: '15-30 seconds',
  },
  vision: {
    label: 'Vision Analysis',
    description: 'Analyze images, charts, and visual content',
    icon: <Eye className="h-4 w-4" />,
    estimatedCost: '$0.10-0.30',
    estimatedTime: '10-20 seconds',
  },
  auto: {
    label: 'Auto Select',
    description: 'AI chooses the best model based on your query',
    icon: <Sparkles className="h-4 w-4" />,
    estimatedCost: 'Variable',
    estimatedTime: 'Variable',
  },
};

export function AnalysisModeSelector({ value, onChange, className }: AnalysisModeSelectorProps) {
  const currentMode = MODE_INFO[value];

  return (
    <div className={className}>
      <label className="text-sm font-medium text-gray-700 mb-2 block">
        Analysis Mode
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <div className="flex items-center gap-2">
            {currentMode.icon}
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(MODE_INFO).map(([mode, info]) => (
            <SelectItem key={mode} value={mode}>
              <div className="flex items-center gap-2">
                {info.icon}
                <div>
                  <div className="font-medium">{info.label}</div>
                  <div className="text-xs text-gray-500">{info.description}</div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value !== 'auto' && (
        <div className="mt-2 text-xs text-gray-500 flex items-center gap-4">
          <span>Est. cost: {currentMode.estimatedCost}</span>
          <span>Est. time: {currentMode.estimatedTime}</span>
        </div>
      )}
    </div>
  );
}

