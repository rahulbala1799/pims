import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Prevent static generation for this route
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// GET /api/portal/catalog/stats - Get catalog statistics for a customer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Check if the customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Get all catalog entries for this customer
    const catalogEntries = await prisma.customerProductCatalog.findMany({
      where: {
        customerId: customerId,
      },
    });

    // Calculate statistics
    const totalProducts = catalogEntries.length;
    const visibleProducts = catalogEntries.filter(entry => entry.isVisible).length;
    const hasCustomPricing = catalogEntries.some(entry => entry.customPrice !== null);

    // Get the last updated date
    let lastUpdated = 'Never';
    if (catalogEntries.length > 0) {
      const dates = catalogEntries.map(entry => entry.updatedAt);
      const latestDate = new Date(Math.max(...dates.map(date => date.getTime())));
      lastUpdated = latestDate.toLocaleDateString();
    }

    return NextResponse.json({
      customerId,
      totalProducts,
      visibleProducts,
      hasCustomPricing,
      lastUpdated,
    });

  } catch (error) {
    console.error('Error fetching catalog statistics:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching catalog statistics' },
      { status: 500 }
    );
  }
} 