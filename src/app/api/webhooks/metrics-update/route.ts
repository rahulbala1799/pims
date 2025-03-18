import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { JobStatus, JobPriority, Job as PrismaJob, Invoice, InvoiceItem, Product, JobProduct } from '@prisma/client';

// Define TypeScript types to avoid linter errors
interface ProductWithDetails extends Product {
  costPerSqMeter?: any;
  defaultLength?: number;
  defaultWidth?: number;
  productClass: string;
}

interface InvoiceItemWithProduct extends InvoiceItem {
  product: ProductWithDetails;
  area?: any;
}

interface InvoiceWithItems extends Invoice {
  invoiceItems: InvoiceItemWithProduct[];
}

interface JobProductWithDetails extends JobProduct {
  product: ProductWithDetails;
}

interface JobWithRelations extends PrismaJob {
  invoice?: InvoiceWithItems | null;
  jobProducts: JobProductWithDetails[];
  customer?: any;
  title: string;
}

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
      }) as unknown as JobWithRelations;
      
      if (!job) {
        return NextResponse.json({ 
          success: false, 
          message: `Job with ID ${jobId} not found` 
        }, { status: 404 });
      }
      
      // No longer require job to have an invoice - we'll set revenue to 0 if no invoice
      // Calculate updated metrics for this job
      // Get the revenue from invoice subtotal or set to 0 if no invoice
      const revenue = job.invoice ? parseFloat(job.invoice.subtotal.toString()) : 0;

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
      } else if (job.jobProducts) {
        // If job has no invoice but has jobProducts, calculate material costs directly from jobProducts
        for (const jobProduct of job.jobProducts) {
          if (jobProduct.product.productClass === 'WIDE_FORMAT' && jobProduct.product.costPerSqMeter) {
            // For wide format, use dimensions if available
            const costPerSqMeter = parseFloat(jobProduct.product.costPerSqMeter.toString());
            // Estimate area from default dimensions if actual area is not available
            const defaultLength = jobProduct.product.defaultLength || 1;
            const defaultWidth = jobProduct.product.defaultWidth || 1;
            const estimatedArea = defaultLength * defaultWidth;
            
            materialCosts += costPerSqMeter * estimatedArea * jobProduct.quantity;
          } else {
            // For other products, use base price
            const baseCost = parseFloat(jobProduct.product.basePrice.toString());
            materialCosts += baseCost * jobProduct.quantity;
          }
        }
      }

      // Calculate ink costs from inkUsageInMl
      const inkCosts = job.jobProducts.reduce((total, product) => {
        const inkUsage = product.inkUsageInMl || 0;
        const inkCostPerMl = 0.5; // Assume $0.50 per ml of ink
        return total + (inkUsage * inkCostPerMl);
      }, 0);

      // Calculate gross profit
      const totalCosts = materialCosts + inkCosts;
      const grossProfit = revenue - totalCosts;

      // Calculate profit margin as a percentage
      const profitMargin = revenue > 0 
        ? (grossProfit / revenue) * 100 
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
      // Get the revenue from invoice subtotal or set to 0 if no invoice
      const revenue = job.invoice ? parseFloat(job.invoice.subtotal.toString()) : 0;

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
      } else if (job.jobProducts) {
        // If job has no invoice but has jobProducts, calculate material costs directly from jobProducts
        for (const jobProduct of job.jobProducts) {
          if (jobProduct.product.productClass === 'WIDE_FORMAT' && jobProduct.product.costPerSqMeter) {
            // For wide format, use dimensions if available
            const costPerSqMeter = parseFloat(jobProduct.product.costPerSqMeter.toString());
            // Estimate area from default dimensions if actual area is not available
            const defaultLength = jobProduct.product.defaultLength || 1;
            const defaultWidth = jobProduct.product.defaultWidth || 1;
            const estimatedArea = defaultLength * defaultWidth;
            
            materialCosts += costPerSqMeter * estimatedArea * jobProduct.quantity;
          } else {
            // For other products, use base price
            const baseCost = parseFloat(jobProduct.product.basePrice.toString());
            materialCosts += baseCost * jobProduct.quantity;
          }
        }
      }

      // Calculate ink costs from inkUsageInMl
      const inkCosts = job.jobProducts.reduce((total, product) => {
        const inkUsage = product.inkUsageInMl || 0;
        const inkCostPerMl = 0.5; // Assume $0.50 per ml of ink
        return total + (inkUsage * inkCostPerMl);
      }, 0);

      // Calculate gross profit
      const totalCosts = materialCosts + inkCosts;
      const grossProfit = revenue - totalCosts;

      // Calculate profit margin as a percentage
      const profitMargin = revenue > 0 
        ? (grossProfit / revenue) * 100 
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