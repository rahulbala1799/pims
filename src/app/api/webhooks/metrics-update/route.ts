import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/webhooks/metrics-update - Trigger metrics recalculation when source data changes
export async function POST(request: Request) {
  try {
    // Extract the job ID from the request if available
    const { jobId } = await request.json();
    
    // If a specific job ID is provided, only recalculate for that job
    if (jobId) {
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: {
          customer: true,
          invoice: {
            include: {
              invoiceItems: {
                include: {
                  product: true
                }
              }
            }
          },
          jobProducts: {
            include: {
              product: true
            }
          }
        }
      });
      
      if (!job) {
        return NextResponse.json({ 
          success: false, 
          message: `Job with ID ${jobId} not found` 
        }, { status: 404 });
      }
      
      if (!job.invoice) {
        return NextResponse.json({ 
          success: false, 
          message: `Job with ID ${jobId} has no invoice` 
        }, { status: 400 });
      }
      
      // Calculate updated metrics for this job
      // Get the revenue from invoice subtotal
      const revenue = job.invoice?.subtotal || 0;

      // Calculate material costs - handle wide format products differently
      let materialCosts = 0;
      
      if (job.invoice && job.invoice.invoiceItems) {
        // Go through each invoice item to calculate material costs
        job.invoice.invoiceItems.forEach(item => {
          // If wide format product
          if (item.product.productClass === 'WIDE_FORMAT' && item.area && item.product.costPerSqMeter) {
            // Calculate cost based on area × cost per sq meter × quantity
            const costPerSqMeter = parseFloat(item.product.costPerSqMeter.toString());
            const area = parseFloat(item.area.toString());
            const quantity = item.quantity;
            
            materialCosts += costPerSqMeter * area * quantity;
            console.log(`Wide format cost for ${job.title}: ${costPerSqMeter} * ${area} * ${quantity} = ${costPerSqMeter * area * quantity}`);
          } else {
            // For non-wide format, use the product's base price
            const baseCost = parseFloat(item.product.basePrice.toString());
            const quantity = item.quantity;
            
            materialCosts += baseCost * quantity;
          }
        });
      }

      // Calculate ink costs from inkUsageInMl
      const inkCosts = job.jobProducts.reduce((total, product) => {
        const inkUsage = product.inkUsageInMl || 0;
        const inkCostPerMl = 0.5; // Assume $0.50 per ml of ink
        return total + (inkUsage * inkCostPerMl);
      }, 0);

      // Calculate gross profit
      const totalCosts = materialCosts + inkCosts;
      const grossProfit = parseFloat(revenue.toString()) - totalCosts;

      // Calculate profit margin as a percentage
      const profitMargin = parseFloat(revenue.toString()) > 0 
        ? (grossProfit / parseFloat(revenue.toString())) * 100 
        : 0;

      // Calculate total quantity 
      const totalQuantity = job.jobProducts.reduce((total, product) => {
        return total + (product.quantity || 0);
      }, 0);

      // Calculate total time
      const totalTime = job.jobProducts.reduce((total, product) => {
        return total + (product.timeTaken || 0);
      }, 0);

      // Update the metrics for this job
      await prisma.jobMetrics.upsert({
        where: { jobId: job.id },
        update: {
          revenue: revenue.toString(),
          materialCost: materialCosts.toString(),
          inkCost: inkCosts.toString(),
          grossProfit: grossProfit.toString(),
          profitMargin: profitMargin.toString(),
          totalQuantity,
          totalTime,
          lastUpdated: new Date(),
        },
        create: {
          jobId: job.id,
          revenue: revenue.toString(),
          materialCost: materialCosts.toString(),
          inkCost: inkCosts.toString(),
          grossProfit: grossProfit.toString(),
          profitMargin: profitMargin.toString(),
          totalQuantity,
          totalTime,
          lastUpdated: new Date(),
        }
      });
      
      return NextResponse.json({ 
        success: true, 
        message: `Metrics recalculated for job: ${job.title}` 
      });
    } 
    
    // Otherwise, recalculate all metrics (same as the recalculate endpoint)
    // Clear existing metrics first
    await prisma.$executeRaw`TRUNCATE TABLE "JobMetrics" RESTART IDENTITY CASCADE;`;
    
    // Fetch all jobs with invoices and products
    const jobs = await prisma.job.findMany({
      where: {
        NOT: {
          invoice: null
        },
        jobProducts: {
          some: {}
        }
      },
      include: {
        customer: true,
        invoice: {
          include: {
            invoiceItems: {
              include: {
                product: true
              }
            }
          }
        },
        jobProducts: {
          include: {
            product: true
          }
        }
      }
    });

    if (jobs.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "No jobs with invoices found to recalculate metrics" 
      });
    }

    // Calculate metrics for each job
    const metricsPromises = jobs.map(async job => {
      // Get the revenue from invoice subtotal
      const revenue = job.invoice?.subtotal || 0;

      // Calculate material costs - handle wide format products differently
      let materialCosts = 0;
      
      if (job.invoice && job.invoice.invoiceItems) {
        // Go through each invoice item to calculate material costs
        job.invoice.invoiceItems.forEach(item => {
          // If wide format product
          if (item.product.productClass === 'WIDE_FORMAT' && item.area && item.product.costPerSqMeter) {
            // Calculate cost based on area × cost per sq meter × quantity
            const costPerSqMeter = parseFloat(item.product.costPerSqMeter.toString());
            const area = parseFloat(item.area.toString());
            const quantity = item.quantity;
            
            materialCosts += costPerSqMeter * area * quantity;
          } else {
            // For non-wide format, use the product's base price
            const baseCost = parseFloat(item.product.basePrice.toString());
            const quantity = item.quantity;
            
            materialCosts += baseCost * quantity;
          }
        });
      }

      // Calculate ink costs from inkUsageInMl
      const inkCosts = job.jobProducts.reduce((total, product) => {
        const inkUsage = product.inkUsageInMl || 0;
        const inkCostPerMl = 0.5; // Assume $0.50 per ml of ink
        return total + (inkUsage * inkCostPerMl);
      }, 0);

      // Calculate gross profit
      const totalCosts = materialCosts + inkCosts;
      const grossProfit = parseFloat(revenue.toString()) - totalCosts;

      // Calculate profit margin as a percentage
      const profitMargin = parseFloat(revenue.toString()) > 0 
        ? (grossProfit / parseFloat(revenue.toString())) * 100 
        : 0;

      // Calculate total quantity 
      const totalQuantity = job.jobProducts.reduce((total, product) => {
        return total + (product.quantity || 0);
      }, 0);

      // Calculate total time
      const totalTime = job.jobProducts.reduce((total, product) => {
        return total + (product.timeTaken || 0);
      }, 0);

      // Create metrics in the database
      return prisma.jobMetrics.create({
        data: {
          jobId: job.id,
          revenue: revenue.toString(),
          materialCost: materialCosts.toString(),
          inkCost: inkCosts.toString(),
          grossProfit: grossProfit.toString(),
          profitMargin: profitMargin.toString(),
          totalQuantity,
          totalTime,
          lastUpdated: new Date(),
        }
      });
    });

    await Promise.all(metricsPromises);
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully recalculated metrics for ${jobs.length} jobs` 
    });
    
  } catch (error) {
    console.error('Error in metrics webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process metrics update webhook', details: error.message },
      { status: 500 }
    );
  }
} 