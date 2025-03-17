import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Valid product classes
const PRODUCT_CLASSES = ['PACKAGING', 'WIDE_FORMAT', 'LEAFLETS', 'FINISHED'];

// GET /api/products/class/[class] - Get products by class
export async function GET(
  request: Request,
  { params }: { params: { class: string } }
) {
  try {
    const classParam = params.class.toUpperCase();
    
    // Validate that the class is valid
    if (!PRODUCT_CLASSES.includes(classParam)) {
      return NextResponse.json(
        { 
          error: 'Invalid product class',
          validClasses: PRODUCT_CLASSES
        },
        { status: 400 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';
    
    // Build filter object
    const filter: any = {
      productClass: classParam,
    };
    
    if (activeOnly) {
      filter.isActive = true;
    }
    
    const products = await prisma.product.findMany({
      where: filter,
      include: {
        productVariants: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products by class:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 