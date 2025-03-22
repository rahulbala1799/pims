import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sub } from 'date-fns';

// Prevent static generation for this route
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

interface JobQuery {
  invoiceId?: string;
}

// Define a type that includes the invoiceId property
interface JobWithInvoiceId {
  id: string;
  invoiceId?: string | null;
  [key: string]: any; // Allow other job properties
}

// GET /api/jobs - Get all jobs
export async function GET(request: NextRequest) {
  try {
    // Parse URL parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const daysParam = searchParams.get('days');
    const invoiceId = searchParams.get('invoiceId');
    const days = daysParam ? parseInt(daysParam) : undefined;
    
    // Build filter object
    const filter: any = {};
    
    // Add status filter if provided
    if (status) {
      filter.status = status;
    }
    
    // Add date filter if days parameter is provided
    if (days && !isNaN(days)) {
      const startDate = sub(new Date(), { days: days });
      filter.updatedAt = {
        gte: startDate,
      };
    }
    
    // Special case for invoiceId filter (existing functionality)
    if (invoiceId) {
      const jobs = await prisma.$queryRaw`
        SELECT j.*, 
          c.id as "customer_id", c.name as "customer_name",
          u1.id as "createdBy_id", u1.name as "createdBy_name",
          u2.id as "assignedTo_id", u2.name as "assignedTo_name",
          i.id as "invoice_id", i."invoiceNumber" as "invoice_number"
        FROM "Job" j
        LEFT JOIN "Customer" c ON j."customerId" = c.id
        LEFT JOIN "User" u1 ON j."createdById" = u1.id
        LEFT JOIN "User" u2 ON j."assignedToId" = u2.id
        LEFT JOIN "Invoice" i ON j."invoiceId" = i.id
        WHERE j."invoiceId" = ${invoiceId}
        ORDER BY j."createdAt" DESC
      `;
      
      // Get job products for each job
      const jobsWithProducts = await Promise.all((jobs as any[]).map(async (job) => {
        const jobProducts = await prisma.jobProduct.findMany({
          where: { jobId: job.id },
          include: { product: true }
        });
        
        return {
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
          } : null,
          invoice: job.invoice_id ? {
            id: job.invoice_id,
            invoiceNumber: job.invoice_number
          } : null,
          jobProducts
        };
      }));
      
      return NextResponse.json(jobsWithProducts);
    }

    // Fetch jobs with filters
    const jobs = await prisma.job.findMany({
      where: filter,
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
        jobProducts: {
          include: {
            product: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
          },
        },
      },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch jobs' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
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