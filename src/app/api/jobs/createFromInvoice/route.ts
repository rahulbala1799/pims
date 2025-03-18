import { NextResponse } from 'next/server';
import { PrismaClient, JobStatus, JobPriority } from '@prisma/client';

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

    try {
      // Create the job using proper enum types
      const jobData = {
        title: data.title || `Job for Invoice #${invoice.invoiceNumber}`,
        description: data.description || `Job created from Invoice #${invoice.invoiceNumber}`,
        status: JobStatus.PENDING,
        priority: (data.priority as JobPriority) || JobPriority.MEDIUM,
        customerId: invoice.customerId,
        createdById: data.createdById || 'user-01',
        assignedToId: data.assignedToId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        invoiceId: invoice.id
      };
      
      const job = await prisma.job.create({
        data: jobData
      });

      // Add job products separately
      const jobProducts = [];
      for (const item of invoice.invoiceItems) {
        const jobProduct = await prisma.jobProduct.create({
          data: {
            jobId: job.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            notes: `From invoice item: ${item.description}`
          },
          include: {
            product: true
          }
        });
        jobProducts.push(jobProduct);
      }

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

      // Add the job products to the response
      const response = {
        ...completeJob,
        jobProducts
      };

      return NextResponse.json(response, { status: 201 });
    } catch (innerError) {
      console.error('Detailed error:', innerError);
      throw innerError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('Error creating job from invoice:', error);
    return NextResponse.json(
      { error: 'Failed to create job from invoice' },
      { status: 500 }
    );
  }
} 