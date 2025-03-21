import { NextResponse } from 'next/server';

// Prevent static generation for this route
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;


export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
} 