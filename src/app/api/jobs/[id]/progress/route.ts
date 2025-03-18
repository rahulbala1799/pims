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

    // Update the progress for each job product
    const updatePromises = data.jobProducts.map(async (product: any) => {
      return prisma.jobProduct.update({
        where: { id: product.id },
        data: {
          completedQuantity: product.completedQuantity || 0,
          inkCostPerUnit: product.inkCostPerUnit ? parseFloat(product.inkCostPerUnit) : null,
          inkUsageInMl: product.inkUsageInMl ? parseFloat(product.inkUsageInMl) : null
        }
      });
    });
    
    // Execute all updates in parallel
    const updatedProducts = await Promise.all(updatePromises);
    
    // Return the updated data
    return NextResponse.json({ 
      message: 'Progress updated successfully',
      jobProducts: updatedProducts,
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