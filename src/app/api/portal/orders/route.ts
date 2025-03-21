import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyPortalToken } from '../../../../lib/auth/portalAuth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Verify the token and get user info
    const tokenData = await verifyPortalToken(token);
    
    if (!tokenData || !tokenData.id || !tokenData.customerId) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
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
            id: tokenData.customerId
          }
        },
        portalUser: {
          connect: {
            id: tokenData.id
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
    const tokenData = await verifyPortalToken(token);
    
    if (!tokenData || !tokenData.id || !tokenData.customerId) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }
    
    // Get customer orders
    const orders = await prisma.customerOrder.findMany({
      where: {
        customerId: tokenData.customerId
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