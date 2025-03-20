import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { differenceInDays } from 'date-fns';

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  customer: string;
  amount: number;
  issueDate: Date;
  dueDate: Date;
  daysOverdue: number;
}

interface AgeBucket {
  count: number;
  total: number;
  invoices: InvoiceData[];
}

type AgeBuckets = {
  'Current': AgeBucket;
  '1-30 days': AgeBucket;
  '31-60 days': AgeBucket;
  '61-90 days': AgeBucket;
  'Over 90 days': AgeBucket;
}

export async function GET(request: Request) {
  try {
    // Get all outstanding (unpaid) invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        status: {
          in: ['PENDING', 'OVERDUE']
        }
      },
      include: {
        customer: true
      },
      orderBy: {
        dueDate: 'asc'
      }
    });
    
    // Group by age buckets
    const today = new Date();
    const ageBuckets: AgeBuckets = {
      'Current': { count: 0, total: 0, invoices: [] },
      '1-30 days': { count: 0, total: 0, invoices: [] },
      '31-60 days': { count: 0, total: 0, invoices: [] },
      '61-90 days': { count: 0, total: 0, invoices: [] },
      'Over 90 days': { count: 0, total: 0, invoices: [] }
    };
    
    // Process each invoice
    invoices.forEach(invoice => {
      const dueDate = new Date(invoice.dueDate);
      const age = differenceInDays(today, dueDate);
      const amount = parseFloat(invoice.totalAmount.toString());
      
      // Categorize by age
      let bucket: keyof AgeBuckets;
      if (age <= 0) {
        bucket = 'Current';
      } else if (age <= 30) {
        bucket = '1-30 days';
      } else if (age <= 60) {
        bucket = '31-60 days';
      } else if (age <= 90) {
        bucket = '61-90 days';
      } else {
        bucket = 'Over 90 days';
      }
      
      // Add to the appropriate bucket
      ageBuckets[bucket].count += 1;
      ageBuckets[bucket].total += amount;
      ageBuckets[bucket].invoices.push({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customer: invoice.customer.name,
        amount,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        daysOverdue: Math.max(0, age)
      });
    });
    
    // Convert to array and calculate totals
    const data = Object.entries(ageBuckets).map(([ageBucket, data]) => ({
      ageBucket,
      count: data.count,
      total: Math.round(data.total * 100) / 100,
      invoices: data.invoices
    }));
    
    // Calculate summary statistics
    const summary = {
      totalOutstanding: Math.round(invoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount.toString()), 0) * 100) / 100,
      invoiceCount: invoices.length,
      averageAge: invoices.length > 0 
        ? Math.round(invoices.reduce((sum, inv) => sum + Math.max(0, differenceInDays(today, new Date(inv.dueDate))), 0) / invoices.length)
        : 0,
      oldestInvoice: invoices.length > 0 
        ? Math.max(...invoices.map(inv => Math.max(0, differenceInDays(today, new Date(inv.dueDate)))))
        : 0
    };
    
    return NextResponse.json({
      data,
      summary
    });
    
  } catch (error) {
    console.error('Error fetching outstanding invoice data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch outstanding invoice data' },
      { status: 500 }
    );
  }
} 