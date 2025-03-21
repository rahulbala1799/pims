import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { format, subMonths, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, getYear, getMonth, getQuarter } from 'date-fns';

// Prevent static generation for this route
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;


interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: Date | string;
  status: string;
  totalAmount: { toString(): string } | number;
  subtotal: { toString(): string } | number;
  taxAmount: { toString(): string } | number;
  customer: {
    id: string;
    name: string;
  };
}

interface PeriodData {
  [year: number]: number;
  change: number;
}

interface ResultsObject {
  [period: string]: PeriodData;
}

// Helper to group invoices by month or quarter
const groupInvoicesByTimePeriod = (invoices: Invoice[], groupBy = 'month') => {
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;
  
  // Initialize results object with all months/quarters
  const results: ResultsObject = {};
  
  if (groupBy === 'month') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.forEach(month => {
      results[month] = {
        [currentYear]: 0,
        [lastYear]: 0,
        change: 0
      };
    });
  } else { // quarter
    ['Q1', 'Q2', 'Q3', 'Q4'].forEach(quarter => {
      results[quarter] = {
        [currentYear]: 0,
        [lastYear]: 0,
        change: 0
      };
    });
  }
  
  // Group invoices by time period
  invoices.forEach(invoice => {
    const invoiceDate = new Date(invoice.issueDate);
    const year = getYear(invoiceDate);
    
    // Skip if not in current or last year
    if (year !== currentYear && year !== lastYear) return;
    
    let period;
    if (groupBy === 'month') {
      const monthIndex = getMonth(invoiceDate);
      period = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][monthIndex];
    } else {
      const quarterIndex = getQuarter(invoiceDate) - 1;
      period = ['Q1', 'Q2', 'Q3', 'Q4'][quarterIndex];
    }
    
    // Add invoice amount to the appropriate period and year
    if (results[period]) {
      results[period][year] += parseFloat(invoice.totalAmount.toString());
    }
  });
  
  // Calculate year-over-year changes
  Object.keys(results).forEach(period => {
    const currentYearAmount = results[period][currentYear];
    const lastYearAmount = results[period][lastYear];
    
    if (lastYearAmount > 0) {
      results[period].change = Math.round(((currentYearAmount - lastYearAmount) / lastYearAmount) * 100);
    } else {
      results[period].change = currentYearAmount > 0 ? 100 : 0;
    }
  });
  
  // Convert to array format
  return Object.keys(results).map(period => {
    return {
      [groupBy === 'month' ? 'month' : 'quarter']: period,
      [currentYear]: results[period][currentYear],
      [lastYear]: results[period][lastYear],
      change: results[period].change
    };
  });
};

// GET /api/metrics/revenue - Get revenue data for reporting
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const groupBy = url.searchParams.get('groupBy') || 'month';
    const timeRange = url.searchParams.get('timeRange') || '1year';
    
    // Calculate date range based on the timeRange parameter
    let startDate;
    const endDate = new Date();
    
    if (timeRange === '2years') {
      // Last 2 years
      startDate = new Date(endDate.getFullYear() - 2, 0, 1);
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
        subtotal: true,
        taxAmount: true,
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
    
    // Group the invoices by month or quarter
    const groupedData = groupInvoicesByTimePeriod(invoices as Invoice[], groupBy);
    
    // Calculate summary metrics
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    
    const summary = {
      totalRevenue: invoices
        .filter(invoice => getYear(new Date(invoice.issueDate)) === currentYear)
        .reduce((sum, invoice) => sum + parseFloat(invoice.totalAmount.toString()), 0),
      
      averageRevenue: 0,
      
      yearOverYearGrowth: 0
    };
    
    // Calculate average revenue
    const periodCount = groupBy === 'month' ? 12 : 4;
    summary.averageRevenue = summary.totalRevenue / periodCount;
    
    // Calculate year-over-year growth
    const currentYearRevenue = invoices
      .filter(invoice => getYear(new Date(invoice.issueDate)) === currentYear)
      .reduce((sum, invoice) => sum + parseFloat(invoice.totalAmount.toString()), 0);
      
    const lastYearRevenue = invoices
      .filter(invoice => getYear(new Date(invoice.issueDate)) === lastYear)
      .reduce((sum, invoice) => sum + parseFloat(invoice.totalAmount.toString()), 0);
    
    if (lastYearRevenue > 0) {
      summary.yearOverYearGrowth = ((currentYearRevenue - lastYearRevenue) / lastYearRevenue) * 100;
    }
    
    return NextResponse.json({
      data: groupedData,
      summary
    });
    
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue data' },
      { status: 500 }
    );
  }
} 