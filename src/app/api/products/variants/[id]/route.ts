import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Prevent static generation for this route
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;


const prisma = new PrismaClient();

// GET /api/products/variants/[id] - Get a specific product variant
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    const variant = await prisma.productVariant.findUnique({
      where: { id },
      include: {
        product: true,
      },
    });
    
    if (!variant) {
      return NextResponse.json(
        { error: 'Product variant not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(variant);
  } catch (error) {
    console.error('Error fetching product variant:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product variant' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/products/variants/[id] - Update a product variant
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await request.json();
    
    // Check if variant exists
    const existingVariant = await prisma.productVariant.findUnique({
      where: { id },
    });
    
    if (!existingVariant) {
      return NextResponse.json(
        { error: 'Product variant not found' },
        { status: 404 }
      );
    }
    
    // Update the variant
    const updatedVariant = await prisma.productVariant.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        priceAdjustment: data.priceAdjustment,
        isActive: data.isActive,
      },
      include: {
        product: true,
      },
    });
    
    return NextResponse.json(updatedVariant);
  } catch (error) {
    console.error('Error updating product variant:', error);
    return NextResponse.json(
      { error: 'Failed to update product variant' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/products/variants/[id] - Delete a product variant
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Check if variant exists
    const existingVariant = await prisma.productVariant.findUnique({
      where: { id },
    });
    
    if (!existingVariant) {
      return NextResponse.json(
        { error: 'Product variant not found' },
        { status: 404 }
      );
    }
    
    // Delete the variant
    await prisma.productVariant.delete({
      where: { id },
    });
    
    return NextResponse.json(
      { message: 'Product variant deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting product variant:', error);
    return NextResponse.json(
      { error: 'Failed to delete product variant' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 