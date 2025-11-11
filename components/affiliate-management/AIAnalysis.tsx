'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import type { AggregatedMetrics, ComparisonData, TerritoryMetrics } from '@/lib/affiliate-analytics';

interface AIAnalysisProps {
  overallMetrics: AggregatedMetrics;
  comparisonData: ComparisonData[];
  territoryMetrics: TerritoryMetrics[];
  dateRange: { start: string; end: string };
  selectedTerritories: string[];
  selectedLeadSources: string[];
}

export default function AIAnalysis({
  overallMetrics,
  comparisonData,
  territoryMetrics,
  dateRange,
  selectedTerritories,
  selectedLeadSources,
}: AIAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch('/api/affiliate-management/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          overallMetrics,
          comparisonData,
          territoryMetrics,
          dateRange,
          selectedTerritories,
          selectedLeadSources,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate analysis');
      }

      setAnalysis(data.analysis);
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating analysis');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            AI Performance Analysis
          </CardTitle>
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Analyze with AI
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-semibold">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {analysis && (
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border">
              {analysis.split('\n').map((line, index) => {
                // Simple markdown rendering
                if (line.startsWith('### ')) {
                  return (
                    <h3 key={index} className="text-lg font-semibold text-navy mt-4 mb-2">
                      {line.replace('### ', '')}
                    </h3>
                  );
                }
                if (line.startsWith('## ')) {
                  return (
                    <h2 key={index} className="text-xl font-bold text-navy mt-6 mb-3">
                      {line.replace('## ', '')}
                    </h2>
                  );
                }
                if (line.startsWith('# ')) {
                  return (
                    <h1 key={index} className="text-2xl font-bold text-navy mt-6 mb-4">
                      {line.replace('# ', '')}
                    </h1>
                  );
                }
                if (line.startsWith('- ')) {
                  return (
                    <li key={index} className="ml-4 mb-1">
                      {line.replace('- ', '')}
                    </li>
                  );
                }
                if (line.trim() === '') {
                  return <br key={index} />;
                }
                return (
                  <p key={index} className="mb-2">
                    {line}
                  </p>
                );
              })}
            </div>
          </div>
        )}

        {!analysis && !error && !isAnalyzing && (
          <div className="text-center py-8 text-gray-500">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="font-medium mb-2">Get AI-Powered Insights</p>
            <p className="text-sm">Click &quot;Analyze with AI&quot; to receive intelligent recommendations for optimizing your affiliate program</p>
            <p className="text-xs mt-2 text-gray-400">Analysis includes optimization strategies, budget recommendations, and performance insights</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

