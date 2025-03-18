import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Get all jobs assigned to an employee
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    const query: any = { assignedToId: userId };
    
    // Add status filter if provided
    if (status) {
      if (status === 'active') {
        query.status = {
          in: ['PENDING', 'IN_PROGRESS']
        };
      } else if (status === 'completed') {
        query.status = 'COMPLETED';
      } else if (status !== 'all') {
        query.status = status;
      }
    }
    
    const jobs = await prisma.job.findMany({
      where: query,
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ],
      include: {
        customer: true,
        jobProducts: {
          include: {
            product: true
          }
        },
        progressUpdates: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });
    
    return NextResponse.json(jobs);
  } catch (error: any) {
    console.error('Error fetching employee jobs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 