import { NextResponse } from 'next/server';
import { JobStatus, JobPriority } from '@prisma/client';
import prisma from '@/lib/prisma';

// POST /api/jobs/createFromInvoice - Create a new job from an invoice
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    console.log('Creating job from invoice with data:', data);
    
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

    console.log('Found invoice:', invoice.id, invoice.invoiceNumber);

    try {
      // Create the job with minimal fields first
      const job = await prisma.job.create({
        data: {
          title: data.title || `Job for Invoice #${invoice.invoiceNumber}`,
          description: data.description || `Job created from Invoice #${invoice.invoiceNumber}`,
          status: JobStatus.PENDING,
          priority: JobPriority.MEDIUM,
          customerId: invoice.customerId,
          createdById: data.createdById || 'user-01',
        }
      });
      
      console.log('Created job:', job.id);

      // Update with any remaining fields
      if (data.assignedToId) {
        await prisma.job.update({
          where: { id: job.id },
          data: { assignedToId: data.assignedToId }
        });
      }
      
      if (data.dueDate) {
        await prisma.job.update({
          where: { id: job.id },
          data: { dueDate: new Date(data.dueDate) }
        });
      }

      // Link job to invoice using raw query to avoid any potential type issues
      await prisma.$executeRaw`UPDATE "Job" SET "invoiceId" = ${invoice.id} WHERE id = ${job.id}`;
      
      console.log('Linked job to invoice');

      // Add job products separately
      for (const item of invoice.invoiceItems) {
        await prisma.jobProduct.create({
          data: {
            jobId: job.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            notes: `From invoice item: ${item.description}`
          }
        });
      }
      
      console.log('Added job products');

      // Fetch the complete job with all relations
      const completeJob = await prisma.job.findUnique({
        where: { id: job.id },
        include: {
          customer: true,
          assignedTo: true,
          createdBy: true,
          jobProducts: {
            include: {
              product: true
            }
          }
        }
      });
      
      console.log('Job creation complete');

      return NextResponse.json(completeJob, { status: 201 });
    } catch (innerError: any) {
      console.error('Detailed error creating job:', innerError);
      console.error('Error message:', innerError.message);
      console.error('Error stack:', innerError.stack);
      
      if (innerError.meta) {
        console.error('Prisma error metadata:', innerError.meta);
      }
      
      return NextResponse.json(
        { error: `Error creating job: ${innerError.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error creating job from invoice:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      { error: `Failed to create job from invoice: ${error.message}` },
      { status: 500 }
    );
  }
} 