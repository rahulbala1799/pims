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
    console.log('Processing login request...');
    
    const { email, password } = await request.json();
    console.log(`Login attempt for email: ${email}`);

    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find the portal user
    console.log(`Looking up portal user with email: ${email}`);
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
      console.log(`No user found with email: ${email}`);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log(`Found user: ${portalUser.id}, status: ${portalUser.status}`);

    // Check if user is active
    if (portalUser.status !== 'ACTIVE') {
      console.log(`User account is not active: ${portalUser.status}`);
      return NextResponse.json(
        { error: 'User account is not active' },
        { status: 403 }
      );
    }

    // Verify password using bcrypt
    console.log('Verifying password...');
    const isPasswordValid = await bcrypt.compare(password, portalUser.passwordHash);

    if (!isPasswordValid) {
      console.log('Invalid password');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log('Password verified successfully');

    // Create JWT token with a try-catch to handle any JWT errors
    let token;
    try {
      console.log('Creating JWT token...');
      console.log(`Using JWT_SECRET: ${JWT_SECRET ? 'SECRET SET (Hidden)' : 'NOT SET'}`);
      
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
      
      console.log('JWT token created successfully');
    } catch (jwtError) {
      console.error('JWT signing error:', jwtError);
      return NextResponse.json(
        { error: 'Failed to generate authentication token' },
        { status: 500 }
      );
    }

    // Update last login timestamp
    console.log('Updating last login timestamp...');
    await prisma.portalUser.update({
      where: { id: portalUser.id },
      data: { lastLogin: new Date() },
    });

    console.log('Login successful, returning token');
    
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
    console.log('Processing token verification request...');
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No authorization header or bearer token');
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    console.log('Token received for verification');
    
    try {
      // Verify JWT token with a safer approach
      console.log('Verifying JWT token...');
      console.log(`Using JWT_SECRET: ${JWT_SECRET ? 'SECRET SET (Hidden)' : 'NOT SET'}`);
      
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('JWT token verified successfully');
      
      // Safety check to ensure decoded has the expected structure
      if (typeof decoded !== 'object' || !decoded || !('userId' in decoded)) {
        console.log('Invalid token format, missing userId');
        return NextResponse.json(
          { error: 'Invalid token format' },
          { status: 401 }
        );
      }
      
      // Check if user still exists and is active
      console.log(`Looking up user with ID: ${decoded.userId}`);
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
      
      if (!portalUser) {
        console.log(`No user found with ID: ${decoded.userId}`);
        return NextResponse.json(
          { error: 'User not found' },
          { status: 401 }
        );
      }
      
      if (portalUser.status !== 'ACTIVE') {
        console.log(`User account is not active: ${portalUser.status}`);
        return NextResponse.json(
          { error: 'User account is not active' },
          { status: 401 }
        );
      }
      
      console.log('User verification successful');
      
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