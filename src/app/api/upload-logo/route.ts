import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    console.log('Logo upload API called');
    const formData = await request.formData();
    const file: File | null = formData.get('logo') as unknown as File;

    if (!file) {
      console.log('No file uploaded');
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Log for debugging
    console.log('File received:', file.name, 'Size:', file.size, 'bytes');
    
    // Determine the correct path - use absolute path from project root
    // This is important because Next.js API routes execute from a different directory context
    let basePath;
    if (process.env.NODE_ENV === 'development') {
      basePath = process.cwd(); // Get current working directory
      console.log('Development mode, using path:', basePath);
    } else {
      basePath = path.join(process.cwd(), 'public');
      console.log('Production mode, using path:', basePath);
    }
    
    // Create the images directory within public
    const imagesDir = path.join(basePath, 'public', 'images');
    console.log('Creating directory (if needed):', imagesDir);
    
    if (!existsSync(imagesDir)) {
      try {
        await mkdir(imagesDir, { recursive: true });
        console.log('Directory created:', imagesDir);
      } catch (dirError) {
        console.error('Error creating directory:', dirError);
        return NextResponse.json(
          { error: 'Failed to create directory for logo' },
          { status: 500 }
        );
      }
    }

    // Save the file
    const filePath = path.join(imagesDir, 'logo.png');
    console.log('Saving file to:', filePath);
    
    try {
      await writeFile(filePath, buffer);
      console.log('File saved successfully');
      
      // Also save a copy with a timestamp to avoid caching issues
      const timestampedPath = path.join(imagesDir, `logo-${Date.now()}.png`);
      await writeFile(timestampedPath, buffer);
      console.log('Timestamped copy saved to:', timestampedPath);
      
      return NextResponse.json({ 
        success: true,
        message: 'Logo uploaded successfully',
        path: '/images/logo.png'
      });
    } catch (writeError) {
      console.error('Error writing file:', writeError);
      return NextResponse.json(
        { error: 'Failed to write logo file' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error uploading logo:', error);
    return NextResponse.json(
      { error: 'Failed to upload logo' },
      { status: 500 }
    );
  }
} 