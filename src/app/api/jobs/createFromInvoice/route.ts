import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/jobs/createFromInvoice - Create a new job from an invoice
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Ensure invoice ID is provided
    if (!data.invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    // Fetch the invoice with its items
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: data.invoiceId
      },
      include: {
        customer: true,
        invoiceItems: {
          include: {
            product: true
          }
        }
      }
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Create the job
    const job = await prisma.job.create({
      data: {
        title: data.title || `Job for Invoice #${invoice.invoiceNumber}`,
        description: data.description || `Job created from Invoice #${invoice.invoiceNumber}`,
        status: 'PENDING',
        priority: data.priority || 'MEDIUM',
        customer: {
          connect: { id: invoice.customerId }
        },
        createdBy: {
          connect: { id: data.createdById || 'user-01' } // Replace with actual user ID from auth
        },
        assignedTo: data.assignedToId ? {
          connect: { id: data.assignedToId }
        } : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        // Create job products from invoice items
        jobProducts: {
          create: invoice.invoiceItems.map(item => ({
            product: { connect: { id: item.productId } },
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            notes: `From invoice item: ${item.description}`
          }))
        }
      },
      include: {
        customer: true,
        assignedTo: true,
        createdBy: true,
        jobProducts: {
          include: {
            product: true
          }
        },
      },
    });
    
    // Use a raw query to update the invoice relationship
    // This bypasses the Prisma type system which might be out of sync
    await prisma.$executeRaw`UPDATE "Job" SET "invoiceId" = ${invoice.id} WHERE id = ${job.id}`;
    
    // Fetch the updated job
    const updatedJob = await prisma.job.findUnique({
      where: { id: job.id },
      include: {
        customer: true,
        assignedTo: true,
        createdBy: true,
        jobProducts: {
          include: {
            product: true
          }
        },
      }
    });

    return NextResponse.json(updatedJob, { status: 201 });
  } catch (error) {
    console.error('Error creating job from invoice:', error);
    return NextResponse.json(
      { error: 'Failed to create job from invoice' },
      { status: 500 }
    );
  }
} 