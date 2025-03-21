import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Prevent static generation for this route
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;


// POST /api/metrics/recalculate - Force recalculation of all job metrics
export async function POST() {
  try {
    // Step 1: Delete all existing job metrics
    await prisma.$executeRaw`TRUNCATE TABLE "JobMetrics" RESTART IDENTITY CASCADE;`;
    
    // Step 2: Fetch all jobs with invoices and products
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

    // Step 3: Calculate metrics for each job
    const metricsPromises = jobs.map(async job => {
      // Get the revenue from invoice subtotal (amount before tax)
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
            console.log(`Wide format cost: ${costPerSqMeter} * ${area} * ${quantity} = ${costPerSqMeter * area * quantity}`);
          } else {
            // For non-wide format, use the product's base price
            const baseCost = parseFloat(item.product.basePrice.toString());
            const quantity = item.quantity;
            
            materialCosts += baseCost * quantity;
            console.log(`Standard cost: ${baseCost} * ${quantity} = ${baseCost * quantity}`);
          }
        });
      } else {
        // Fallback if no invoice items - use job products
        job.jobProducts.forEach(product => {
          const baseCost = parseFloat(product.product.basePrice.toString());
          const quantity = product.quantity;
          materialCosts += baseCost * quantity;
        });
      }

      // Calculate the ink cost based on the product class
      const inkCost = job.jobProducts.reduce((total, product) => {
        if (product.product.productClass === 'PACKAGING') {
          // For packaging, use inkCostPerUnit * completedQuantity
          const inkCostPerUnit = product.inkCostPerUnit ? parseFloat(product.inkCostPerUnit.toString()) : 0.04;
          const completedQuantity = product.completedQuantity || 0;
          const cost = inkCostPerUnit * completedQuantity;
          console.log(`Ink cost for packaging product ${product.product.name}: ${cost}€`);
          return total + cost;
        } else if (product.product.productClass === 'LEAFLETS') {
          // For leaflets, use a rate of 0.004€ per page * quantity
          const inkCostPerPage = 0.004; // 0.4 cents per page
          const completedQuantity = product.completedQuantity || 0;
          const cost = inkCostPerPage * completedQuantity;
          console.log(`Ink cost for leaflet product ${product.product.name}: ${cost}€`);
          return total + cost;
        } else {
          // For other products, use inkUsageInMl * cost per ml (0.16€)
          const inkUsage = product.inkUsageInMl || 0;
          const inkCostPerMl = 0.16; // 16 cents per ml
          const cost = inkUsage * inkCostPerMl;
          console.log(`Ink cost for standard product ${product.product.name}: ${cost}€`);
          return total + cost;
        }
      }, 0);

      // Calculate gross profit
      const totalCosts = materialCosts + inkCost;
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

      console.log(`Job ${job.title}: Revenue = €${revenue}, Material = €${materialCosts}, Ink = €${inkCost}, Profit = €${grossProfit}, Margin = ${profitMargin}%`);

      // Create metrics in the database
      return prisma.jobMetrics.create({
        data: {
          jobId: job.id,
          revenue: revenue.toString(),
          materialCost: materialCosts.toString(),
          inkCost: inkCost.toString(),
          grossProfit: grossProfit.toString(),
          profitMargin: profitMargin.toString(),
          totalQuantity,
          totalTime,
          lastUpdated: new Date(),
        }
      });
    });

    const metrics = await Promise.all(metricsPromises);
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully recalculated metrics for ${metrics.length} jobs` 
    });
    
  } catch (error: any) {
    console.error('Error recalculating job metrics:', error);
    return NextResponse.json(
      { error: 'Failed to recalculate job metrics', details: error.message },
      { status: 500 }
    );
  }
} 