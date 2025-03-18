import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file: File | null = formData.get('logo') as unknown as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create directory if it doesn't exist
    const publicDir = path.join(process.cwd(), 'public');
    const imagesDir = path.join(publicDir, 'images');
    
    if (!existsSync(imagesDir)) {
      await mkdir(imagesDir, { recursive: true });
    }

    const filePath = path.join(imagesDir, 'logo.png');
    await writeFile(filePath, buffer);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error uploading logo:', error);
    return NextResponse.json(
      { error: 'Failed to upload logo' },
      { status: 500 }
    );
  }
} 