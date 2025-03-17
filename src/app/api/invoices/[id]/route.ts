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
            phone: true,
            address: true,
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

// PUT /api/invoices/[id] - Update a invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json() as InvoiceUpdateRequest;
    
    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: {
        id: params.id,
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
    
    if (body.issueDate) {
      updateData.issueDate = new Date(body.issueDate);
    }
    
    if (body.dueDate) {
      updateData.dueDate = new Date(body.dueDate);
    }
    
    if (body.status) {
      updateData.status = body.status;
    }
    
    if (body.taxRate !== undefined) {
      updateData.taxRate = body.taxRate;
      
      // Recalculate tax amount and total amount if tax rate changes
      updateData.taxAmount = parseFloat((existingInvoice.subtotal.toNumber() * body.taxRate).toFixed(2));
      updateData.totalAmount = parseFloat((existingInvoice.subtotal.toNumber() + updateData.taxAmount).toFixed(2));
    }
    
    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }
    
    // Update invoice
    const updatedInvoice = await prisma.invoice.update({
      where: {
        id: params.id,
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
    
    return NextResponse.json(updatedInvoice);
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
    // Check if invoice exists
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: params.id,
      },
      include: {
        invoiceItems: true,
      },
    });
    
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    // Delete invoice items first to avoid foreign key constraint issues
    await prisma.invoiceItem.deleteMany({
      where: {
        invoiceId: params.id,
      },
    });
    
    // Delete invoice
    await prisma.invoice.delete({
      where: {
        id: params.id,
      },
    });
    
    return NextResponse.json({ success: true });
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