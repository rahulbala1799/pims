import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { differenceInDays, subMonths, format, addDays, parseISO, startOfDay } from 'date-fns';

interface InvoiceWithAmount {
  status: string;
  totalAmount: { toString(): string } | number;
  issueDate: Date | string;
}

interface MonthData {
  month: string;
  invoices: InvoiceWithAmount[];
  dso: number;
}

interface MonthlyDataMap {
  [yearMonth: string]: MonthData;
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
    
    // Get all invoices in the selected period, including paid ones
    const invoices = await prisma.invoice.findMany({
      where: {
        issueDate: {
          gte: startDate,
          lte: endDate
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
          currentDSO: 0,
          dsoTrend: 'stable',
          averageDSO: 0,
          bestDSO: 0,
          worstDSO: 0
        }
      });
    }
    
    // Group by month for trend analysis
    const monthlyData: MonthlyDataMap = {};
    const today = startOfDay(new Date());
    
    // Helper function to calculate DSO for a given invoice set
    const calculateDSO = (invoiceSet: InvoiceWithAmount[]): number => {
      if (invoiceSet.length === 0) return 0;
      
      // Total receivables
      const totalReceivables = invoiceSet.reduce((sum: number, inv: InvoiceWithAmount) => {
        if (inv.status === 'PAID') return sum;
        return sum + parseFloat(inv.totalAmount.toString());
      }, 0);
      
      // Daily average sales
      const totalSales = invoiceSet.reduce((sum: number, inv: InvoiceWithAmount) => sum + parseFloat(inv.totalAmount.toString()), 0);
      const dayCount = differenceInDays(endDate, startDate) || 1; // Avoid division by zero
      const dailySales = totalSales / dayCount;
      
      if (dailySales === 0) return 0;
      
      // DSO formula: (Total Receivables / Total Credit Sales) × Number of Days
      return (totalReceivables / totalSales) * dayCount;
    };
    
    // Calculate overall DSO for summary
    const overallDSO = calculateDSO(invoices);
    
    // Process invoices by month for trend analysis
    invoices.forEach(invoice => {
      const date = new Date(invoice.issueDate);
      const yearMonth = format(date, 'yyyy-MM');
      const month = format(date, 'MMM yyyy');
      
      if (!monthlyData[yearMonth]) {
        monthlyData[yearMonth] = {
          month,
          invoices: [],
          dso: 0
        };
      }
      
      monthlyData[yearMonth].invoices.push(invoice);
    });
    
    // Calculate DSO for each month
    const data = Object.entries(monthlyData).map(([yearMonth, monthData]: [string, MonthData]) => {
      const dso = calculateDSO(monthData.invoices);
      return {
        month: monthData.month,
        dso: Math.round(dso * 10) / 10,
        invoiceCount: monthData.invoices.length,
        totalAmount: Math.round(monthData.invoices.reduce((sum: number, inv: InvoiceWithAmount) => sum + parseFloat(inv.totalAmount.toString()), 0) * 100) / 100
      };
    });
    
    // Sort by date
    data.sort((a, b) => {
      return new Date(a.month).getTime() - new Date(b.month).getTime();
    });
    
    // Calculate DSO trend
    const trend = data.length > 1 
      ? (data[data.length - 1].dso - data[0].dso) / data[0].dso 
      : 0;
    
    let trendDescription;
    if (trend < -0.1) {
      trendDescription = 'improving';
    } else if (trend > 0.1) {
      trendDescription = 'worsening';
    } else {
      trendDescription = 'stable';
    }
    
    // Calculate summary metrics
    const dsoValues = data.map(item => item.dso).filter(val => val > 0);
    
    const summary = {
      currentDSO: Math.round(overallDSO * 10) / 10,
      dsoTrend: trendDescription,
      averageDSO: dsoValues.length > 0 
        ? Math.round((dsoValues.reduce((sum, val) => sum + val, 0) / dsoValues.length) * 10) / 10 
        : 0,
      bestDSO: dsoValues.length > 0 ? Math.round(Math.min(...dsoValues) * 10) / 10 : 0,
      worstDSO: dsoValues.length > 0 ? Math.round(Math.max(...dsoValues) * 10) / 10 : 0,
    };
    
    return NextResponse.json({
      data,
      summary
    });
    
  } catch (error) {
    console.error('Error calculating DSO metrics:', error);
    return NextResponse.json(
      { error: 'Failed to calculate DSO metrics' },
      { status: 500 }
    );
  }
} 