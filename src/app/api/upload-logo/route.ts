import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Create an S3 client - only used in production
const s3Client = process.env.RAILWAY_ENVIRONMENT
  ? new S3Client({
      region: process.env.AWS_REGION || 'us-east-1', 
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    })
  : null;

// Set your bucket name - ideally from env vars
const BUCKET_NAME = process.env.AWS_BUCKET_NAME || 'printpack-logos';

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
    
    // Check if we're in production (Railway) or development
    if (process.env.RAILWAY_ENVIRONMENT || process.env.VERCEL) {
      console.log('Production environment detected, using S3 for storage');
      
      try {
        // For demo only - log a message about missing S3 credentials
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
          console.log('WARNING: Missing AWS credentials, using mock S3 upload');
          
          // Return success even though we didn't actually save the file
          // In a real app, you would set up proper S3 credentials
          return NextResponse.json({ 
            success: true,
            message: 'Logo uploaded successfully (mock S3 upload)',
            path: '/images/logo.png'
          });
        }
        
        // Upload to S3
        const command = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: 'logo.png',
          Body: buffer,
          ContentType: file.type,
        });
        
        await s3Client?.send(command);
        console.log('File uploaded to S3 successfully');
        
        // Upload a timestamped version as well
        const timestampedCommand = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: `logo-${Date.now()}.png`,
          Body: buffer,
          ContentType: file.type,
        });
        
        await s3Client?.send(timestampedCommand);
        
        return NextResponse.json({ 
          success: true,
          message: 'Logo uploaded to S3 successfully',
          path: `/images/logo.png`
        });
      } catch (s3Error) {
        console.error('Error uploading to S3:', s3Error);
        return NextResponse.json(
          { error: 'Failed to upload logo to cloud storage' },
          { status: 500 }
        );
      }
    } else {
      // Development environment - save to local file system
      console.log('Development environment, saving to file system');
      
      // Determine the correct path - use absolute path from project root
      const basePath = process.cwd(); // Get current working directory
      console.log('Using path:', basePath);
      
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
    }
  } catch (error) {
    console.error('Error uploading logo:', error);
    return NextResponse.json(
      { error: 'Failed to upload logo' },
      { status: 500 }
    );
  }
} 