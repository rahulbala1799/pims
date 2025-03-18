import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PATCH - Update job status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const data = await req.json();
    const { status } = data;
    
    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }
    
    // Check if the job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    // Update the job status
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: { status }
    });
    
    // If the job is being marked as completed, add a progress update
    if (status === 'COMPLETED' && job.status !== 'COMPLETED') {
      await prisma.progressUpdate.create({
        data: {
          content: 'Job marked as completed by employee',
          jobId,
          userId: job.assignedToId || job.createdById // Use assigned user or creator if not assigned
        }
      });
    }
    
    // If the job is being marked as in progress, add a progress update
    if (status === 'IN_PROGRESS' && job.status !== 'IN_PROGRESS') {
      await prisma.progressUpdate.create({
        data: {
          content: 'Job started by employee',
          jobId,
          userId: job.assignedToId || job.createdById
        }
      });
    }
    
    return NextResponse.json(updatedJob);
  } catch (error: any) {
    console.error('Error updating job status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 