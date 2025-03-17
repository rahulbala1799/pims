import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define types for the request body
interface InvoiceUpdateRequest {
  issueDate?: string;
  dueDate?: string;
  status?: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  taxRate?: number;
  notes?: string;
}

// GET /api/invoices/[id] - Get a specific invoice
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;
    
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        invoiceItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                productClass: true,
              },
            },
          },
        },
      },
    });
    
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    // Convert Decimal fields to number
    const serializedInvoice = {
      ...invoice,
      subtotal: Number(invoice.subtotal),
      taxRate: Number(invoice.taxRate),
      taxAmount: Number(invoice.taxAmount),
      totalAmount: Number(invoice.totalAmount),
      invoiceItems: invoice.invoiceItems.map(item => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        // If lengths/widths/areas exist, convert them from Decimal to number
        ...(item.length !== null ? { length: Number(item.length) } : {}),
        ...(item.width !== null ? { width: Number(item.width) } : {}),
        ...(item.area !== null ? { area: Number(item.area) } : {}),
      })),
    };
    
    return NextResponse.json(serializedInvoice);
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

// PUT /api/invoices/[id] - Update an invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;
    const body = await request.json();
    
    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
      },
      include: {
        invoiceItems: true,
      },
    });
    
    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    // Prepare update data
    const updateData: any = {};
    
    if (body.status) {
      updateData.status = body.status;
    }
    
    if (body.issueDate) {
      updateData.issueDate = new Date(body.issueDate);
    }
    
    if (body.dueDate) {
      updateData.dueDate = new Date(body.dueDate);
    }
    
    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }
    
    // Handle tax rate updates and recalculate totals
    if (body.taxRate !== undefined) {
      updateData.taxRate = body.taxRate;
      
      // Recalculate tax amount and total amount
      const subtotal = Number(existingInvoice.subtotal);
      updateData.taxAmount = subtotal * body.taxRate;
      updateData.totalAmount = subtotal + updateData.taxAmount;
    }
    
    // Update the invoice
    const updatedInvoice = await prisma.invoice.update({
      where: {
        id: invoiceId,
      },
      data: updateData,
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
    
    // Convert Decimal fields to number for the response
    const serializedInvoice = {
      ...updatedInvoice,
      subtotal: Number(updatedInvoice.subtotal),
      taxRate: Number(updatedInvoice.taxRate),
      taxAmount: Number(updatedInvoice.taxAmount),
      totalAmount: Number(updatedInvoice.totalAmount),
      invoiceItems: updatedInvoice.invoiceItems.map(item => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        ...(item.length !== null ? { length: Number(item.length) } : {}),
        ...(item.width !== null ? { width: Number(item.width) } : {}),
        ...(item.area !== null ? { area: Number(item.area) } : {}),
      })),
    };
    
    return NextResponse.json(serializedInvoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/invoices/[id] - Delete an invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;
    
    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
      },
    });
    
    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    // Delete invoice items first (to avoid foreign key constraint issues)
    await prisma.invoiceItem.deleteMany({
      where: {
        invoiceId,
      },
    });
    
    // Delete the invoice
    await prisma.invoice.delete({
      where: {
        id: invoiceId,
      },
    });
    
    return NextResponse.json(
      { message: 'Invoice deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 