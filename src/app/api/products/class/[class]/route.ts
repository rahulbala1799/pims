import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define a simple interface for the product type
interface ProductWithClass {
  id: string;
  productClass: string;
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
        active: true, // Only return active products
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    // Map default dimensions into the response for wide format products
    const productsWithDefaults = products.map((product: ProductWithClass) => {
      // If it's a wide format product, add default dimensions
      if (product.productClass === 'WIDE_FORMAT') {
        return {
          ...product,
          defaultLength: 1, // Default 1m length
          defaultWidth: 1,  // Default 1m width
        };
      }
      return product;
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