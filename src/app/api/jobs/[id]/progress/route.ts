import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface JobProductProgress {
  id: string;
  completedQuantity: number;
  quantity: number;
  timeTaken?: number;
  inkCostPerUnit?: number;
  inkUsageInMl?: number;
}

interface RemainingJobProduct {
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: string;
  notes?: string;
}

interface ProgressUpdateRequest {
  jobProducts: JobProductProgress[];
  remainingJobProducts?: RemainingJobProduct[];
}

// POST /api/jobs/:id/progress - Update job progress and costs
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json() as ProgressUpdateRequest;
    
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
      },
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Check if all products are completed and if any progress has been made
    const allCompleted = data.jobProducts.every((product) => 
      product.completedQuantity === product.quantity && product.quantity > 0
    );
    
    const anyProgress = data.jobProducts.some((product) => 
      product.completedQuantity > 0
    );

    // Update job status based on progress
    if (allCompleted && existingJob.status !== 'COMPLETED') {
      // All products are complete, set status to COMPLETED
      await prisma.job.update({
        where: { id: params.id },
        data: { status: 'COMPLETED' },
      });
    } else if (!allCompleted && existingJob.status === 'COMPLETED') {
      // Was previously completed but now isn't, set to IN_PROGRESS
      await prisma.job.update({
        where: { id: params.id },
        data: { status: 'IN_PROGRESS' },
      });
    } else if (anyProgress && existingJob.status === 'PENDING') {
      // Has some progress but was in PENDING state, set to IN_PROGRESS
      await prisma.job.update({
        where: { id: params.id },
        data: { status: 'IN_PROGRESS' },
      });
    } else if (!anyProgress && existingJob.status === 'IN_PROGRESS') {
      // Had progress but now has none, set back to PENDING
      await prisma.job.update({
        where: { id: params.id },
        data: { status: 'PENDING' },
      });
    }

    // Update the original products first using raw queries
    const updatePromises = data.jobProducts.map(async (product) => {
      return prisma.$executeRaw`
        UPDATE "JobProduct" 
        SET 
          "quantity" = ${parseInt(product.quantity.toString(), 10)},
          "completedQuantity" = ${parseInt(product.completedQuantity?.toString() || '0', 10)},
          "inkCostPerUnit" = ${product.inkCostPerUnit ? parseFloat(product.inkCostPerUnit.toString()) : null},
          "inkUsageInMl" = ${product.inkUsageInMl ? parseFloat(product.inkUsageInMl.toString()) : null},
          "timeTaken" = ${product.timeTaken ? parseInt(product.timeTaken.toString(), 10) : null},
          "updatedAt" = ${new Date()}
        WHERE "id" = ${product.id}
      `;
    });
    
    // Execute all updates in parallel
    await Promise.all(updatePromises);
    
    // Handle creating new job products for remaining quantities
    if (data.remainingJobProducts && data.remainingJobProducts.length > 0) {
      console.log('Creating new job products for remaining quantities:', data.remainingJobProducts);
      
      // Create the new job products for remaining quantities
      const createRemainingPromises = data.remainingJobProducts.map(async (remainingProduct) => {
        return prisma.jobProduct.create({
          data: {
            job: {
              connect: { id: params.id }
            },
            product: {
              connect: { id: remainingProduct.productId }
            },
            quantity: parseInt(remainingProduct.quantity.toString(), 10),
            unitPrice: parseFloat(remainingProduct.unitPrice.toString()),
            totalPrice: parseFloat(remainingProduct.totalPrice),
            notes: remainingProduct.notes || null,
          }
        });
      });
      
      await Promise.all(createRemainingPromises);
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