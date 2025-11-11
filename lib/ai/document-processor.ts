/**
 * Document processing utilities for extracting text from various file formats
 */

import fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

/**
 * Extract text from PDF file
 */
export async function extractTextFromPDF(filePath: string): Promise<string> {
  // For MVP, we'll use a simple approach
  // In production, use pdf-parse or similar library
  try {
    // Basic implementation - would need pdf-parse library
    // For now, return placeholder
    throw new Error('PDF parsing not yet implemented. Please install pdf-parse package.');
  } catch (error) {
    console.error('[Document Processor] Error extracting PDF:', error);
    throw error;
  }
}

/**
 * Extract text from DOCX file
 */
export async function extractTextFromDOCX(filePath: string): Promise<string> {
  // For MVP, we'll use a simple approach
  // In production, use mammoth or similar library
  try {
    // Basic implementation - would need mammoth library
    // For now, return placeholder
    throw new Error('DOCX parsing not yet implemented. Please install mammoth package.');
  } catch (error) {
    console.error('[Document Processor] Error extracting DOCX:', error);
    throw error;
  }
}

/**
 * Extract text from TXT file
 */
export async function extractTextFromTXT(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return content;
  } catch (error) {
    console.error('[Document Processor] Error extracting TXT:', error);
    throw error;
  }
}

/**
 * Extract text from image using OpenAI Vision API
 */
export async function extractTextFromImage(imagePath: string): Promise<string> {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    // Read image as base64
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all text from this image. If there are charts, graphs, or tables, describe them in detail.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('[Document Processor] Error extracting image text:', error);
    throw error;
  }
}

/**
 * Process a document and extract text
 */
export async function processDocument(filePath: string, mimeType: string): Promise<string> {
  if (mimeType.startsWith('image/')) {
    return extractTextFromImage(filePath);
  } else if (mimeType === 'application/pdf') {
    return extractTextFromPDF(filePath);
  } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return extractTextFromDOCX(filePath);
  } else if (mimeType === 'text/plain') {
    return extractTextFromTXT(filePath);
  } else {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }
}

/**
 * Chunk text into smaller pieces for embedding
 */
export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start = end - overlap;
  }

  return chunks;
}

