import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
// Use a secret key from environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Simple login endpoint without actual crypto - for development only
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

    // Create JWT token
    const token = jwt.sign(
      {
        userId: portalUser.id,
        email: portalUser.email,
        role: portalUser.role,
        customerId: portalUser.customerId,
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

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

// Endpoint to check if token is valid
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
      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
        role: string;
        customerId: string;
      };
      
      // Check if user still exists and is active
      const portalUser = await prisma.portalUser.findUnique({
        where: { id: decoded.userId },
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
    } catch (err) {
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