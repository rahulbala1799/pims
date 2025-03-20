import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const adminCookie = cookieStore.get('admin_auth');
    const employeeCookie = cookieStore.get('employee_auth');
    
    // Get all cookies for debugging
    const allCookies = cookieStore.getAll();
    
    const cookiesInfo = allCookies.map(cookie => ({
      name: cookie.name,
      value: cookie.value ? 'Present (Hidden)' : 'Empty',
    }));
    
    return NextResponse.json({
      hasAdminAuth: !!adminCookie?.value,
      hasEmployeeAuth: !!employeeCookie?.value,
      allCookies: cookiesInfo,
      requestInfo: {
        url: request.url,
        method: request.method,
      },
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ error: 'Error checking auth state' }, { status: 500 });
  }
} 