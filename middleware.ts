import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const { pathname } = request.nextUrl;
  
  // Get cookies from the request
  const cookieStore = request.cookies;
  
  // Check if user is authenticated for admin routes
  if (pathname.startsWith('/admin') && !pathname.includes('/login')) {
    // Check for admin authentication cookie
    const adminAuthCookie = cookieStore.get('admin_auth');
    if (!adminAuthCookie) {
      // Redirect to admin login page
      return NextResponse.redirect(new URL('/login/admin', request.url));
    }
  }
  
  // Check if user is authenticated for employee routes
  if (pathname.startsWith('/employee') && !pathname.includes('/login')) {
    // Check for employee authentication cookie
    const employeeAuthCookie = cookieStore.get('employee_auth');
    if (!employeeAuthCookie) {
      // Redirect to employee login page
      return NextResponse.redirect(new URL('/login/employee', request.url));
    }
  }
  
  // Continue to the page if authenticated or not an admin/employee route
  return NextResponse.next();
}

// Configure paths that middleware will run on
export const config = {
  matcher: [
    '/admin/:path*',
    '/employee/:path*',
  ],
}; 