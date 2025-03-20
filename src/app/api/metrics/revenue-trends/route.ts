import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get the current date
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    // Format dates for comparison
    const formattedThirtyDaysAgo = thirtyDaysAgo.toISOString().split('T')[0];
    
    // Last 30 days sales - grouped by date
    const lastThirtyDaysSales = await fetchLastThirtyDaysSales(formattedThirtyDaysAgo);
    
    // Top 10 products by revenue
    const topProducts = await fetchTopProducts();
    
    // Weekly growth calculation
    const weeklyGrowth = await calculateWeeklyGrowth();
    
    return NextResponse.json({
      lastThirtyDaysSales,
      topProducts,
      weeklyGrowth
    });
  } catch (error) {
    console.error('Error fetching revenue trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue trends data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Fetch last 30 days of sales data from the database
 */
async function fetchLastThirtyDaysSales(formattedThirtyDaysAgo: string) {
  // Get all invoices from the last 30 days
  const invoices = await prisma.invoice.findMany({
    where: {
      issueDate: {
        gte: new Date(formattedThirtyDaysAgo)
      },
      status: {
        in: ['PENDING', 'PAID'],
        not: 'CANCELLED'
      }
    },
    select: {
      issueDate: true,
      subtotal: true
    },
    orderBy: {
      issueDate: 'asc'
    }
  });
  
  // Group invoices by date and sum the total amounts
  const salesByDate = new Map();
  
  // Initialize all dates in the last 30 days with zero sales
  const lastThirtyDays = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date(formattedThirtyDaysAgo);
    date.setDate(date.getDate() + i);
    const dateString = date.toISOString().split('T')[0];
    salesByDate.set(dateString, 0);
  }
  
  // Add invoice amounts to the corresponding dates
  invoices.forEach(invoice => {
    const dateString = invoice.issueDate.toISOString().split('T')[0];
    const currentAmount = salesByDate.get(dateString) || 0;
    salesByDate.set(dateString, currentAmount + Number(invoice.subtotal));
  });
  
  // Convert Map to array
  const result = Array.from(salesByDate.entries()).map(([date, amount]) => ({
    date,
    amount: Number(amount)
  }));
  
  return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Fetch top 10 products by revenue
 */
async function fetchTopProducts() {
  // Get all invoice items with product information
  const invoiceItems = await prisma.invoiceItem.findMany({
    select: {
      productId: true,
      quantity: true,
      totalPrice: true,
      product: {
        select: {
          id: true,
          name: true
        }
      }
    },
    where: {
      invoice: {
        issueDate: {
          gte: new Date(new Date().setDate(new Date().getDate() - 90)) // Last 90 days
        },
        status: {
          in: ['PENDING', 'PAID'],
          not: 'CANCELLED'
        }
      }
    }
  });
  
  // Group by product and calculate total revenue
  const productMap = new Map();
  
  invoiceItems.forEach(item => {
    const productId = item.productId;
    const existingProduct = productMap.get(productId) || {
      id: item.product.id,
      name: item.product.name,
      quantity: 0,
      revenue: 0
    };
    
    existingProduct.quantity += item.quantity;
    existingProduct.revenue += Number(item.totalPrice);
    
    productMap.set(productId, existingProduct);
  });
  
  // Convert to array and sort by revenue (descending)
  const sortedProducts = Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
  
  return sortedProducts;
}

/**
 * Calculate week-on-week growth
 */
async function calculateWeeklyGrowth() {
  // Calculate start dates for current and previous weeks
  const today = new Date();
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - today.getDay()); // Sunday of current week
  currentWeekStart.setHours(0, 0, 0, 0);
  
  const previousWeekStart = new Date(currentWeekStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7); // Sunday of previous week
  
  const previousWeekEnd = new Date(currentWeekStart);
  previousWeekEnd.setSeconds(previousWeekEnd.getSeconds() - 1); // Just before current week started
  
  // Get invoice totals for current week
  const currentWeekRevenue = await prisma.invoice.aggregate({
    _sum: {
      subtotal: true
    },
    where: {
      issueDate: {
        gte: currentWeekStart
      },
      status: {
        in: ['PENDING', 'PAID'],
        not: 'CANCELLED'
      }
    }
  });
  
  // Get invoice totals for previous week
  const previousWeekRevenue = await prisma.invoice.aggregate({
    _sum: {
      subtotal: true
    },
    where: {
      issueDate: {
        gte: previousWeekStart,
        lt: currentWeekStart
      },
      status: {
        in: ['PENDING', 'PAID'],
        not: 'CANCELLED'
      }
    }
  });
  
  // Convert Decimal to number and handle null values
  const currentWeek = Number(currentWeekRevenue._sum.subtotal || 0);
  const previousWeek = Number(previousWeekRevenue._sum.subtotal || 0);
  
  // Calculate growth percentage (handle division by zero)
  const growthPercentage = previousWeek === 0 
    ? 0
    : ((currentWeek - previousWeek) / previousWeek) * 100;
  
  return {
    currentWeek,
    previousWeek,
    growthPercentage
  };
} 