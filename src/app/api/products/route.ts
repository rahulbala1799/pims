import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define a type for the raw product from the database
interface ProductBase {
  id: string;
  productClass: string;
  [key: string]: any; // Allow other properties
}

// Define a simple interface for the product type with defaults
interface ProductWithDefaults {
  id: string;
  productClass: string;
  defaultLength?: number;
  defaultWidth?: number;
  [key: string]: any; // Allow other properties
}

// GET /api/products - Get all products
export async function GET(request: NextRequest) {
  try {
    // Get search and filter params
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search') || '';
    const activeOnly = searchParams.get('active') !== 'false'; // Default to true
    
    // Build where clause for the query
    const where: any = {};
    
    // Add active filter if specified
    if (activeOnly) {
      where.active = true;
    }
    
    // Add search term if provided
    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { sku: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }
    
    // Fetch products
    const products = await prisma.product.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
    });
    
    // Add default dimensions for wide format products
    const productsWithDefaults = products.map((product: ProductBase): ProductWithDefaults => {
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
        
        // Wide Format specific fields
        defaultLength: data.defaultLength,
        defaultWidth: data.defaultWidth,
        costPerSqMeter: data.costPerSqMeter,
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