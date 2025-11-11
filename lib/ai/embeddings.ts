/**
 * Embedding generation for RAG system
 * Uses OpenAI embeddings API
 */

import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export interface EmbeddingChunk {
  id: string;
  text: string;
  embedding: number[];
  metadata: {
    source: string;
    chunkIndex: number;
    documentId: string;
    uploadedBy: string;
    uploadedAt: string;
  };
}

// In-memory storage for MVP (should migrate to vector DB in production)
const embeddingStore = new Map<string, EmbeddingChunk[]>();

/**
 * Generate embeddings for text chunks
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
    });

    return response.data.map(item => item.embedding);
  } catch (error) {
    console.error('[Embeddings] Error generating embeddings:', error);
    throw error;
  }
}

/**
 * Store embeddings for a document
 */
export function storeEmbeddings(documentId: string, chunks: EmbeddingChunk[]): void {
  embeddingStore.set(documentId, chunks);
}

/**
 * Get embeddings for a document
 */
export function getEmbeddings(documentId: string): EmbeddingChunk[] | undefined {
  return embeddingStore.get(documentId);
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Search for similar chunks
 */
export async function searchSimilarChunks(
  query: string,
  topK: number = 5,
  documentIds?: string[]
): Promise<EmbeddingChunk[]> {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  // Generate embedding for query
  const queryEmbeddings = await generateEmbeddings([query]);
  const queryEmbedding = queryEmbeddings[0];

  // Search through all stored embeddings
  const results: Array<{ chunk: EmbeddingChunk; similarity: number }> = [];

  const searchDocuments = documentIds || Array.from(embeddingStore.keys());

  for (const docId of searchDocuments) {
    const chunks = embeddingStore.get(docId);
    if (!chunks) continue;

    for (const chunk of chunks) {
      const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
      results.push({ chunk, similarity });
    }
  }

  // Sort by similarity and return top K
  results.sort((a, b) => b.similarity - a.similarity);
  return results.slice(0, topK).map(r => r.chunk);
}

