/**
 * API endpoint for uploading documents and images
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { DocumentMetadata } from '@/types/ai-settings';

export const dynamic = 'force-dynamic';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'data', 'ai-reference');
const METADATA_DIR = path.join(process.cwd(), 'data', 'ai-documents');

/**
 * POST - Upload a document or image
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const isGlobal = formData.get('isGlobal') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/png',
      'image/jpeg',
      'image/jpg',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    // Create directories
    const userDir = isGlobal 
      ? path.join(UPLOAD_DIR, 'global')
      : path.join(UPLOAD_DIR, 'users', userId);
    await mkdir(userDir, { recursive: true });
    await mkdir(METADATA_DIR, { recursive: true });

    // Generate unique filename
    const fileId = uuidv4();
    const ext = path.extname(file.name);
    const filename = `${fileId}${ext}`;
    const filePath = path.join(userDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create metadata
    const metadata: DocumentMetadata = {
      id: fileId,
      filename: file.name,
      type: file.type.startsWith('image/') ? 'image' : 'document',
      mimeType: file.type,
      size: file.size,
      uploadedBy: userId,
      uploadedAt: new Date().toISOString(),
      isGlobal,
      processed: false,
    };

    // Save metadata
    const metadataPath = path.join(METADATA_DIR, `${fileId}.json`);
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    // Return file info (relative path for client)
    const relativePath = `/data/ai-reference/${isGlobal ? 'global' : `users/${userId}`}/${filename}`;

    return NextResponse.json({
      success: true,
      document: {
        ...metadata,
        url: relativePath,
      },
    });
  } catch (error: any) {
    console.error('[AI Documents Upload] Error:', error);
    return NextResponse.json(
      { error: 'Failed to upload document', details: error.message },
      { status: 500 }
    );
  }
}

