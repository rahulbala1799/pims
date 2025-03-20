import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const { pathname } = request.nextUrl;
  
  // Skip API routes
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }
  
  // Get cookies from the request
  const cookies = request.cookies;
  
  // Check if user is authenticated for admin routes
  if (pathname.startsWith('/admin') && !pathname.includes('/login')) {
    // Check for admin authentication cookie
    const adminAuthCookie = cookies.get('admin_auth');
    
    if (!adminAuthCookie?.value) {
      // Redirect to admin login page
      console.log(`[Middleware] Unauthorized admin access to ${pathname}, redirecting to login`);
      return NextResponse.redirect(new URL('/login/admin', request.url));
    }
    
    // Admin is authenticated, continue
    console.log(`[Middleware] Admin access granted to ${pathname}`);
  }
  
  // Check if user is authenticated for employee routes
  if (pathname.startsWith('/employee') && !pathname.includes('/login')) {
    // Check for employee authentication cookie
    const employeeAuthCookie = cookies.get('employee_auth');
    
    if (!employeeAuthCookie?.value) {
      // Redirect to employee login page
      console.log(`[Middleware] Unauthorized employee access to ${pathname}, redirecting to login`);
      return NextResponse.redirect(new URL('/login/employee', request.url));
    }
    
    // Employee is authenticated, continue
    console.log(`[Middleware] Employee access granted to ${pathname}`);
  }
  
  // Continue to the page if authenticated or not an admin/employee route
  return NextResponse.next();
}

// Configure paths that middleware will run on
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 