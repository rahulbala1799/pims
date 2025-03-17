import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define types for the request body
interface InvoiceItem {
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
}

interface InvoiceRequest {
  customerId: string;
  issueDate: string;
  dueDate: string;
  status?: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  taxRate?: number;
  notes?: string;
  invoiceItems: InvoiceItem[];
}

// GET /api/invoices - Get all invoices
export async function GET(request: NextRequest) {
  try {
    const invoices = await prisma.invoice.findMany({
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

// POST /api/invoices - Create a new invoice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as InvoiceRequest;
    
    // Validate required fields
    if (!body.customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }
    
    if (!body.issueDate) {
      return NextResponse.json(
        { error: 'Issue date is required' },
        { status: 400 }
      );
    }
    
    if (!body.dueDate) {
      return NextResponse.json(
        { error: 'Due date is required' },
        { status: 400 }
      );
    }
    
    if (!body.invoiceItems || !Array.isArray(body.invoiceItems) || body.invoiceItems.length === 0) {
      return NextResponse.json(
        { error: 'At least one invoice item is required' },
        { status: 400 }
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
    
    // Generate invoice number (format: INV-YYYYMMDD-XXX)
    const today = new Date();
    const datePart = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Get the count of invoices created today to generate a unique sequence
    const invoicesCreatedToday = await prisma.invoice.count({
      where: {
        createdAt: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
          lte: new Date(today.setHours(23, 59, 59, 999)),
        },
      },
    });
    
    const sequenceNumber = (invoicesCreatedToday + 1).toString().padStart(3, '0');
    const invoiceNumber = `INV-${datePart}-${sequenceNumber}`;
    
    // Calculate invoice totals
    let subtotal = 0;
    
    // Validate and process invoice items
    for (const item of body.invoiceItems) {
      if (!item.productId || !item.description || !item.quantity || !item.unitPrice) {
        return NextResponse.json(
          { error: 'Each invoice item must have a productId, description, quantity, and unitPrice' },
          { status: 400 }
        );
      }
      
      // Calculate item total
      item.totalPrice = parseFloat((item.quantity * item.unitPrice).toFixed(2));
      subtotal += item.totalPrice;
    }
    
    // Calculate tax and total
    const taxRate = body.taxRate || 0.2; // Default to 20% if not provided
    const taxAmount = parseFloat((subtotal * taxRate).toFixed(2));
    const totalAmount = parseFloat((subtotal + taxAmount).toFixed(2));
    
    // Create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId: body.customerId,
        issueDate: new Date(body.issueDate),
        dueDate: new Date(body.dueDate),
        status: body.status || 'PENDING',
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
        notes: body.notes || null,
        invoiceItems: {
          create: body.invoiceItems.map(item => ({
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice!,
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