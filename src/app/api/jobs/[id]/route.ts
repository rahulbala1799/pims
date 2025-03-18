import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/jobs/:id - Get a specific job
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Use Prisma's raw query capability to ensure we get invoiceId even if types are mismatched
    const jobs = await prisma.$queryRaw`
      SELECT * FROM "Job" WHERE id = ${params.id}
    `;
    
    if (!jobs || (jobs as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    const rawJob = (jobs as any[])[0];
    
    // Now fetch related data
    const customer = await prisma.customer.findUnique({
      where: { id: rawJob.customerId }
    });
    
    const createdBy = await prisma.user.findUnique({
      where: { id: rawJob.createdById }
    });
    
    const assignedTo = rawJob.assignedToId ? await prisma.user.findUnique({
      where: { id: rawJob.assignedToId }
    }) : null;
    
    const jobProducts = await prisma.jobProduct.findMany({
      where: { jobId: rawJob.id },
      include: { product: true }
    });
    
    const progressUpdates = await prisma.progressUpdate.findMany({
      where: { jobId: rawJob.id },
      include: { user: true }
    });
    
    let invoice = null;
    if (rawJob.invoiceId) {
      invoice = await prisma.invoice.findUnique({
        where: { id: rawJob.invoiceId }
      });
    }
    
    // Combine all data
    const job = {
      ...rawJob,
      customer,
      createdBy, 
      assignedTo,
      jobProducts,
      progressUpdates,
      invoice
    };

    return NextResponse.json(job);
  } catch (error: any) {
    console.error('Error fetching job:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      { error: `Failed to fetch job: ${error.message}` },
      { status: 500 }
    );
  }
}

// PUT /api/jobs/:id - Update a job
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();

    // Check if job exists
    const existingJob = await prisma.job.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Update the job
    const updatedJob = await prisma.job.update({
      where: {
        id: params.id,
      },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        customerId: data.customerId,
        assignedToId: data.assignedToId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
      include: {
        customer: true,
        assignedTo: true,
        createdBy: true,
      },
    });

    return NextResponse.json(updatedJob);
  } catch (error: any) {
    console.error('Error updating job:', error);
    console.error('Error message:', error.message);
    
    return NextResponse.json(
      { error: `Failed to update job: ${error.message}` },
      { status: 500 }
    );
  }
}

// DELETE /api/jobs/:id - Delete a job
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if job exists
    const existingJob = await prisma.job.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Delete the job
    await prisma.job.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ message: 'Job deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting job:', error);
    console.error('Error message:', error.message);
    
    return NextResponse.json(
      { error: `Failed to delete job: ${error.message}` },
      { status: 500 }
    );
  }
} 