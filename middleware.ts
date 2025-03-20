import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Simply pass through all requests - authentication will be handled client-side
  return NextResponse.next();
}

// Configure paths that middleware will run on (but we're not actually doing any checks)
export const config = {
  matcher: []
}; 