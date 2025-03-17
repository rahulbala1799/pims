import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/products/[id]/variants - Get all variants for a product
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;
    
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Get all variants for the product
    const variants = await prisma.productVariant.findMany({
      where: { productId },
      orderBy: { name: 'asc' },
    });
    
    return NextResponse.json(variants);
  } catch (error) {
    console.error('Error fetching product variants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product variants' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/products/[id]/variants - Create a new variant for a product
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;
    const data = await request.json();
    
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Validate required fields
    if (!data.name || data.priceAdjustment === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create the variant
    const variant = await prisma.productVariant.create({
      data: {
        productId,
        name: data.name,
        description: data.description,
        priceAdjustment: data.priceAdjustment,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
    
    return NextResponse.json(variant, { status: 201 });
  } catch (error) {
    console.error('Error creating product variant:', error);
    return NextResponse.json(
      { error: 'Failed to create product variant' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 