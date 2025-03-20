import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { authMiddleware } from '../middleware';

const prisma = new PrismaClient();

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

    // Get customer-specific catalog first
    const customerCatalog = await prisma.customerProductCatalog.findMany({
      where: {
        customerId: customerId,
        isVisible: true,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            description: true,
            productClass: true,
            basePrice: true,
            unit: true,
            dimensions: true,
            material: true,
            finishOptions: true,
            minOrderQuantity: true,
            leadTime: true,
            isActive: true,
          },
        },
      },
    });

    // Transform into customer-specific format
    const products = customerCatalog.map((catalog: any) => {
      return {
        id: catalog.product.id,
        name: catalog.customerProductName || catalog.product.name,
        sku: catalog.customerProductCode || catalog.product.sku,
        description: catalog.product.description,
        productClass: catalog.product.productClass,
        price: catalog.customPrice || catalog.product.basePrice,
        unit: catalog.product.unit,
        dimensions: catalog.product.dimensions,
        material: catalog.product.material,
        finishOptions: catalog.product.finishOptions,
        minOrderQuantity: catalog.product.minOrderQuantity,
        leadTime: catalog.product.leadTime,
        isCustomPriced: catalog.customPrice !== null,
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
        product: {
          include: {
            productVariants: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!catalogEntry) {
      return NextResponse.json(
        { error: 'Product not found or not available for this customer' },
        { status: 404 }
      );
    }

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
      variants: catalogEntry.product.productVariants.map((variant: any) => ({
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