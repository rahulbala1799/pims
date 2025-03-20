import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email, password, userType } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user role matches the requested userType
    if (
      (userType === 'admin' && user.role !== 'ADMIN') ||
      (userType === 'employee' && user.role !== 'EMPLOYEE')
    ) {
      return NextResponse.json(
        { error: 'Invalid credentials for this user type' },
        { status: 401 }
      );
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate an expiration date (24 hours from now)
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);

    // Set the appropriate authentication cookie
    const cookieStore = cookies();
    
    // Common cookie settings
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires,
      path: '/',
      sameSite: 'lax' as const,
    };
    
    console.log(`Setting auth cookie for ${user.role.toLowerCase()} with ID: ${user.id}`);
    
    if (user.role === 'ADMIN') {
      cookieStore.set({
        name: 'admin_auth',
        value: user.id,
        ...cookieOptions,
      });
      
      // Also delete any employee cookie that might exist
      cookieStore.delete('employee_auth');
    } else {
      cookieStore.set({
        name: 'employee_auth',
        value: user.id,
        ...cookieOptions,
      });
      
      // Also delete any admin cookie that might exist
      cookieStore.delete('admin_auth');
    }

    // Return user data (excluding password)
    const { password: _, ...userData } = user;
    
    const response = NextResponse.json({
      user: userData,
      redirectUrl: user.role === 'ADMIN' ? '/admin/dashboard' : '/employee/dashboard',
    });
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 