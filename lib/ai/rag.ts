/**
 * Retrieval Augmented Generation (RAG) system
 * Combines document search with AI context
 */

import { searchSimilarChunks, type EmbeddingChunk } from './embeddings';
import { getMergedSettings } from './settings';
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * Retrieve relevant context from documents based on query
 */
export async function retrieveContext(
  query: string,
  userId: string,
  topK: number = 5
): Promise<Array<{ text: string; source: string; similarity: number }>> {
  try {
    // Get user's reference files
    const settings = await getMergedSettings(userId);
    const referenceFiles = settings.referenceFiles;

    if (referenceFiles.length === 0) {
      return [];
    }

    // Search for similar chunks
    const chunks = await searchSimilarChunks(query, topK);

    // Format results
    return chunks.map(chunk => ({
      text: chunk.text,
      source: chunk.metadata.source,
      similarity: 0, // Will be calculated in searchSimilarChunks
    }));
  } catch (error) {
    console.error('[RAG] Error retrieving context:', error);
    return [];
  }
}

/**
 * Build RAG-enhanced prompt
 */
export async function buildRAGPrompt(
  basePrompt: string,
  query: string,
  userId: string
): Promise<string> {
  const context = await retrieveContext(query, userId);

  if (context.length === 0) {
    return basePrompt;
  }

  // Add context section to prompt
  let ragPrompt = basePrompt + '\n\n## Reference Documents\n';
  ragPrompt += 'The following information from reference documents may be relevant:\n\n';

  context.forEach((item, index) => {
    ragPrompt += `### Reference ${index + 1} (Source: ${item.source})\n`;
    ragPrompt += `${item.text}\n\n`;
  });

  ragPrompt += '\n## User Question\n';
  ragPrompt += `${query}\n\n`;
  ragPrompt += 'Please answer the user\'s question using the provided data and reference documents. ';
  ragPrompt += 'Cite sources when using information from reference documents.';

  return ragPrompt;
}

