import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Prevent static generation for this route
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;


interface JobTypeMetrics {
  jobType: string;
  jobCount: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  averageMargin: number;
}

export async function GET(request: Request) {
  try {
    // Fetch jobs with their metrics and products
    const jobs = await prisma.job.findMany({
      where: {
        status: {
          not: 'CANCELLED'
        },
        metrics: {
          isNot: null
        }
      },
      include: {
        metrics: true,
        jobProducts: {
          include: {
            product: true
          }
        }
      }
    });

    // Group jobs by product class (using first product in each job as the job type)
    const jobTypeMap = new Map<string, JobTypeMetrics>();

    jobs.forEach(job => {
      // Use the product class of the first product as the job type
      const productClass = job.jobProducts[0]?.product?.productClass || 'UNKNOWN';
      
      // Get metrics
      const revenue = job.metrics ? parseFloat(job.metrics.revenue.toString()) : 0;
      const materialCost = job.metrics ? parseFloat(job.metrics.materialCost.toString()) : 0;
      const inkCost = job.metrics ? parseFloat(job.metrics.inkCost.toString()) : 0;
      const totalCost = materialCost + inkCost;
      const profit = revenue - totalCost;
      
      // Skip jobs with no revenue or invalid data
      if (revenue <= 0) return;
      
      if (!jobTypeMap.has(productClass)) {
        jobTypeMap.set(productClass, {
          jobType: productClass,
          jobCount: 0,
          totalRevenue: 0,
          totalCost: 0,
          totalProfit: 0,
          averageMargin: 0
        });
      }
      
      const typeData = jobTypeMap.get(productClass)!;
      typeData.totalRevenue += revenue;
      typeData.totalCost += totalCost;
      typeData.totalProfit += profit;
      typeData.jobCount += 1;
    });
    
    // Calculate average margins and prepare final data
    const profitData = Array.from(jobTypeMap.values()).map(item => {
      // Calculate the average margin for this job type
      item.averageMargin = item.totalRevenue > 0 
        ? (item.totalProfit / item.totalRevenue) * 100 
        : 0;
        
      return {
        jobType: formatJobType(item.jobType),
        jobCount: item.jobCount,
        revenue: Math.round(item.totalRevenue * 100) / 100,
        cost: Math.round(item.totalCost * 100) / 100,
        profit: Math.round(item.totalProfit * 100) / 100,
        margin: item.totalRevenue > 0 ? item.totalProfit / item.totalRevenue : 0
      };
    });
    
    // Sort by profit margin (highest first)
    profitData.sort((a, b) => (b.margin || 0) - (a.margin || 0));
    
    // Find highest and lowest margins
    let highestMargin = 0;
    let highestMarginType = '';
    let lowestMargin = Number.MAX_VALUE;
    let lowestMarginType = '';
    
    profitData.forEach(item => {
      if (item.margin > highestMargin) {
        highestMargin = item.margin;
        highestMarginType = item.jobType;
      }
      
      if (item.margin < lowestMargin && item.margin > 0) {
        lowestMargin = item.margin;
        lowestMarginType = item.jobType;
      }
    });
    
    // Ensure valid values
    if (lowestMargin === Number.MAX_VALUE) lowestMargin = 0;
    
    // Calculate summary stats
    let totalRevenue = 0;
    let totalProfit = 0;
    
    profitData.forEach(item => {
      totalRevenue += item.revenue || 0;
      totalProfit += item.profit || 0;
    });
    
    // Calculate overall margin
    const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) : 0;
    
    const summary = {
      overallMargin: isNaN(overallMargin) ? 0 : overallMargin,
      highestMarginType,
      highestMargin: isNaN(highestMargin) ? 0 : highestMargin,
      lowestMarginType,
      lowestMargin: isNaN(lowestMargin) ? 0 : lowestMargin,
      totalRevenue,
      totalProfit
    };
    
    return NextResponse.json({
      data: profitData,
      summary
    });
    
  } catch (error) {
    console.error('Error fetching profit margin data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profit margin data' },
      { status: 500 }
    );
  }
}

// Helper function to format product class enum values
function formatJobType(jobType: string): string {
  if (!jobType) return 'Unknown';
  
  return jobType
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
}
