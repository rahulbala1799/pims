import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
        totalRevenue: Math.round(item.totalRevenue * 100) / 100,
        totalCost: Math.round(item.totalCost * 100) / 100,
        totalProfit: Math.round(item.totalProfit * 100) / 100,
        marginPercent: Math.round(item.averageMargin * 10) / 10
      };
    });
    
    // Sort by profit margin (highest first)
    profitData.sort((a, b) => b.marginPercent - a.marginPercent);
    
    // Calculate overall averages for summary
    const summary = {
      totalJobs: jobs.length,
      totalRevenue: profitData.reduce((sum, item) => sum + item.totalRevenue, 0),
      totalCost: profitData.reduce((sum, item) => sum + item.totalCost, 0),
      totalProfit: profitData.reduce((sum, item) => sum + item.totalProfit, 0),
      overallMargin: 0
    };
    
    summary.overallMargin = summary.totalRevenue > 0 
      ? (summary.totalProfit / summary.totalRevenue) * 100 
      : 0;
    
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