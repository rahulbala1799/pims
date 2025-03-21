import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

// Prevent static generation for this route
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const prisma = new PrismaClient();
// Get JWT secret from environment variables with fallback
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// GET /api/portal/invoices/[id] - Get a single invoice
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate the request
    const token = request.headers.get('Authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Verify the token and get user info
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      
      // Safety check to ensure decoded has the expected structure
      if (typeof decoded !== 'object' || !decoded || !('userId' in decoded) || !('customerId' in decoded)) {
        return NextResponse.json({ error: 'Invalid token format' }, { status: 401 });
      }
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }
    
    // Check if user still exists and is active
    const portalUser = await prisma.portalUser.findUnique({
      where: { id: decoded.userId as string },
    });
    
    if (!portalUser || portalUser.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User account is not active or not found' }, { status: 401 });
    }
    
    // Get the invoice by ID
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: params.id,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        invoiceItems: {
          select: {
            id: true,
            productId: true,
            description: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            length: true,
            width: true,
            area: true,
          },
        },
      },
    });
    
    // Check if the invoice exists
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    // Check if the invoice belongs to the authenticated user's customer
    if (invoice.customerId !== decoded.customerId) {
      return NextResponse.json(
        { error: 'You do not have permission to view this invoice' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 