import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip login routes, API routes, and static assets
  if (
    pathname.includes('/login') || 
    pathname.startsWith('/api') || 
    pathname.startsWith('/_next') || 
    pathname === '/favicon.ico' ||
    pathname === '/' ||
    pathname === '/logout'
  ) {
    return NextResponse.next();
  }
  
  // Get cookies from the request
  const cookies = request.cookies;
  
  console.log(`[Middleware] Checking route: ${pathname}`);
  console.log(`[Middleware] Available cookies:`, Array.from(cookies.getAll()).map(c => c.name));
  
  // Check if user is authenticated for admin routes
  if (pathname.startsWith('/admin')) {
    // Check for admin authentication cookie
    const adminAuthCookie = cookies.get('admin_auth');
    
    console.log(`[Middleware] Admin auth cookie:`, adminAuthCookie?.value ? 'Present' : 'Missing');
    
    if (!adminAuthCookie?.value) {
      // Redirect to admin login page
      console.log(`[Middleware] Redirecting to admin login`);
      return NextResponse.redirect(new URL('/login/admin', request.url));
    }
  }
  
  // Check if user is authenticated for employee routes
  if (pathname.startsWith('/employee')) {
    // Check for employee authentication cookie
    const employeeAuthCookie = cookies.get('employee_auth');
    
    console.log(`[Middleware] Employee auth cookie:`, employeeAuthCookie?.value ? 'Present' : 'Missing');
    
    if (!employeeAuthCookie?.value) {
      // Redirect to employee login page
      console.log(`[Middleware] Redirecting to employee login`);
      return NextResponse.redirect(new URL('/login/employee', request.url));
    }
  }
  
  // Continue to the page if authenticated
  console.log(`[Middleware] Access granted to ${pathname}`);
  return NextResponse.next();
}

// Configure paths that middleware will run on
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 