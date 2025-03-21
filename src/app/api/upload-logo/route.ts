import { NextRequest, NextResponse } from 'next/server';

// Prevent static generation for this route
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;


export async function POST(request: NextRequest) {
  try {
    // Simplified API that doesn't actually save a file
    // but returns a success message
    
    console.log('Logo upload API called - simplified version');
    
    return NextResponse.json({ 
      success: true,
      message: 'Logo upload functionality is temporarily disabled.'
    });
  } catch (error) {
    console.error('Error in logo upload API:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
} 