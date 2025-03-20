import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // In a real implementation, we would query the database with Prisma
    // For now, we're returning sample data
    
    // Sample data for last 30 days sales
    const lastThirtyDaysSales = generateLastThirtyDaysSales();
    
    // Sample data for top 10 products
    const topProducts = [
      { id: '1', name: 'Business Cards', quantity: 250, revenue: 5600 },
      { id: '2', name: 'Brochures', quantity: 180, revenue: 4900 },
      { id: '3', name: 'Flyers', quantity: 320, revenue: 4200 },
      { id: '4', name: 'Posters', quantity: 95, revenue: 3800 },
      { id: '5', name: 'Banners', quantity: 42, revenue: 3500 },
      { id: '6', name: 'Letterheads', quantity: 220, revenue: 2900 },
      { id: '7', name: 'Envelopes', quantity: 300, revenue: 2400 },
      { id: '8', name: 'Labels', quantity: 450, revenue: 2200 },
      { id: '9', name: 'Booklets', quantity: 65, revenue: 1900 },
      { id: '10', name: 'Calendars', quantity: 80, revenue: 1600 }
    ];
    
    // Sample data for weekly growth
    const currentWeek = 28500;
    const previousWeek = 25200;
    const growthPercentage = ((currentWeek - previousWeek) / previousWeek) * 100;
    
    return NextResponse.json({
      lastThirtyDaysSales,
      topProducts,
      weeklyGrowth: {
        currentWeek,
        previousWeek,
        growthPercentage
      }
    });
  } catch (error) {
    console.error('Error fetching revenue trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue trends data' },
      { status: 500 }
    );
  }
}

// Helper function to generate last 30 days of sales data
function generateLastThirtyDaysSales() {
  const sales = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    // Generate more realistic data - weekends typically have lower sales
    let amount = Math.floor(Math.random() * 4000) + 2000; // Base amount between 2000-6000
    
    // Weekend adjustment (lower sales on weekends)
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      amount = Math.floor(amount * 0.6); // 60% of weekday sales
    }
    
    // Trend - generally increasing
    amount += i * 30; // Slight upward trend
    
    sales.push({
      date: date.toISOString().split('T')[0],
      amount
    });
  }
  
  return sales;
} 