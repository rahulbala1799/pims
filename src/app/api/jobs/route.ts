import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/jobs - Get all jobs
export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        customer: true,
        assignedTo: true,
        createdBy: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

// POST /api/jobs - Create a new job
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Ensure required fields are present
    if (!data.title || !data.customerId) {
      return NextResponse.json(
        { error: 'Title and customer are required' },
        { status: 400 }
      );
    }

    // Create the job
    const job = await prisma.job.create({
      data: {
        title: data.title,
        description: data.description || null,
        status: data.status || 'PENDING',
        priority: data.priority || 'MEDIUM',
        customerId: data.customerId,
        createdById: data.createdById || 'admin', // This should be the actual user ID in a real app
        assignedToId: data.assignedToId || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
      include: {
        customer: true,
        assignedTo: true,
        createdBy: true,
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
} 