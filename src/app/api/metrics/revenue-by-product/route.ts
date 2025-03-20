import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { subMonths, getYear, getMonth, getQuarter } from 'date-fns';

interface ProductClassRevenue {
  productClass: string;
  totalRevenue: number;
  percentage: number;
  jobCount: number;
  invoiceCount: number;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const timeRange = url.searchParams.get('timeRange') || '12months';
    
    // Calculate date range based on the timeRange parameter
    let startDate;
    const endDate = new Date();
    
    if (timeRange === '24months') {
      // Last 24 months
      startDate = subMonths(endDate, 24);
    } else if (timeRange === 'ytd') {
      // Year to date
      startDate = new Date(endDate.getFullYear(), 0, 1);
    } else {
      // Default: last 12 months
      startDate = subMonths(endDate, 12);
    }
    
    // Fetch invoices with their items and associated products
    const invoices = await prisma.invoice.findMany({
      where: {
        issueDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        invoiceItems: {
          include: {
            product: true
          }
        }
      }
    });
    
    // Group revenue by product class
    const productClassMap = new Map<string, ProductClassRevenue>();
    let totalRevenue = 0;
    
    // Process each invoice and its items
    invoices.forEach(invoice => {
      invoice.invoiceItems.forEach(item => {
        const productClass = item.product.productClass || 'UNKNOWN';
        const revenue = parseFloat(item.totalPrice.toString());
        totalRevenue += revenue;
        
        if (!productClassMap.has(productClass)) {
          productClassMap.set(productClass, {
            productClass,
            totalRevenue: 0,
            percentage: 0,
            jobCount: 0,
            invoiceCount: 0
          });
        }
        
        const classData = productClassMap.get(productClass)!;
        classData.totalRevenue += revenue;
        
        // Count this invoice only once per product class
        const invoiceKey = `${invoice.id}-${productClass}`;
        if (!classData.invoiceCount) {
          classData.invoiceCount = 1;
        }
      });
    });
    
    // Also fetch job data to get job counts by product class
    const jobs = await prisma.job.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        jobProducts: {
          include: {
            product: true
          }
        }
      }
    });
    
    // Count jobs by product class
    jobs.forEach(job => {
      const productClasses = new Set<string>();
      
      job.jobProducts.forEach(jp => {
        const productClass = jp.product.productClass;
        productClasses.add(productClass);
      });
      
      // Increment job count for each product class in this job
      productClasses.forEach(pc => {
        if (productClassMap.has(pc)) {
          const classData = productClassMap.get(pc)!;
          classData.jobCount += 1;
        }
      });
    });
    
    // Calculate percentages and prepare the result
    const data = Array.from(productClassMap.values()).map(item => {
      return {
        productClass: formatProductClass(item.productClass),
        totalRevenue: Math.round(item.totalRevenue * 100) / 100,
        percentage: Math.round((item.totalRevenue / totalRevenue) * 1000) / 10,
        jobCount: item.jobCount,
        invoiceCount: item.invoiceCount
      };
    });
    
    // Sort by revenue (highest first)
    data.sort((a, b) => b.totalRevenue - a.totalRevenue);
    
    // Prepare summary
    const summary = {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalProductClasses: data.length,
      topProductClass: data.length > 0 ? data[0].productClass : 'None',
      topProductClassRevenue: data.length > 0 ? data[0].totalRevenue : 0,
      topProductClassPercentage: data.length > 0 ? data[0].percentage : 0
    };
    
    return NextResponse.json({
      data,
      summary
    });
    
  } catch (error) {
    console.error('Error fetching revenue by product class:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue by product class' },
      { status: 500 }
    );
  }
}

// Helper function to format product class names
function formatProductClass(productClass: string): string {
  if (!productClass) return 'Unknown';
  
  return productClass
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
} 