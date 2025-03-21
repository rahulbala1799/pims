import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Prevent static generation for this route
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;


const prisma = new PrismaClient();

// GET /api/products/[id] - Get a specific product
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        productVariants: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        jobProducts: {
          include: {
            job: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        },
        invoiceItems: {
          include: {
            invoice: {
              select: {
                id: true,
                invoiceNumber: true,
                status: true,
              },
            },
          },
        },
      },
    });
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/products/[id] - Update a product
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await request.json();
    
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });
    
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Check if SKU is being changed and if it already exists
    if (data.sku && data.sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findUnique({
        where: { sku: data.sku },
      });
      
      if (skuExists) {
        return NextResponse.json(
          { error: 'A product with this SKU already exists' },
          { status: 409 }
        );
      }
    }
    
    // Update the product
    const updatedProduct = await prisma.product.update({
      where: { id },
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
        finishOptions: data.finishOptions,
        minOrderQuantity: data.minOrderQuantity,
        leadTime: data.leadTime,
        isActive: data.isActive,
        
        // Class-specific fields
        packagingType: data.packagingType,
        printResolution: data.printResolution,
        defaultLength: data.defaultLength,
        defaultWidth: data.defaultWidth,
        costPerSqMeter: data.costPerSqMeter,
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
    
    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/products/[id] - Delete a product
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        jobProducts: true,
        invoiceItems: true,
      },
    });
    
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Check if product is used in jobs or invoices
    if (existingProduct.jobProducts.length > 0 || existingProduct.invoiceItems.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete product as it is used in jobs or invoices',
          jobCount: existingProduct.jobProducts.length,
          invoiceCount: existingProduct.invoiceItems.length
        },
        { status: 409 }
      );
    }
    
    // Delete product variants first
    await prisma.productVariant.deleteMany({
      where: { productId: id },
    });
    
    // Delete the product
    await prisma.product.delete({
      where: { id },
    });
    
    return NextResponse.json(
      { message: 'Product deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 