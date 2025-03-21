import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Prevent static generation for this route
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;


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
    console.log('Received job assignment request for job ID:', params.id);
    
    const jobId = params.id;
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }
    
    const data = await req.json();
    console.log('Received assignment data:', data);
    
    const { userIds } = data;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'User IDs are required and must be a non-empty array' }, { status: 400 });
    }
    
    // Ensure all userIds are valid strings
    const validUserIds = userIds.filter(id => id && typeof id === 'string');
    console.log('Valid user IDs:', validUserIds);
    
    if (validUserIds.length === 0) {
      return NextResponse.json({ error: 'No valid user IDs provided' }, { status: 400 });
    }
    
    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    console.log('Found job:', job);
    
    // Check if all users exist
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: validUserIds
        }
      },
      select: {
        id: true,
        name: true
      }
    });
    
    console.log('Found users:', users);
    
    if (users.length !== validUserIds.length) {
      const foundUserIds = users.map(u => u.id);
      const missingUserIds = validUserIds.filter(id => !foundUserIds.includes(id));
      return NextResponse.json({ 
        error: `Some users were not found: ${missingUserIds.join(', ')}` 
      }, { status: 404 });
    }
    
    // Assign the job to all specified users
    try {
      console.log('Creating job assignments for users:', validUserIds);
      
      const assignmentPromises = validUserIds.map(userId => 
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
      
      const assignmentResults = await Promise.all(assignmentPromises);
      console.log('Assignment results:', assignmentResults);
      
      // Also update the primary assignee if it's not already set
      if (!job.assignedToId && validUserIds.length > 0) {
        console.log('Updating primary assignee to:', validUserIds[0]);
        await prisma.job.update({
          where: { id: jobId },
          data: { assignedToId: validUserIds[0] }
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
      
      console.log('Returning updated assignments:', updatedAssignments);
      return NextResponse.json(updatedAssignments);
    } catch (dbError: any) {
      console.error('Database error during job assignment:', dbError);
      return NextResponse.json({ 
        error: `Database error: ${dbError.message}`,
        details: dbError 
      }, { status: 500 });
    }
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
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }
    
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    
    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    if (userId && typeof userId === 'string') {
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