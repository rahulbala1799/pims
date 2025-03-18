import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/jobs - Get all jobs
export async function GET(request: Request) {
  try {
    // Extract query parameters
    const url = new URL(request.url);
    const invoiceId = url.searchParams.get('invoiceId');
    
    // Build where clause based on filters
    const whereClause: any = {};
    if (invoiceId) {
      whereClause.invoiceId = invoiceId;
    }
    
    // Fetch jobs with relations
    const jobs = await prisma.job.findMany({
      where: whereClause,
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
  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      { error: `Failed to fetch jobs: ${error.message}` },
      { status: 500 }
    );
  }
}

// POST /api/jobs - Create a new job
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Check required fields
    if (!data.title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
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
    
    // Create the job
    const job = await prisma.job.create({
      data: {
        title: data.title,
        description: data.description || '',
        status: data.status || 'NEW',
        priority: data.priority || 'MEDIUM',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        customerId: data.customerId,
        assignedToId: data.assignedToId,
        createdById: createdById,
        // Only include invoiceId if it's provided
        ...(data.invoiceId ? { invoiceId: data.invoiceId } : {}),
      },
      include: {
        customer: true,
        assignedTo: true,
        createdBy: true,
      },
    });
    
    console.log(`Job created: ${job.id}`);
    
    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: `Failed to create job: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 