/**
 * Intelligent model selection based on analysis mode and query characteristics
 */

import type { AnalysisMode, ModelSelection } from '@/types/ai-settings';

/**
 * Analyze query complexity to help with model selection
 */
export function analyzeQueryComplexity(query: string): {
  complexity: 'simple' | 'moderate' | 'complex';
  requiresVision: boolean;
  estimatedTokens: number;
} {
  const lowerQuery = query.toLowerCase();
  
  // Check for image-related keywords
  const visionKeywords = ['image', 'picture', 'photo', 'chart', 'graph', 'diagram', 'screenshot', 'visual'];
  const requiresVision = visionKeywords.some(keyword => lowerQuery.includes(keyword));
  
  // Analyze complexity based on question words and length
  const deepThinkingKeywords = ['why', 'how', 'analyze', 'explain', 'compare', 'evaluate', 'recommend', 'strategy'];
  const hasDeepThinking = deepThinkingKeywords.some(keyword => lowerQuery.includes(keyword));
  
  // Rough token estimation (1 token ≈ 4 characters)
  const estimatedTokens = Math.ceil(query.length / 4);
  
  let complexity: 'simple' | 'moderate' | 'complex' = 'moderate';
  if (query.length < 50 && !hasDeepThinking) {
    complexity = 'simple';
  } else if (query.length > 200 || hasDeepThinking || estimatedTokens > 500) {
    complexity = 'complex';
  }
  
  return {
    complexity,
    requiresVision,
    estimatedTokens,
  };
}

/**
 * Select the appropriate model based on mode and query characteristics
 */
export function selectModel(
  mode: AnalysisMode,
  query: string,
  hasImages: boolean = false,
  complexity?: 'simple' | 'moderate' | 'complex'
): ModelSelection {
  // If images are present, use vision model
  if (hasImages || mode === 'vision') {
    return {
      model: 'gpt-4o',
      maxTokens: 4000,
      temperature: 0.3,
      reasoning: 'auto',
    };
  }

  // Analyze query if complexity not provided
  if (!complexity) {
    const analysis = analyzeQueryComplexity(query);
    complexity = analysis.complexity;
  }

  switch (mode) {
    case 'quick':
      return {
        model: 'gpt-4o-mini',
        maxTokens: 2000,
        temperature: 0.3,
        reasoning: 'fast',
      };

    case 'standard':
      return {
        model: 'gpt-4o',
        maxTokens: 4000,
        temperature: 0.3,
        reasoning: 'auto',
      };

    case 'deep-research':
      return {
        model: 'gpt-4o',
        maxTokens: 8000,
        temperature: 0.2,
        reasoning: 'deep',
      };

    case 'auto':
      // Auto-select based on complexity
      if (complexity === 'simple') {
        return {
          model: 'gpt-4o-mini',
          maxTokens: 2000,
          temperature: 0.3,
          reasoning: 'fast',
        };
      } else if (complexity === 'complex') {
        return {
          model: 'gpt-4o',
          maxTokens: 8000,
          temperature: 0.2,
          reasoning: 'deep',
        };
      } else {
        return {
          model: 'gpt-4o',
          maxTokens: 4000,
          temperature: 0.3,
          reasoning: 'auto',
        };
      }

    case 'vision':
      return {
        model: 'gpt-4o',
        maxTokens: 4000,
        temperature: 0.3,
        reasoning: 'auto',
      };

    default:
      return {
        model: 'gpt-4o',
        maxTokens: 4000,
        temperature: 0.3,
        reasoning: 'auto',
      };
  }
}

/**
 * Estimate cost for a model selection
 */
export function estimateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  // Pricing as of 2024 (approximate, should be updated with actual pricing)
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4o-mini': {
      input: 0.15 / 1_000_000, // $0.15 per 1M input tokens
      output: 0.60 / 1_000_000, // $0.60 per 1M output tokens
    },
    'gpt-4o': {
      input: 2.50 / 1_000_000, // $2.50 per 1M input tokens
      output: 10.00 / 1_000_000, // $10.00 per 1M output tokens
    },
  };

  const modelPricing = pricing[model] || pricing['gpt-4o'];
  const inputCost = promptTokens * modelPricing.input;
  const outputCost = completionTokens * modelPricing.output;
  
  return inputCost + outputCost;
}

