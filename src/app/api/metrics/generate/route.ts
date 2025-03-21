import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Prevent static generation for this route
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;


// POST /api/metrics/generate - Generate demo metrics data
export async function POST() {
  try {
    // Get all jobs that have an invoice
    const jobs = await prisma.job.findMany({
      where: {
        invoiceId: {
          not: null
        },
      },
      include: {
        customer: true,
      },
      take: 10 // Limit to 10 jobs for demo purposes
    });

    // If no jobs with invoices, create some demo jobs
    let jobsToProcess = jobs;
    
    if (jobs.length === 0) {
      // Find a customer to associate with demo jobs
      const customer = await prisma.customer.findFirst();
      if (!customer) {
        return NextResponse.json(
          { error: 'No customers found to create demo jobs' },
          { status: 400 }
        );
      }
      
      // Find an admin user
      const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
      });
      
      if (!adminUser) {
        return NextResponse.json(
          { error: 'No admin user found to create demo jobs' },
          { status: 400 }
        );
      }
      
      // Create 5 demo jobs
      const demoJobs = [];
      const jobStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'COMPLETED', 'CANCELLED'];
      const jobPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'MEDIUM'];
      
      for (let i = 0; i < 5; i++) {
        const job = await prisma.job.create({
          data: {
            title: `Demo Job ${i + 1}`,
            description: `This is a demo job for metrics testing.`,
            status: jobStatuses[i] as any,
            priority: jobPriorities[i] as any,
            customerId: customer.id,
            createdById: adminUser.id,
            assignedToId: adminUser.id,
            dueDate: new Date(Date.now() + (i * 86400000)), // Add i days to current date
          },
          include: {
            customer: true,
          }
        });
        
        demoJobs.push(job);
      }
      
      jobsToProcess = demoJobs;
    }

    // Generate metrics for each job
    const metrics = await Promise.all(jobsToProcess.map(async (job) => {
      // Generate random metrics
      const revenue = Math.floor(Math.random() * 5000) + 1000; // Random revenue between 1000 and 6000
      
      const materialCost = Math.floor(revenue * (Math.random() * 0.3 + 0.2)); // 20-50% of revenue
      const inkCost = Math.floor(revenue * (Math.random() * 0.1 + 0.05)); // 5-15% of revenue
      const laborCost = Math.floor(revenue * (Math.random() * 0.2 + 0.1)); // 10-30% of revenue
      const overheadCost = Math.floor(revenue * (Math.random() * 0.1 + 0.05)); // 5-15% of revenue
      
      const totalCost = materialCost + inkCost + laborCost + overheadCost;
      const grossProfit = revenue - totalCost;
      const profitMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
      
      const totalQuantity = Math.floor(Math.random() * 50) + 10; // Random quantity between 10 and 60
      const totalTime = Math.floor(Math.random() * 300) + 60; // Random time between 60 and 360 minutes
      
      // Create or update JobMetrics record
      return prisma.jobMetrics.upsert({
        where: {
          jobId: job.id
        },
        update: {
          revenue: revenue,
          materialCost: materialCost,
          inkCost: inkCost,
          laborCost: laborCost,
          overheadCost: overheadCost,
          totalCost: totalCost,
          grossProfit: grossProfit,
          profitMargin: profitMargin,
          totalQuantity: totalQuantity,
          totalTime: totalTime,
          lastUpdated: new Date()
        },
        create: {
          jobId: job.id,
          revenue: revenue,
          materialCost: materialCost,
          inkCost: inkCost,
          laborCost: laborCost,
          overheadCost: overheadCost,
          totalCost: totalCost,
          grossProfit: grossProfit,
          profitMargin: profitMargin,
          totalQuantity: totalQuantity,
          totalTime: totalTime,
          lastUpdated: new Date()
        }
      });
    }));
    
    return NextResponse.json({ 
      message: 'Demo metrics generated successfully',
      count: metrics.length
    });
  } catch (error: any) {
    console.error('Error generating demo metrics:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      { error: `Failed to generate demo metrics: ${error.message}` },
      { status: 500 }
    );
  }
} 