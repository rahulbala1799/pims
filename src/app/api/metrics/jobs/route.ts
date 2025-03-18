import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/metrics/jobs - Get job metrics data
export async function GET() {
  try {
    // First, check if the JobMetrics table has any data
    const existingMetrics = await prisma.jobMetrics.findMany({
      include: {
        job: {
          include: {
            customer: true
          }
        }
      },
      orderBy: {
        lastUpdated: 'desc'
      }
    });

    // If we have existing metrics, return them
    if (existingMetrics.length > 0) {
      return NextResponse.json(existingMetrics);
    }

    // Otherwise, calculate metrics from job and invoice data
    const jobs = await prisma.job.findMany({
      where: {
        // Only include jobs that have both an invoice and products
        invoiceId: {
          not: null
        },
        jobProducts: {
          some: {}
        }
      },
      include: {
        customer: true,
        invoice: true,
        jobProducts: {
          include: {
            product: true
          }
        }
      }
    });

    // If we don't have any jobs with invoices, return empty array
    if (jobs.length === 0) {
      return NextResponse.json([]);
    }

    // Calculate metrics for each job and save to JobMetrics table
    const metrics = await Promise.all(jobs.map(async (job) => {
      // Calculate revenue from invoice
      const revenue = job.invoice?.subtotal || 0;
      
      // Calculate material costs
      let materialCost = 0;
      let inkCost = 0;
      let totalTime = 0;
      let totalQuantity = 0;
      
      // Calculate costs from job products
      job.jobProducts.forEach(product => {
        // Material cost based on base price
        materialCost += parseFloat(product.quantity.toString()) * parseFloat(product.product.basePrice.toString());
        
        // Ink cost
        if (product.inkCostPerUnit) {
          inkCost += parseFloat(product.quantity.toString()) * parseFloat(product.inkCostPerUnit.toString());
        }
        
        // If it's a wide format product and has ink usage
        if (product.product.productClass === 'WIDE_FORMAT' && product.inkUsageInMl) {
          // Assume a cost per ml of ink (e.g., $0.50 per ml)
          inkCost += product.inkUsageInMl * 0.5;
        }
        
        // Track time
        if (product.timeTaken) {
          totalTime += product.timeTaken;
        }
        
        // Track quantity
        totalQuantity += product.quantity;
      });
      
      // Calculate labor cost based on time (assume $30 per hour)
      const laborCost = (totalTime / 60) * 30;
      
      // Calculate overhead (assume 15% of material + labor)
      const overheadCost = (materialCost + laborCost) * 0.15;
      
      // Calculate total cost and profit
      const totalCost = materialCost + inkCost + laborCost + overheadCost;
      const grossProfit = revenue - totalCost;
      
      // Calculate profit margin as a percentage
      const profitMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
      
      // Create or update JobMetrics record
      const metrics = await prisma.jobMetrics.upsert({
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
        },
        include: {
          job: {
            include: {
              customer: true
            }
          }
        }
      });
      
      return metrics;
    }));
    
    return NextResponse.json(metrics);
  } catch (error: any) {
    console.error('Error generating job metrics:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      { error: `Failed to generate job metrics: ${error.message}` },
      { status: 500 }
    );
  }
} 