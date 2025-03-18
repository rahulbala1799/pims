import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/jobs/:id - Get a specific job
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const job = await prisma.job.findUnique({
      where: {
        id: params.id,
      },
      include: {
        customer: true,
        assignedTo: true,
        createdBy: true,
        progressUpdates: true,
        jobProducts: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job' },
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
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { error: 'Failed to update job' },
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
  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json(
      { error: 'Failed to delete job' },
      { status: 500 }
    );
  }
} 