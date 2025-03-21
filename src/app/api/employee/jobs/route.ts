import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Prevent static generation for this route
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;


const prisma = new PrismaClient();

// GET - Get all jobs assigned to an employee
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Build the base where clause for jobs directly assigned
    const directAssignmentQuery: any = { assignedToId: userId };
    
    // Add status filter if provided
    if (status) {
      if (status === 'active') {
        directAssignmentQuery.status = {
          in: ['PENDING', 'IN_PROGRESS']
        };
      } else if (status === 'completed') {
        directAssignmentQuery.status = 'COMPLETED';
      } else if (status !== 'all') {
        directAssignmentQuery.status = status;
      }
    }
    
    // Get all jobs directly assigned to the employee
    const directlyAssignedJobs = await prisma.job.findMany({
      where: directAssignmentQuery,
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ],
      include: {
        customer: true,
        jobProducts: {
          include: {
            product: true
          }
        },
        progressUpdates: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    // Define the type for jobsFromAssignments to match the type of directlyAssignedJobs
    let jobsFromAssignments: typeof directlyAssignedJobs = [];
    
    try {
      // Build the query for jobs assigned through JobAssignment
      // Check if JobAssignment table exists
      const jobAssignmentQuery: any = {
        jobAssignments: {
          some: {
            userId: userId
          }
        }
      };
      
      // Add status filter if provided
      if (status) {
        if (status === 'active') {
          jobAssignmentQuery.status = {
            in: ['PENDING', 'IN_PROGRESS']
          };
        } else if (status === 'completed') {
          jobAssignmentQuery.status = 'COMPLETED';
        } else if (status !== 'all') {
          jobAssignmentQuery.status = status;
        }
      }
      
      // Get all jobs assigned to the employee through JobAssignment
      jobsFromAssignments = await prisma.job.findMany({
        where: jobAssignmentQuery,
        orderBy: [
          { status: 'asc' },
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' }
        ],
        include: {
          customer: true,
          jobProducts: {
            include: {
              product: true
            }
          },
          progressUpdates: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          }
        }
      });
    } catch (err) {
      console.error('Error fetching jobs from assignments:', err);
      // Continue with directly assigned jobs only
    }
    
    // Combine both sets of jobs and remove duplicates
    const allJobs = [...directlyAssignedJobs];
    
    // Add jobs from assignments if they're not already in the list
    jobsFromAssignments.forEach(job => {
      if (!allJobs.some(existingJob => existingJob.id === job.id)) {
        allJobs.push(job);
      }
    });
    
    // Sort the combined list
    allJobs.sort((a, b) => {
      // First by status (PENDING, IN_PROGRESS, then COMPLETED)
      const statusOrder = { 'PENDING': 0, 'IN_PROGRESS': 1, 'COMPLETED': 2, 'CANCELLED': 3 };
      const statusDiff = statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
      if (statusDiff !== 0) return statusDiff;
      
      // Then by priority (URGENT, HIGH, MEDIUM, LOW)
      const priorityOrder = { 'URGENT': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
      const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by due date (earliest first)
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      
      // Finally by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    return NextResponse.json(allJobs);
  } catch (error: any) {
    console.error('Error fetching employee jobs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 