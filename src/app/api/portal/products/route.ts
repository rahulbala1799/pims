import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware';

// Prevent static generation for this route
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;


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

    // Get customer-specific catalog by using direct queries
    const customerCatalog = await prisma.$queryRaw`
      SELECT 
        cpc.*, 
        p.id as "productId", 
        p.name as "productName", 
        p.sku, 
        p.description, 
        p."productClass", 
        p."basePrice", 
        p.unit, 
        p.dimensions, 
        p.material, 
        p."finishOptions", 
        p."minOrderQuantity", 
        p."leadTime", 
        p."isActive"
      FROM customer_product_catalog cpc
      JOIN product p ON cpc."productId" = p.id
      WHERE cpc."customerId" = ${customerId}
      AND cpc."isVisible" = true
    `;

    // Transform into customer-specific format
    const products = Array.isArray(customerCatalog) ? customerCatalog.map((catalog: any) => {
      return {
        id: catalog.productId,
        name: catalog.customerProductName || catalog.productName,
        sku: catalog.customerProductCode || catalog.sku,
        description: catalog.description,
        productClass: catalog.productClass,
        price: catalog.customPrice || catalog.basePrice,
        unit: catalog.unit,
        dimensions: catalog.dimensions,
        material: catalog.material,
        finishOptions: catalog.finishOptions,
        minOrderQuantity: catalog.minOrderQuantity,
        leadTime: catalog.leadTime,
        isCustomPriced: catalog.customPrice !== null,
      };
    }) : [];

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

    // Get the customer-specific product catalog entry with raw SQL
    const catalogEntries = await prisma.$queryRaw`
      SELECT 
        cpc.*, 
        p.id as "productId", 
        p.name as "productName", 
        p.sku, 
        p.description, 
        p."productClass", 
        p."basePrice", 
        p.unit, 
        p.dimensions, 
        p.material, 
        p."finishOptions", 
        p."minOrderQuantity", 
        p."leadTime", 
        p."isActive"
      FROM customer_product_catalog cpc
      JOIN product p ON cpc."productId" = p.id
      WHERE cpc."customerId" = ${customerId}
      AND cpc."productId" = ${productId}
      AND cpc."isVisible" = true
    `;

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

    const catalogEntry = Array.isArray(catalogEntries) && catalogEntries.length > 0 ? catalogEntries[0] : null;

    if (!catalogEntry) {
      return NextResponse.json(
        { error: 'Product not found or not available for this customer' },
        { status: 404 }
      );
    }

    // Transform into customer-specific format
    const product = {
      id: catalogEntry.productId,
      name: catalogEntry.customerProductName || catalogEntry.productName,
      sku: catalogEntry.customerProductCode || catalogEntry.sku,
      description: catalogEntry.description,
      productClass: catalogEntry.productClass,
      price: catalogEntry.customPrice || catalogEntry.basePrice,
      unit: catalogEntry.unit,
      dimensions: catalogEntry.dimensions,
      material: catalogEntry.material,
      finishOptions: catalogEntry.finishOptions,
      minOrderQuantity: catalogEntry.minOrderQuantity,
      leadTime: catalogEntry.leadTime,
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