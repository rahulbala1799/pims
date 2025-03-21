import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Prevent static generation for this route
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// GET /api/portal/catalog - Get all catalog entries for a customer
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

    // Get all catalog entries for this customer
    const catalogEntries = await prisma.customerProductCatalog.findMany({
      where: {
        customerId: customerId,
      },
    });

    return NextResponse.json({
      catalog: catalogEntries
    });

  } catch (error) {
    console.error('Error fetching customer catalog:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching the customer catalog' },
      { status: 500 }
    );
  }
}

// POST /api/portal/catalog - Update customer product catalog
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { customerId, products } = data;

    if (!customerId || !products || !Array.isArray(products)) {
      return NextResponse.json(
        { error: 'Customer ID and products array are required' },
        { status: 400 }
      );
    }

    // Verify the customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Process each product in the catalog
    const results = await Promise.all(products.map(async (product) => {
      if (!product.productId) {
        return { error: 'Product ID is required', productId: product.productId };
      }

      // Check if product exists
      const productExists = await prisma.product.findUnique({
        where: { id: product.productId },
      });

      if (!productExists) {
        return { error: 'Product not found', productId: product.productId };
      }

      try {
        // Check if this customer-product combination already exists
        const existingEntry = await prisma.customerProductCatalog.findFirst({
          where: {
            customerId: customerId,
            productId: product.productId,
          },
        });

        if (existingEntry) {
          // Update existing entry
          const updated = await prisma.customerProductCatalog.update({
            where: { id: existingEntry.id },
            data: {
              customPrice: product.customPrice,
              isVisible: product.isVisible,
              customerProductCode: product.customerProductCode || null,
              customerProductName: product.customerProductName || null,
              updatedAt: new Date(),
            },
          });
          return { success: true, operation: 'update', id: updated.id };
        } else {
          // Create new entry
          const created = await prisma.customerProductCatalog.create({
            data: {
              customerId: customerId,
              productId: product.productId,
              customPrice: product.customPrice,
              isVisible: product.isVisible,
              customerProductCode: product.customerProductCode || null,
              customerProductName: product.customerProductName || null,
            },
          });
          return { success: true, operation: 'create', id: created.id };
        }
      } catch (err) {
        console.error(`Error processing product ${product.productId}:`, err);
        return { error: 'Failed to process product', productId: product.productId };
      }
    }));

    // Count successes and failures
    const successes = results.filter(r => r.success).length;
    const failures = results.filter(r => r.error).length;

    return NextResponse.json({
      message: `Processed ${successes} products successfully, ${failures} failed`,
      results: results,
    });

  } catch (error) {
    console.error('Error updating customer catalog:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating the customer catalog' },
      { status: 500 }
    );
  }
} 