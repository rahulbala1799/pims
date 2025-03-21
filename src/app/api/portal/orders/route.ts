import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
// Get JWT secret from environment variables with fallback
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Force dynamic execution
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
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
    
    const body = await request.json();
    
    // Basic validation
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'Order must contain at least one item' }, { status: 400 });
    }
    
    // Generate an order number (in a real app, make sure this is unique)
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create a new customer order
    const order = await prisma.customerOrder.create({
      data: {
        orderNumber,
        status: 'SUBMITTED',
        totalAmount: body.totalAmount || 0,
        notes: body.specialInstructions || '',
        customer: {
          connect: {
            id: decoded.customerId as string
          }
        },
        portalUser: {
          connect: {
            id: decoded.userId as string
          }
        },
        // Create order items
        orderItems: {
          create: body.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            notes: item.notes || ''
          }))
        }
      },
      include: {
        orderItems: true
      }
    });
    
    // In a real implementation, you would also:
    // 1. Create a new job based on the order
    // 2. Send email notifications
    // 3. Handle payments if necessary
    
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt
      }
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
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
    
    // Get customer orders
    const orders = await prisma.customerOrder.findMany({
      where: {
        customerId: decoded.customerId as string
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });
    
    return NextResponse.json({ orders });
    
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch orders' }, { status: 500 });
  }
} 