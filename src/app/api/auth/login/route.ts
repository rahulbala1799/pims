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

    // Create the response first
    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      redirectUrl: user.role === 'ADMIN' ? '/admin/dashboard' : '/employee/dashboard',
    });
    
    // Log the user role and ID
    console.log(`Setting auth cookie for ${user.role.toLowerCase()} with ID: ${user.id}`);

    // Set cookies directly on the response
    if (user.role === 'ADMIN') {
      response.cookies.set({
        name: 'admin_auth',
        value: user.id,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires,
        path: '/',
        sameSite: 'lax',
      });
      
      // Delete employee cookie if it exists
      response.cookies.set({
        name: 'employee_auth',
        value: '',
        httpOnly: true,
        expires: new Date(0),
        path: '/',
      });
    } else {
      response.cookies.set({
        name: 'employee_auth',
        value: user.id,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires,
        path: '/',
        sameSite: 'lax',
      });
      
      // Delete admin cookie if it exists
      response.cookies.set({
        name: 'admin_auth',
        value: '',
        httpOnly: true,
        expires: new Date(0),
        path: '/',
      });
    }
    
    // Log the cookies being set
    console.log(`Cookies set in response:`, 
      Object.fromEntries(response.cookies.getAll().map(c => [c.name, c.value ? 'Present' : 'Empty']))
    );
    
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