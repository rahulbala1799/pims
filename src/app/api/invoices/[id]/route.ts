import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define types for the request body
interface InvoiceItemUpdate {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  length?: number;
  width?: number;
  area?: number;
  productId?: string;
}

interface InvoiceUpdateRequest {
  issueDate?: string;
  dueDate?: string;
  status?: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  taxRate?: number;
  notes?: string;
  invoiceItems?: InvoiceItemUpdate[];
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

// PUT /api/invoices/:id - Update an invoice
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: {
        id: params.id,
      },
      include: {
        invoiceItems: true
      }
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Update the invoice data
    const updatedInvoice = await prisma.invoice.update({
      where: {
        id: params.id,
      },
      data: {
        // Only update fields that were provided
        ...(data.invoiceNumber && { invoiceNumber: data.invoiceNumber }),
        ...(data.customerId && { customerId: data.customerId }),
        ...(data.issueDate && { issueDate: new Date(data.issueDate) }),
        ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
        ...(data.status && { status: data.status }),
        ...(data.subtotal !== undefined && { subtotal: data.subtotal }),
        ...(data.taxRate !== undefined && { taxRate: data.taxRate }),
        ...(data.taxAmount !== undefined && { taxAmount: data.taxAmount }),
        ...(data.totalAmount !== undefined && { totalAmount: data.totalAmount }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });

    // Handle invoice items
    if (data.invoiceItems && Array.isArray(data.invoiceItems)) {
      // Get existing invoice item IDs
      const existingItemIds = existingInvoice.invoiceItems.map(item => item.id);
      
      // Find items to create, update, or delete
      const itemsToUpdate = data.invoiceItems.filter(item => item.id && existingItemIds.includes(item.id));
      const itemsToCreate = data.invoiceItems.filter(item => !item.id || !existingItemIds.includes(item.id));
      const itemIdsToKeep = itemsToUpdate.map(item => item.id).filter(Boolean);
      const itemIdsToDelete = existingItemIds.filter(id => !itemIdsToKeep.includes(id));
      
      // Delete invoice items that were removed
      if (itemIdsToDelete.length > 0) {
        await prisma.invoiceItem.deleteMany({
          where: {
            id: {
              in: itemIdsToDelete
            }
          }
        });
      }
      
      // Update existing invoice items
      for (const item of itemsToUpdate) {
        await prisma.invoiceItem.update({
          where: { id: item.id },
          data: {
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            area: item.area,
            length: item.length,
            width: item.width,
          }
        });
      }
      
      // Create new invoice items
      for (const item of itemsToCreate) {
        await prisma.invoiceItem.create({
          data: {
            invoiceId: params.id,
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            area: item.area,
            length: item.length,
            width: item.width,
          }
        });
      }
    }
    
    // Check if there's a job associated with this invoice and update it
    const relatedJob = await prisma.job.findFirst({
      where: {
        invoiceId: params.id
      },
      include: {
        jobProducts: true
      }
    });
    
    if (relatedJob) {
      console.log(`Updating job ${relatedJob.id} related to invoice ${params.id}`);
      
      // Get updated invoice with items
      const updatedInvoiceWithItems = await prisma.invoice.findUnique({
        where: { id: params.id },
        include: {
          invoiceItems: {
            include: {
              product: true
            }
          }
        }
      });
      
      if (updatedInvoiceWithItems) {
        // Get existing job product IDs
        const existingJobProductIds = relatedJob.jobProducts.map(product => product.id);
        const existingProductMap = new Map();
        
        // Create a map of product ID to job product
        relatedJob.jobProducts.forEach(jobProduct => {
          existingProductMap.set(jobProduct.productId, jobProduct);
        });
        
        // Process each invoice item to update or create job products
        for (const invoiceItem of updatedInvoiceWithItems.invoiceItems) {
          const existingJobProduct = Array.from(existingProductMap.values())
            .find(jp => jp.productId === invoiceItem.productId);
            
          if (existingJobProduct) {
            // Update existing job product
            await prisma.jobProduct.update({
              where: { id: existingJobProduct.id },
              data: {
                quantity: invoiceItem.quantity,
                unitPrice: parseFloat(invoiceItem.unitPrice.toString()),
                totalPrice: parseFloat(invoiceItem.totalPrice.toString()),
                notes: invoiceItem.description
              }
            });
          } else {
            // Create new job product
            await prisma.jobProduct.create({
              data: {
                jobId: relatedJob.id,
                productId: invoiceItem.productId,
                quantity: invoiceItem.quantity,
                unitPrice: parseFloat(invoiceItem.unitPrice.toString()),
                totalPrice: parseFloat(invoiceItem.totalPrice.toString()),
                notes: invoiceItem.description,
                completedQuantity: 0
              }
            });
          }
        }
        
        // Remove job products that no longer exist in the invoice
        const currentProductIds = updatedInvoiceWithItems.invoiceItems.map(item => item.productId);
        const jobProductsToDelete = relatedJob.jobProducts
          .filter(jobProduct => !currentProductIds.includes(jobProduct.productId));
        
        for (const jobProduct of jobProductsToDelete) {
          await prisma.jobProduct.delete({
            where: { id: jobProduct.id }
          });
        }
      }
    }

    return NextResponse.json(updatedInvoice);
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    console.error('Error message:', error.message);
    
    return NextResponse.json(
      { error: `Failed to update invoice: ${error.message}` },
      { status: 500 }
    );
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