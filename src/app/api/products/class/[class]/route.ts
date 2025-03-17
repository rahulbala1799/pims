import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define a simple interface for the transformed product
interface TransformedProduct {
  id: string;
  productClass: string;
  basePrice: number;
  defaultLength?: number;
  defaultWidth?: number;
  [key: string]: any; // Allow other properties
}

// GET /api/products/class/[class] - Get products by class
export async function GET(
  request: NextRequest,
  { params }: { params: { class: string } }
) {
  try {
    const productClass = params.class;
    
    // Validate that the class is valid
    const validClasses = ['PACKAGING', 'WIDE_FORMAT', 'LEAFLETS', 'FINISHED'];
    if (!validClasses.includes(productClass)) {
      return NextResponse.json(
        { error: `Invalid product class: ${productClass}` },
        { status: 400 }
      );
    }
    
    // Fetch products filtered by the specified class
    const products = await prisma.product.findMany({
      where: {
        productClass: productClass as any, // Cast to enum type in Prisma
        isActive: true, // Only return active products
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    // Transform products for client-side use
    const productsWithDefaults = products.map((product: any): TransformedProduct => {
      // Convert Decimal to number for client-side use
      const basePrice = product.basePrice ? Number(product.basePrice) : 0;
      
      // If it's a wide format product, add default dimensions
      if (product.productClass === 'WIDE_FORMAT') {
        return {
          ...product,
          basePrice,
          defaultLength: product.defaultLength ?? 1, // Use existing or default to 1m length
          defaultWidth: product.defaultWidth ?? 1,  // Use existing or default to 1m width
        };
      }
      return {
        ...product,
        basePrice
      };
    });
    
    return NextResponse.json(productsWithDefaults);
  } catch (error) {
    console.error('Error fetching products by class:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products by class' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 