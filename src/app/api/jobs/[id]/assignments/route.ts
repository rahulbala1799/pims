import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Get all assignments for a job
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    
    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    // Get all assignments with user details
    const assignments = await prisma.jobAssignment.findMany({
      where: { jobId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    return NextResponse.json(assignments);
  } catch (error: any) {
    console.error('Error fetching job assignments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Assign a job to multiple employees
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const data = await req.json();
    const { userIds } = data;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'User IDs are required' }, { status: 400 });
    }
    
    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    // Assign the job to all specified users
    const assignmentPromises = userIds.map(userId => 
      prisma.jobAssignment.upsert({
        where: {
          jobId_userId: {
            jobId,
            userId
          }
        },
        update: {}, // Nothing to update since it's just an assignment
        create: {
          jobId,
          userId
        }
      })
    );
    
    await Promise.all(assignmentPromises);
    
    // Also update the primary assignee if it's not already set
    if (!job.assignedToId && userIds.length > 0) {
      await prisma.job.update({
        where: { id: jobId },
        data: { assignedToId: userIds[0] }
      });
    }
    
    // Get updated assignments
    const updatedAssignments = await prisma.jobAssignment.findMany({
      where: { jobId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    return NextResponse.json(updatedAssignments);
  } catch (error: any) {
    console.error('Error assigning job:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove all or specific job assignments
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    
    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    if (userId) {
      // Delete specific assignment
      await prisma.jobAssignment.deleteMany({
        where: {
          jobId,
          userId
        }
      });
      
      // If this user was the primary assignee, remove that too
      if (job.assignedToId === userId) {
        await prisma.job.update({
          where: { id: jobId },
          data: { assignedToId: null }
        });
      }
    } else {
      // Delete all assignments for this job
      await prisma.jobAssignment.deleteMany({
        where: { jobId }
      });
      
      // Clear the primary assignee
      await prisma.job.update({
        where: { id: jobId },
        data: { assignedToId: null }
      });
    }
    
    return NextResponse.json({ message: 'Assignments removed successfully' });
  } catch (error: any) {
    console.error('Error removing job assignments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 