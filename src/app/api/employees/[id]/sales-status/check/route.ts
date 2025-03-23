import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Prevent static generation for this route
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Find SalesEmployee record for this user
    const salesEmployee = await prisma.$queryRaw`
      SELECT * FROM "SalesEmployee" WHERE "userId" = ${id} AND "isActive" = true
    `;

    // Return whether this user is an active sales employee
    return NextResponse.json({
      isSalesEmployee: Array.isArray(salesEmployee) && salesEmployee.length > 0
    });
  } catch (error) {
    console.error('Error checking sales employee status:', error);
    return NextResponse.json(
      { error: 'Failed to check sales employee status', isSalesEmployee: false },
      { status: 500 }
    );
  }
} 