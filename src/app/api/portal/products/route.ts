import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authMiddleware } from '../middleware';

// Prevent static generation for this route
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// GET /api/portal/products - Get all visible products for a customer
export async function GET(request: NextRequest) {
  try {
    // This would normally go through authMiddleware, but for initial setup we'll do a simplified version
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // First try to get customer-specific catalog entries
    const catalogEntries = await prisma.customerProductCatalog.findMany({
      where: {
        customerId: customerId,
        isVisible: true,
      },
      include: {
        product: true
      }
    });

    // If no catalog entries exist, return empty products array
    if (catalogEntries.length === 0) {
      return NextResponse.json({ products: [] });
    }

    // Transform into customer-specific format
    const products = catalogEntries.map(entry => {
      return {
        id: entry.product.id,
        name: entry.customerProductName || entry.product.name,
        sku: entry.customerProductCode || entry.product.sku,
        description: entry.product.description,
        productClass: entry.product.productClass,
        price: entry.customPrice || entry.product.basePrice,
        unit: entry.product.unit,
        dimensions: entry.product.dimensions,
        material: entry.product.material,
        finishOptions: entry.product.finishOptions,
        minOrderQuantity: entry.product.minOrderQuantity,
        leadTime: entry.product.leadTime,
        isCustomPriced: entry.customPrice !== null,
      };
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching products' },
      { status: 500 }
    );
  }
}

// GET /api/portal/products/:id - Get a specific product details
export async function GET_PRODUCT_BY_ID(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productId = params.id;
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Get the customer-specific product catalog entry
    const catalogEntry = await prisma.customerProductCatalog.findFirst({
      where: {
        customerId: customerId,
        productId: productId,
        isVisible: true,
      },
      include: {
        product: true
      }
    });

    if (!catalogEntry) {
      return NextResponse.json(
        { error: 'Product not found or not available for this customer' },
        { status: 404 }
      );
    }

    // Get product variants
    const variants = await prisma.productVariant.findMany({
      where: {
        productId: productId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        priceAdjustment: true
      }
    });

    // Transform into customer-specific format
    const product = {
      id: catalogEntry.product.id,
      name: catalogEntry.customerProductName || catalogEntry.product.name,
      sku: catalogEntry.customerProductCode || catalogEntry.product.sku,
      description: catalogEntry.product.description,
      productClass: catalogEntry.product.productClass,
      price: catalogEntry.customPrice || catalogEntry.product.basePrice,
      unit: catalogEntry.product.unit,
      dimensions: catalogEntry.product.dimensions,
      material: catalogEntry.product.material,
      finishOptions: catalogEntry.product.finishOptions,
      minOrderQuantity: catalogEntry.product.minOrderQuantity,
      leadTime: catalogEntry.product.leadTime,
      isCustomPriced: catalogEntry.customPrice !== null,
      variants: variants.map((variant) => ({
        id: variant.id,
        name: variant.name,
        description: variant.description,
        priceAdjustment: variant.priceAdjustment,
      })),
    };

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error fetching product details:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching product details' },
      { status: 500 }
    );
  }
} 