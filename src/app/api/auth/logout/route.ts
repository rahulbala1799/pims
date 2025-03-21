import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Prevent static generation for this route
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;


export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    
    // Clear both admin and employee cookies for simplicity
    cookieStore.delete('admin_auth');
    cookieStore.delete('employee_auth');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    );
  }
} 