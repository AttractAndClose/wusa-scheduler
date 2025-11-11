import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { SYSTEM_PROMPT, buildAnalysisPrompt } from '@/lib/ai/prompts';
import { loadAiAnalysisInput } from '@/lib/ai/data';
import { truncateComparisonData, truncateTerritoryMetrics } from '@/lib/ai/format';

export const dynamic = 'force-dynamic';

// Get and validate API key
const getApiKey = () => {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    return null;
  }
  // OpenAI API keys should start with 'sk-' or 'sk-proj-'
  if (!key.startsWith('sk-')) {
    console.warn('[AI Analysis] API key format may be invalid (should start with sk-)');
  }
  return key;
};

const apiKey = getApiKey();
const openai = apiKey ? new OpenAI({
  apiKey: apiKey,
}) : null;

interface AnalysisRequest {
  // Client-provided data (when source='client')
  overallMetrics?: any;
  comparisonData?: any[];
  territoryMetrics?: any[];
  dateRange: { start: string; end: string };
  selectedTerritories: string[];
  selectedLeadSources: string[];
  customPrompt?: string;
  // New fields for server-side data loading
  source?: 'client' | 'server'; // Default: 'server'
  model?: string; // Optional model override (default: 'gpt-4o-mini')
  maxLeadSources?: number; // Limit lead sources in comparison
  maxTerritories?: number; // Limit territories in comparison
}

