import { NextResponse } from 'next/server';
import { JobStatus, JobPriority } from '@prisma/client';
import prisma from '@/lib/prisma';

interface CreateJobRequest {
  invoiceId: string;
  title?: string;
  description?: string;
  createdById?: string;
}

// POST /api/jobs/createFromInvoice - Create a job from an invoice
export async function POST(request: Request) {
  try {
    const data = await request.json() as CreateJobRequest;
    
    // Check required fields
    if (!data.invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 }
      );
    }

    // Check if a job already exists for this invoice
    const existingJob = await prisma.$queryRaw`
      SELECT * FROM "Job" WHERE "invoiceId" = ${data.invoiceId}
    ` as any[];

    if (existingJob && existingJob.length > 0) {
      return NextResponse.json(
        { 
          error: "A job already exists for this invoice", 
          jobId: existingJob[0].id 
        },
        { status: 409 } // 409 Conflict
      );
    }
    
    // Find a valid user to assign as the creator
    let createdById = data.createdById;
    
    if (!createdById) {
      // Try to find an admin user first
      const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
      });
      
      if (adminUser) {
        createdById = adminUser.id;
      } else {
        // Fall back to any user
        const anyUser = await prisma.user.findFirst();
        
        if (!anyUser) {
          console.error('No users found in the database');
          return NextResponse.json(
            { error: 'Could not find a valid user to assign as job creator' },
            { status: 500 }
          );
        }
        
        createdById = anyUser.id;
      }
    }
    
    // Fetch the invoice with its items
    const invoice = await prisma.invoice.findUnique({
      where: { id: data.invoiceId },
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
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Create job
    const job = await prisma.job.create({
      data: {
        title: data.title || `Job for Invoice #${invoice.invoiceNumber}`,
        description: data.description || `Job created from Invoice #${invoice.invoiceNumber}`,
        status: 'PENDING',
        priority: 'MEDIUM',
        customerId: invoice.customerId,
        createdById: createdById,
      },
    });
    
    // Link job to invoice
    await prisma.$executeRaw`
      UPDATE "Job" SET "invoiceId" = ${data.invoiceId} WHERE id = ${job.id}
    `;
    
    console.log(`Job created: ${job.id}`);
    
    // Create job products from invoice items
    const jobProducts = await Promise.all(
      invoice.invoiceItems.map(async (item) => {
        // Use raw query to include completedQuantity
        await prisma.$executeRaw`
          INSERT INTO "JobProduct" ("id", "jobId", "productId", "quantity", "unitPrice", "totalPrice", "notes", "completedQuantity", "createdAt", "updatedAt")
          VALUES (
            ${`jp-${Math.random().toString(36).substring(2, 15)}`},
            ${job.id},
            ${item.productId},
            ${item.quantity},
            ${parseFloat(item.unitPrice.toString())},
            ${parseFloat(item.totalPrice.toString())},
            ${item.description},
            ${0},
            ${new Date()},
            ${new Date()}
          )
        `;
        
        return {
          id: `jp-${Math.random().toString(36).substring(2, 15)}`,
          jobId: job.id,
          productId: item.productId,
          product: item.product,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unitPrice.toString()),
          totalPrice: parseFloat(item.totalPrice.toString()),
          notes: item.description,
          completedQuantity: 0
        };
      })
    );
    
    // Get full job with all relations
    const fullJob = await prisma.job.findUnique({
      where: { id: job.id },
      include: {
        customer: true,
        assignedTo: true,
        createdBy: true,
      }
    });

    // Add the job products and invoice to the response
    const response = {
      ...fullJob,
      jobProducts,
      invoice
    };
    
    return NextResponse.json(response, { status: 201 });
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