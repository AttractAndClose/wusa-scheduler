/**
 * Enhanced AI Analysis API endpoint
 * Supports model selection, document processing, RAG, and external integrations
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import OpenAI from 'openai';
import { SYSTEM_PROMPT, buildAnalysisPrompt } from '@/lib/ai/prompts';
import { loadAiAnalysisInput } from '@/lib/ai/data';
import { selectModel, analyzeQueryComplexity } from '@/lib/ai/model-selector';
import { buildRAGPrompt } from '@/lib/ai/rag';
import { getMergedSettings } from '@/lib/ai/settings';
import type { AnalysisRequest, AnalysisMode } from '@/types/ai-settings';

export const dynamic = 'force-dynamic';

// Get and validate API key
const getApiKey = () => {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    return null;
  }
  if (!key.startsWith('sk-')) {
    console.warn('[AI Analysis] API key format may be invalid (should start with sk-)');
  }
  return key;
};

const apiKey = getApiKey();
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export async function POST(request: NextRequest) {
  console.log('[AI Analysis] Enhanced request received');
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!apiKey || !openai) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const body: AnalysisRequest = await request.json();
    const {
      prompt,
      mode = 'standard',
      attachments = [],
      dateRange,
      selectedTerritories = [],
      selectedLeadSources = [],
      useConnections = [],
      useReferenceFiles = true,
    } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Get user settings
    const settings = await getMergedSettings(userId);
    const effectiveMode = mode === 'auto' ? settings.defaultAnalysisMode : mode;

    // Check for images in attachments
    const hasImages = attachments.some(att => att.type === 'image');

    // Analyze query complexity for auto mode
    let complexity: 'simple' | 'moderate' | 'complex' | undefined;
    if (effectiveMode === 'auto') {
      const analysis = analyzeQueryComplexity(prompt);
      complexity = analysis.complexity;
    }

    // Select model
    const modelSelection = selectModel(effectiveMode as AnalysisMode, prompt, hasImages, complexity);

    console.log('[AI Analysis] Model selected', {
      mode: effectiveMode,
      model: modelSelection.model,
      maxTokens: modelSelection.maxTokens,
    });

    // Build base prompt with data
    let basePrompt = '';
    if (dateRange) {
      // Load affiliate data if date range provided
      const analysisData = await loadAiAnalysisInput({
        dateRange,
        selectedTerritories,
        selectedLeadSources,
        maxLeadSources: 20,
        maxTerritories: 20,
      });
      basePrompt = buildAnalysisPrompt(analysisData);
    } else {
      basePrompt = 'You are analyzing business data.';
    }

    // Add RAG context if enabled
    let finalPrompt = basePrompt;
    if (useReferenceFiles) {
      finalPrompt = await buildRAGPrompt(basePrompt, prompt, userId);
    } else {
      finalPrompt = `${basePrompt}\n\n## User Question\n${prompt}`;
    }

    // Prepare messages with images if present
    const messages: any[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPT + (settings.systemInstructions ? `\n\nAdditional instructions: ${settings.systemInstructions}` : ''),
      },
    ];

    // Handle image attachments
    if (hasImages) {
      const imageAttachments = attachments.filter(att => att.type === 'image');
      const content: any[] = [
        { type: 'text', text: finalPrompt },
      ];

      // Add images (would need to fetch and convert to base64)
      // For now, just include image URLs in text
      if (imageAttachments.length > 0) {
        content.push({
          type: 'text',
          text: `\n\nAttached images: ${imageAttachments.map(img => img.name).join(', ')}`,
        });
      }

      messages.push({
        role: 'user',
        content,
      });
    } else {
      messages.push({
        role: 'user',
        content: finalPrompt,
      });
    }

    // Call OpenAI API
    const startTime = Date.now();
    const completion = await Promise.race([
      openai.chat.completions.create({
        model: modelSelection.model,
        messages,
        temperature: modelSelection.temperature,
        max_tokens: modelSelection.maxTokens,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out after 120 seconds')), 120000)
      ),
    ]) as any;

    const duration = Date.now() - startTime;
    const analysis = completion.choices[0]?.message?.content || 'No analysis available';

    console.log('[AI Analysis] Analysis completed', {
      duration: `${duration}ms`,
      model: completion.model,
      usage: completion.usage,
    });

    return NextResponse.json({
      success: true,
      analysis,
      model: completion.model,
      usage: completion.usage,
      modelSelection,
      duration,
    });
  } catch (error: any) {
    console.error('[AI Analysis] Error:', error);
    
    if (error?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key' },
        { status: 401 }
      );
    }
    
    if (error?.status === 429) {
      return NextResponse.json(
        { error: 'OpenAI API rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to generate analysis',
        details: error.message || 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

