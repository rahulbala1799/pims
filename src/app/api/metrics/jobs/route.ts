import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Decimal } from 'decimal.js';

// GET /api/metrics/jobs - Get job metrics data
export async function GET(request: Request) {
  try {
    // Check if we should force recalculation
    const url = new URL(request.url);
    const forceRecalculate = url.searchParams.get('force') === 'true';
    
    // First check if we have any job metrics already and we're not forcing recalculation
    if (!forceRecalculate) {
      const existingMetrics = await prisma.jobMetrics.findMany({
        include: {
          job: {
            include: {
              customer: true
            }
          }
        }
      });
  
      if (existingMetrics.length > 0) {
        // Return existing metrics
        return NextResponse.json(existingMetrics);
      }
    }

    // If no metrics exist or we're forcing recalculation, fetch jobs with invoices and products
    const jobs = await prisma.job.findMany({
      where: {
        NOT: {
          invoiceId: null
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
      return NextResponse.json([]);
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
            console.log(`Wide format cost for ${job.title}: ${costPerSqMeter} * ${area} * ${quantity} = ${costPerSqMeter * area * quantity}`);
          } else {
            // For non-wide format, use the product's base price
            const baseCost = parseFloat(item.product.basePrice.toString());
            const quantity = item.quantity;
            
            materialCosts += baseCost * quantity;
            console.log(`Standard cost for ${job.title}: ${baseCost} * ${quantity} = ${baseCost * quantity}`);
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

      // Calculate ink costs - different method depending on product class
      const inkCosts = job.jobProducts.reduce((total, product) => {
        // For packaging products, use inkCostPerUnit × completedQuantity
        if (product.product.productClass === 'PACKAGING') {
          const inkCostPerUnit = product.inkCostPerUnit ? parseFloat(product.inkCostPerUnit.toString()) : 0;
          const completedQuantity = product.completedQuantity || 0;
          console.log(`Packaging ink cost for ${job.title}: €${inkCostPerUnit} × ${completedQuantity} = €${inkCostPerUnit * completedQuantity}`);
          return total + (inkCostPerUnit * completedQuantity);
        }
        // For leaflet products, use fixed cost of 0.004€ per page
        else if (product.product.productClass === 'LEAFLETS') {
          const inkCostPerPage = 0.004; // 0.004€ per page for leaflets
          const completedQuantity = product.completedQuantity || 0;
          console.log(`Leaflet ink cost for ${job.title}: €${inkCostPerPage} × ${completedQuantity} = €${inkCostPerPage * completedQuantity}`);
          return total + (inkCostPerPage * completedQuantity);
        }
        // For other products (especially wide format), use inkUsageInMl × cost per ml
        else {
          const inkUsage = product.inkUsageInMl || 0;
          const inkCostPerMl = 0.16; // 0.16€ per ml of ink
          console.log(`Ink usage cost for ${job.title}: ${inkUsage} ml × €${inkCostPerMl} = €${inkUsage * inkCostPerMl}`);
          return total + (inkUsage * inkCostPerMl);
        }
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
      
      console.log(`Job ${job.title}: Revenue = €${revenue}, Material = €${materialCosts}, Ink = €${inkCosts}, Profit = €${grossProfit}, Margin = ${profitMargin}%`);

      // Create or update metrics in the database
      return prisma.jobMetrics.upsert({
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
        },
        include: {
          job: {
            include: {
              customer: true
            }
          }
        }
      });
    });

    const metrics = await Promise.all(metricsPromises);
    return NextResponse.json(metrics);
    
  } catch (error) {
    console.error('Error fetching job metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job metrics' },
      { status: 500 }
    );
  }
} 