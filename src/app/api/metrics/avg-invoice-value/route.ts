import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { format, subMonths, startOfMonth, endOfMonth, getYear, getMonth } from 'date-fns';

interface MonthlyData {
  month: string;
  averageValue: number;
  totalValue: number;
  invoiceCount: number;
  values: number[];
}

interface MonthlyDataMap {
  [yearMonth: string]: MonthlyData;
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
    
    // Fetch invoices within the date range
    const invoices = await prisma.invoice.findMany({
      where: {
        issueDate: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        id: true,
        invoiceNumber: true,
        issueDate: true,
        status: true,
        totalAmount: true,
        customer: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        issueDate: 'asc'
      }
    });
    
    if (invoices.length === 0) {
      return NextResponse.json({
        data: [],
        summary: {
          totalInvoices: 0,
          totalValue: 0,
          averageValue: 0,
          medianValue: 0,
          minValue: 0,
          maxValue: 0
        }
      });
    }
    
    // Group invoices by month
    const monthlyData: MonthlyDataMap = {};
    const currentYear = new Date().getFullYear();
    
    invoices.forEach(invoice => {
      const date = new Date(invoice.issueDate);
      const yearMonth = format(date, 'yyyy-MM');
      const month = format(date, 'MMM yyyy');
      const amount = parseFloat(invoice.totalAmount.toString());
      
      if (!monthlyData[yearMonth]) {
        monthlyData[yearMonth] = {
          month,
          averageValue: 0,
          totalValue: 0,
          invoiceCount: 0,
          values: []
        };
      }
      
      monthlyData[yearMonth].totalValue += amount;
      monthlyData[yearMonth].invoiceCount += 1;
      monthlyData[yearMonth].values.push(amount);
    });
    
    // Calculate averages and prepare the result
    const data = Object.values(monthlyData).map((item: MonthlyData) => {
      const avg = item.totalValue / item.invoiceCount;
      return {
        month: item.month,
        averageValue: Math.round(avg * 100) / 100,
        totalValue: Math.round(item.totalValue * 100) / 100,
        invoiceCount: item.invoiceCount
      };
    });
    
    // Sort by date (earliest first)
    data.sort((a, b) => {
      return new Date(a.month).getTime() - new Date(b.month).getTime();
    });
    
    // Calculate overall summary statistics
    const allValues = invoices.map(inv => parseFloat(inv.totalAmount.toString()));
    allValues.sort((a, b) => a - b);
    
    const summary = {
      totalInvoices: invoices.length,
      totalValue: Math.round(allValues.reduce((sum, val) => sum + val, 0) * 100) / 100,
      averageValue: Math.round((allValues.reduce((sum, val) => sum + val, 0) / allValues.length) * 100) / 100,
      medianValue: Math.round(getMedian(allValues) * 100) / 100,
      minValue: Math.round(allValues[0] * 100) / 100,
      maxValue: Math.round(allValues[allValues.length - 1] * 100) / 100
    };
    
    return NextResponse.json({
      data,
      summary
    });
    
  } catch (error) {
    console.error('Error fetching average invoice value data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch average invoice value data' },
      { status: 500 }
    );
  }
}

// Helper function to calculate median
function getMedian(values: number[]): number {
  if (values.length === 0) return 0;
  
  const middle = Math.floor(values.length / 2);
  
  if (values.length % 2 === 0) {
    return (values[middle - 1] + values[middle]) / 2;
  }
  
  return values[middle];
} 