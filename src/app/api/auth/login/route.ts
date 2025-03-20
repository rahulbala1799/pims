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
    if (user.role === 'ADMIN') {
      cookieStore.set({
        name: 'admin_auth',
        value: user.id,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires,
        path: '/',
      });
    } else {
      cookieStore.set({
        name: 'employee_auth',
        value: user.id,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires,
        path: '/',
      });
    }

    // Return user data (excluding password)
    const { password: _, ...userData } = user;
    return NextResponse.json({
      user: userData,
      redirectUrl: user.role === 'ADMIN' ? '/admin/dashboard' : '/employee/dashboard',
    });
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