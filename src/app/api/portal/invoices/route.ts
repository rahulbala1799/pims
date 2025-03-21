import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware';

// Prevent static generation for this route
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const prisma = new PrismaClient();

// Define types for the request body
interface InvoiceItem {
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Interface for invoice request from portal
interface PortalInvoiceRequest {
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  issueDate: string;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  notes: string;
}

// GET /api/portal/invoices - Get all invoices for the logged-in customer
export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authMiddleware(request);
    if (!(authResult as any).user) {
      return authResult as NextResponse;
    }
    
    const portalUser = (authResult as any).user;

    // Get all invoices for this customer
    const invoices = await prisma.invoice.findMany({
      where: {
        customerId: portalUser.customerId,
      },
      orderBy: {
        createdAt: 'desc',
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
    
    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/portal/invoices - Create a new invoice from the portal
export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authMiddleware(request);
    if (!(authResult as any).user) {
      return authResult as NextResponse;
    }
    
    const portalUser = (authResult as any).user;

    const body = await request.json() as PortalInvoiceRequest;
    
    // Log the received data for debugging
    console.log('Received portal invoice data:', JSON.stringify(body, null, 2));
    
    // Validate required fields
    if (!body.customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }
    
    // Ensure the customer ID matches the logged-in user's customer ID
    if (body.customerId !== portalUser.customerId) {
      return NextResponse.json(
        { error: 'Cannot create invoice for another customer' },
        { status: 403 }
      );
    }
    
    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: {
        id: body.customerId,
      },
    });
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    // Create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: body.invoiceNumber,
        customerId: body.customerId,
        issueDate: new Date(body.issueDate),
        dueDate: new Date(body.dueDate),
        status: body.status,
        subtotal: body.subtotal,
        taxRate: body.taxRate,
        taxAmount: body.taxAmount,
        totalAmount: body.totalAmount,
        notes: body.notes || null,
        invoiceItems: {
          create: body.items.map(item => ({
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            // Set dimension fields to null for now
            length: null,
            width: null,
            area: null,
          })),
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        invoiceItems: true,
      },
    });
    
    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 