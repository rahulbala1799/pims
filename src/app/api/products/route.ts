import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/products - Get all products
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classFilter = searchParams.get('class');
    const activeOnly = searchParams.get('active') === 'true';
    
    // Build filter object
    const filter: any = {};
    
    if (classFilter) {
      filter.productClass = classFilter;
    }
    
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
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/products - Create a new product
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.sku || !data.productClass || !data.basePrice || !data.unit || !data.createdById) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if SKU already exists
    const existingProduct = await prisma.product.findUnique({
      where: { sku: data.sku },
    });
    
    if (existingProduct) {
      return NextResponse.json(
        { error: 'A product with this SKU already exists' },
        { status: 409 }
      );
    }
    
    // Create the product
    const product = await prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        description: data.description,
        productClass: data.productClass,
        basePrice: data.basePrice,
        unit: data.unit,
        dimensions: data.dimensions,
        weight: data.weight,
        material: data.material,
        finishOptions: data.finishOptions || [],
        minOrderQuantity: data.minOrderQuantity || 1,
        leadTime: data.leadTime,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdById: data.createdById,
        
        // Class-specific fields
        packagingType: data.packagingType,
        printResolution: data.printResolution,
        paperWeight: data.paperWeight,
        foldType: data.foldType,
        bindingType: data.bindingType,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 