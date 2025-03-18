import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/jobs/:id/progress - Update job progress and costs
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    
    if (!data.jobProducts || !Array.isArray(data.jobProducts)) {
      return NextResponse.json(
        { error: 'Job products data is required' },
        { status: 400 }
      );
    }

    // Check if job exists
    const existingJob = await prisma.job.findUnique({
      where: {
        id: params.id,
      },
      include: {
        jobProducts: true,
        customer: true,
        assignedTo: true,
        createdBy: true,
        invoice: true,
      },
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Update job status if all products are completed
    const allCompleted = data.jobProducts.every((product: any) => 
      product.completedQuantity === product.quantity
    );

    if (allCompleted && existingJob.status !== 'COMPLETED') {
      await prisma.job.update({
        where: { id: params.id },
        data: { status: 'COMPLETED' },
      });
    } else if (!allCompleted && existingJob.status !== 'IN_PROGRESS' && existingJob.status !== 'COMPLETED') {
      await prisma.job.update({
        where: { id: params.id },
        data: { status: 'IN_PROGRESS' },
      });
    }

    // Update the original products first
    const updatePromises = data.jobProducts.map(async (product: any) => {
      return prisma.jobProduct.update({
        where: { id: product.id },
        data: {
          quantity: parseInt(product.quantity.toString(), 10),
          totalPrice: parseFloat(product.totalPrice.toString()),
          completedQuantity: parseInt(product.completedQuantity?.toString() || '0', 10),
          inkCostPerUnit: product.inkCostPerUnit ? parseFloat(product.inkCostPerUnit.toString()) : null,
          inkUsageInMl: product.inkUsageInMl ? parseFloat(product.inkUsageInMl.toString()) : null,
          timeTaken: product.timeTaken ? parseInt(product.timeTaken.toString(), 10) : null
        }
      });
    });
    
    // Execute all updates in parallel
    const updatedProducts = await Promise.all(updatePromises);
    
    // Handle creating new job products for split tasks
    let newJobProducts = [];
    if (data.remainingJobProducts && data.remainingJobProducts.length > 0) {
      const newProductsPromises = data.remainingJobProducts.map(async (product: any) => {
        return prisma.jobProduct.create({
          data: {
            jobId: params.id,
            productId: product.productId,
            quantity: parseInt(product.quantity.toString(), 10),
            unitPrice: parseFloat(product.unitPrice.toString()),
            totalPrice: parseFloat(product.totalPrice.toString()),
            notes: product.notes || null,
            completedQuantity: 0,
            inkCostPerUnit: null,
            inkUsageInMl: null,
            timeTaken: null
          },
          include: {
            product: true
          }
        });
      });
      
      newJobProducts = await Promise.all(newProductsPromises);
    }
    
    // Fetch the updated job with all products
    const updatedJob = await prisma.job.findUnique({
      where: {
        id: params.id,
      },
      include: {
        jobProducts: {
          include: {
            product: true
          }
        },
        customer: true,
        assignedTo: true,
        createdBy: true,
        invoice: true,
      },
    });
    
    // Return the updated data
    return NextResponse.json({ 
      message: 'Progress updated successfully',
      job: updatedJob,
      jobProducts: updatedJob?.jobProducts || [],
    });
  } catch (error: any) {
    console.error('Error updating job progress:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      { error: `Failed to update job progress: ${error.message}` },
      { status: 500 }
    );
  }
} 