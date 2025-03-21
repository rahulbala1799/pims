import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function handles authentication middleware
export function middleware(request: NextRequest) {
  // Get the pathname from the request
  const path = request.nextUrl.pathname;

  // Define public paths that don't need authentication
  const isPublicPath = 
    path === '/login/admin' || 
    path === '/login/employee' || 
    path === '/portal/login' || 
    path === '/portal/landing' ||
    path === '/health' ||
    path.startsWith('/api/auth') ||
    path.startsWith('/api/portal/auth') ||
    path.startsWith('/api/health');

  // Get authentication tokens
  const adminToken = request.cookies.get('admin_auth')?.value;
  const employeeToken = request.cookies.get('employee_auth')?.value;
  const portalToken = request.cookies.get('portal_token')?.value;

  // For SSG/SSR compatibility, we'll keep the middleware logic simple
  // and let the client-side components handle most authentication
  
  // If it's a public path, allow access
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Handle portal routes
  if (path.startsWith('/portal') && !portalToken) {
    // If accessing a portal route without token, redirect to login
    return NextResponse.redirect(new URL('/portal/login', request.url));
  }

  // Handle admin routes
  if (path.startsWith('/admin') && !adminToken) {
    // If accessing an admin route without token, redirect to login
    return NextResponse.redirect(new URL('/login/admin', request.url));
  }

  // Handle employee routes
  if (path.startsWith('/employee') && !employeeToken) {
    // If accessing an employee route without token, redirect to login
    return NextResponse.redirect(new URL('/login/employee', request.url));
  }

  // Allow the request to proceed
  return NextResponse.next();
}

// Configure paths that middleware will run on
export const config = {
  matcher: [
    // Apply to all routes except static files, api routes that handle their own auth,
    // and public assets
    '/((?!_next/static|_next/image|favicon.ico|public|assets|api/health).*)',
  ]
}; 