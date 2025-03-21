import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware';

// Prevent static generation for this route
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const prisma = new PrismaClient();

// GET /api/portal/invoices/[id] - Get a single invoice
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate the request
    const authResult = await authMiddleware(request);
    if (!(authResult as any).user) {
      return authResult as NextResponse;
    }
    
    const portalUser = (authResult as any).user;
    
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
    if (invoice.customerId !== portalUser.customerId) {
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