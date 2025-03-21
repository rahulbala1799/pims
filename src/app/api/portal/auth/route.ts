import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

// Get JWT secret from environment variables with fallback
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Force dynamic execution
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

/**
 * Login endpoint for portal users
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find the portal user
    const portalUser = await prisma.portalUser.findUnique({
      where: { email },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!portalUser) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (portalUser.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'User account is not active' },
        { status: 403 }
      );
    }

    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, portalUser.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create JWT token with a try-catch to handle any JWT errors
    let token;
    try {
      token = jwt.sign(
        {
          userId: portalUser.id,
          email: portalUser.email,
          role: portalUser.role,
          customerId: portalUser.customerId,
        },
        JWT_SECRET,
        { expiresIn: '8h' }
      );
    } catch (jwtError) {
      console.error('JWT signing error:', jwtError);
      return NextResponse.json(
        { error: 'Failed to generate authentication token' },
        { status: 500 }
      );
    }

    // Update last login timestamp
    await prisma.portalUser.update({
      where: { id: portalUser.id },
      data: { lastLogin: new Date() },
    });

    // Return the token and user info
    return NextResponse.json({
      token,
      user: {
        id: portalUser.id,
        name: `${portalUser.firstName || ''} ${portalUser.lastName || ''}`.trim(),
        email: portalUser.email,
        role: portalUser.role,
        customerId: portalUser.customerId,
        companyName: portalUser.customer?.name || '',
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}

/**
 * Token validation endpoint for portal users
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    try {
      // Verify JWT token with a safer approach
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Safety check to ensure decoded has the expected structure
      if (typeof decoded !== 'object' || !decoded || !('userId' in decoded)) {
        return NextResponse.json(
          { error: 'Invalid token format' },
          { status: 401 }
        );
      }
      
      // Check if user still exists and is active
      const portalUser = await prisma.portalUser.findUnique({
        where: { id: decoded.userId as string },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      
      if (!portalUser || portalUser.status !== 'ACTIVE') {
        return NextResponse.json(
          { error: 'User not found or inactive' },
          { status: 401 }
        );
      }
      
      return NextResponse.json({
        valid: true,
        user: {
          id: portalUser.id,
          name: `${portalUser.firstName || ''} ${portalUser.lastName || ''}`.trim(),
          email: portalUser.email,
          role: portalUser.role,
          customerId: portalUser.customerId,
          companyName: portalUser.customer?.name || '',
        },
      });
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'An error occurred during authentication check' },
      { status: 500 }
    );
  }
} 