import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface JobQuery {
  invoiceId?: string;
}

// GET /api/jobs - Get all jobs
export async function GET(request: Request) {
  try {
    // Extract query parameters
    const url = new URL(request.url);
    const invoiceId = url.searchParams.get('invoiceId');
    
    // Build where clause based on filters
    let whereClause = {};
    
    // If invoiceId is provided, use raw query to handle optional relationship
    if (invoiceId) {
      const jobs = await prisma.$queryRaw`
        SELECT j.*, 
          c.id as "customer_id", c.name as "customer_name",
          u1.id as "createdBy_id", u1.name as "createdBy_name",
          u2.id as "assignedTo_id", u2.name as "assignedTo_name"
        FROM "Job" j
        LEFT JOIN "Customer" c ON j."customerId" = c.id
        LEFT JOIN "User" u1 ON j."createdById" = u1.id
        LEFT JOIN "User" u2 ON j."assignedToId" = u2.id
        WHERE j."invoiceId" = ${invoiceId}
        ORDER BY j."createdAt" DESC
      `;
      
      // Transform the raw results to match the structure expected by the frontend
      const formattedJobs = (jobs as any[]).map(job => ({
        id: job.id,
        title: job.title,
        description: job.description,
        status: job.status,
        priority: job.priority,
        customerId: job.customerId,
        createdById: job.createdById,
        assignedToId: job.assignedToId,
        dueDate: job.dueDate,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        invoiceId: job.invoiceId,
        customer: job.customer_id ? {
          id: job.customer_id,
          name: job.customer_name
        } : null,
        createdBy: job.createdBy_id ? {
          id: job.createdBy_id,
          name: job.createdBy_name
        } : null,
        assignedTo: job.assignedTo_id ? {
          id: job.assignedTo_id,
          name: job.assignedTo_name
        } : null
      }));
      
      return NextResponse.json(formattedJobs);
    }
    
    // Otherwise use normal Prisma query
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
      },
      include: {
        customer: true,
        assignedTo: true,
        createdBy: true,
      },
    });
    
    // If invoiceId is provided, set it via raw query
    if (data.invoiceId) {
      await prisma.$executeRaw`
        UPDATE "Job" SET "invoiceId" = ${data.invoiceId} WHERE id = ${job.id}
      `;
    }
    
    console.log(`Job created: ${job.id}`);
    
    return NextResponse.json(job, { status: 201 });
  } catch (error: any) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: `Failed to create job: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 