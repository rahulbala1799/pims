import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PATCH - Update job product details (completedQuantity, inkUsage, time)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; productId: string } }
) {
  try {
    const jobId = params.id;
    const productId = params.productId;
    const data = await req.json();
    const { completedQuantity, timeTaken, inkUsageInMl } = data;
    
    // Validate the input
    if (completedQuantity === undefined && timeTaken === undefined && inkUsageInMl === undefined) {
      return NextResponse.json(
        { error: 'At least one of completedQuantity, timeTaken, or inkUsageInMl must be provided' },
        { status: 400 }
      );
    }
    
    // Check if the job product exists
    const jobProduct = await prisma.jobProduct.findFirst({
      where: {
        id: productId,
        jobId: jobId
      },
      include: {
        job: true,
        product: true
      }
    });
    
    if (!jobProduct) {
      return NextResponse.json(
        { error: 'Job product not found' },
        { status: 404 }
      );
    }
    
    // Make sure completedQuantity doesn't exceed quantity
    let completedQty = completedQuantity !== undefined 
      ? Math.min(parseInt(completedQuantity.toString()), jobProduct.quantity)
      : jobProduct.completedQuantity;
    
    // Parse time and ink usage properly
    let timeValue: number | null | undefined = timeTaken !== undefined 
      ? parseInt(timeTaken.toString())
      : jobProduct.timeTaken;
    
    let inkValue: number | null | undefined = inkUsageInMl !== undefined
      ? parseFloat(inkUsageInMl.toString())
      : jobProduct.inkUsageInMl;
    
    // Update job product
    const updatedJobProduct = await prisma.jobProduct.update({
      where: {
        id: productId
      },
      data: {
        completedQuantity: completedQty,
        timeTaken: timeValue !== null && timeValue !== undefined && timeValue >= 0 ? timeValue : undefined,
        inkUsageInMl: inkValue !== null && inkValue !== undefined && inkValue >= 0 ? inkValue : undefined
      },
      include: {
        product: true
      }
    });
    
    // Determine if we need to update job status
    // If all products for this job are now complete, mark job as COMPLETED
    const allJobProducts = await prisma.jobProduct.findMany({
      where: {
        jobId: jobId
      }
    });
    
    const allComplete = allJobProducts.every(jp => 
      jp.completedQuantity === jp.quantity && jp.quantity > 0
    );
    
    const anyProgress = allJobProducts.some(jp => jp.completedQuantity > 0);
    
    // Update job status if needed
    if (allComplete && jobProduct.job.status !== 'COMPLETED') {
      await prisma.job.update({
        where: { id: jobId },
        data: { status: 'COMPLETED' }
      });
      
      // Add a progress update for completion
      await prisma.progressUpdate.create({
        data: {
          content: 'All products completed, job marked as completed',
          jobId,
          userId: jobProduct.job.assignedToId || jobProduct.job.createdById
        }
      });
    } 
    else if (anyProgress && jobProduct.job.status === 'PENDING') {
      await prisma.job.update({
        where: { id: jobId },
        data: { status: 'IN_PROGRESS' }
      });
      
      // Add a progress update for starting
      await prisma.progressUpdate.create({
        data: {
          content: 'Work begun on job',
          jobId,
          userId: jobProduct.job.assignedToId || jobProduct.job.createdById
        }
      });
    }
    
    return NextResponse.json(updatedJobProduct);
  } catch (error: any) {
    console.error('Error updating job product:', error);
    return NextResponse.json(
      { error: `Failed to update job product: ${error.message}` },
      { status: 500 }
    );
  }
} 