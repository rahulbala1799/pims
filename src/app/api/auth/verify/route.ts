import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const adminCookie = cookieStore.get('admin_auth');
    const employeeCookie = cookieStore.get('employee_auth');
    
    // If none of the cookies are present, return unauthenticated
    if (!adminCookie && !employeeCookie) {
      return NextResponse.json({ isAuthenticated: false });
    }
    
    // Determine which cookie is present
    let userId: string | null = null;
    let requiredRole: 'ADMIN' | 'EMPLOYEE' | null = null;
    
    if (adminCookie) {
      userId = adminCookie.value;
      requiredRole = 'ADMIN';
    } else if (employeeCookie) {
      userId = employeeCookie.value;
      requiredRole = 'EMPLOYEE';
    }
    
    // If userId is still null, something went wrong
    if (!userId || !requiredRole) {
      return NextResponse.json({ isAuthenticated: false });
    }
    
    // Verify the user exists and has the correct role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true }
    });
    
    if (!user || user.role !== requiredRole) {
      return NextResponse.json({ isAuthenticated: false });
    }
    
    // All checks passed, user is authenticated
    return NextResponse.json({ isAuthenticated: true, role: user.role });
  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json({ isAuthenticated: false });
  } finally {
    await prisma.$disconnect();
  }
} 