export async function POST(request: NextRequest) {
  console.log('[AI Analysis] Request received');
  try {
    // Check if API key is configured
    if (!apiKey) {
      console.error('[AI Analysis] OpenAI API key not configured');
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file.' },
        { status: 500 }
      );
    }
    
    console.log('[AI Analysis] API key found', { keyPrefix: apiKey.substring(0, 7) + '...' });
    console.log('[AI Analysis] Parsing request body...');

    let body: AnalysisRequest;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid request body. Expected JSON.' },
        { status: 400 }
      );
    }

    const {
      dateRange,
      selectedTerritories,
      selectedLeadSources,
      customPrompt,
      source = 'server', // Default to server-side data loading
      model = 'gpt-4o-mini',
      maxLeadSources,
      maxTerritories,
    } = body;

    // Load data based on source
    let analysisData: {
      overallMetrics: any;
      comparisonData: any[];
      territoryMetrics: any[];
      dateRange: { start: string; end: string };
      selectedTerritories: string[];
      selectedLeadSources: string[];
    };

    if (source === 'server') {
      // Load data server-side from files
      console.log('[AI Analysis] Loading data server-side...');
      try {
        const loadedData = await loadAiAnalysisInput({
          dateRange,
          selectedTerritories,
          selectedLeadSources,
          maxLeadSources: maxLeadSources || 20, // Default limit
          maxTerritories: maxTerritories || 20, // Default limit
        });
        analysisData = loadedData;
      } catch (dataError: any) {
        console.error('[AI Analysis] Error loading server-side data:', dataError);
        return NextResponse.json(
          {
            error: 'Failed to load data',
            details: dataError.message || 'Error loading data from files',
          },
          { status: 500 }
        );
      }
    } else {
      // Use client-provided data
      console.log('[AI Analysis] Using client-provided data...');
      if (!body.overallMetrics) {
        return NextResponse.json(
          { error: 'Client-provided data requires overallMetrics' },
          { status: 400 }
        );
      }

      let comparisonData = body.comparisonData || [];
      let territoryMetrics = body.territoryMetrics || [];

      // Apply truncation if limits are specified
      if (maxLeadSources && maxLeadSources > 0) {
        comparisonData = truncateComparisonData(comparisonData, maxLeadSources);
      }
      if (maxTerritories && maxTerritories > 0) {
        territoryMetrics = truncateTerritoryMetrics(territoryMetrics, maxTerritories);
      }

      analysisData = {
        overallMetrics: body.overallMetrics,
        comparisonData,
        territoryMetrics,
        dateRange,
        selectedTerritories,
        selectedLeadSources,
      };
    }

    console.log('[AI Analysis] Data prepared', {
      source,
      totalLeads: analysisData.overallMetrics.totalLeads,
      comparisonDataCount: analysisData.comparisonData.length,
      territoryMetricsCount: analysisData.territoryMetrics.length,
      hasCustomPrompt: !!customPrompt,
    });

    // Build comprehensive prompt with all metrics
    let basePrompt: string;
    try {
      basePrompt = buildAnalysisPrompt(analysisData);
      console.log('[AI Analysis] Prompt built successfully', { promptLength: basePrompt.length });
    } catch (promptError: any) {
      console.error('[AI Analysis] Error building prompt:', promptError);
      return NextResponse.json(
        { 
          error: 'Failed to build analysis prompt',
          details: promptError.message || 'Error processing metrics data'
        },
        { status: 500 }
      );
    }

    // Use custom prompt if provided, otherwise use default analysis request
    const prompt = customPrompt 
      ? `${basePrompt}\n\n## User Question\n${customPrompt}\n\nPlease answer the user's question based on the data provided above. Verify all numbers before stating them.`
      : basePrompt;

    // Log token usage estimate (rough: ~4 chars per token)
    const estimatedTokens = Math.ceil(prompt.length / 4);
    if (estimatedTokens > 100000) {
      console.warn('[AI Analysis] Large prompt detected', { estimatedTokens, promptLength: prompt.length });
    }

    console.log('[AI Analysis] Calling OpenAI API...', {
      model,
      promptLength: prompt.length,
      estimatedTokens,
      hasCustomPrompt: !!customPrompt,
    });

    // Call OpenAI API with timeout
    if (!openai) {
      throw new Error('OpenAI client not initialized');
    }
    
    const startTime = Date.now();
    let completion;
    try {
      completion = await Promise.race([
        openai.chat.completions.create({
          model,
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.3, // Lower temperature for more consistent, accurate responses
          max_tokens: 1600, // Reduced from 2000 for more concise responses
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('OpenAI API call timed out after 90 seconds')), 90000)
        )
      ]) as any;
      
      const duration = Date.now() - startTime;
      console.log('[AI Analysis] OpenAI API call completed', { 
        duration: `${duration}ms`,
        model: completion.model,
        usage: completion.usage,
      });
    } catch (apiError: any) {
      const duration = Date.now() - startTime;
      console.error('[AI Analysis] OpenAI API call failed', { 
        duration: `${duration}ms`, 
        error: apiError.message,
        status: apiError?.status 
      });
      throw apiError;
    }

    const analysis = completion.choices[0]?.message?.content || 'No analysis available';

    return NextResponse.json({ 
      success: true, 
      analysis,
      model: completion.model,
      usage: completion.usage,
      promptLength: prompt.length,
      estimatedTokens,
    });
  } catch (error: any) {
    console.error('[AI Analysis] Error:', error);
    console.error('[AI Analysis] Error stack:', error.stack);
    
    // Handle specific OpenAI API errors
    if (error?.status === 401 || error?.message?.includes('401') || error?.message?.toLowerCase().includes('unauthorized')) {
      return NextResponse.json(
        { 
          error: 'Invalid OpenAI API key. Please check your OPENAI_API_KEY environment variable.',
          details: 'The API key may be incorrect, expired, or have extra spaces. Make sure it starts with "sk-" and has no quotes or extra whitespace.',
          help: 'Get a new key at https://platform.openai.com/api-keys'
        },
        { status: 401 }
      );
    }
    
    if (error?.status === 429) {
      const retryAfter = error?.headers?.['retry-after'] || error?.response?.headers?.['retry-after'];
      return NextResponse.json(
        { 
          error: 'OpenAI API rate limit exceeded. Please try again later.',
          details: error.message,
          retryAfter: retryAfter ? parseInt(retryAfter) : undefined,
        },
        { status: 429 }
      );
    }

    // Return more detailed error information
    const errorMessage = error?.message || 'An unexpected error occurred';
    const errorDetails = error?.details || error?.error?.message || errorMessage;
    
    return NextResponse.json(
      { 
        error: 'Failed to generate analysis',
        details: errorDetails,
        type: error?.name || 'UnknownError'
      },
      { status: 500 }
    );
  }
}


