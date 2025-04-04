import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Prevent static generation for this route
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const acceptHeader = request.headers.get('Accept') || '';
    const wantsJson = acceptHeader.includes('application/json');

    // Get the user
    const user = await prisma.user.findUnique({
      where: { id },
      include: { salesEmployee: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    let updatedSalesEmployee;

    // Check if user is already a sales employee
    if (user.salesEmployee) {
      if (user.salesEmployee.isActive) {
        // Deactivate sales employee status
        updatedSalesEmployee = await prisma.salesEmployee.update({
          where: { userId: id },
          data: { isActive: false }
        });
      } else {
        // Reactivate sales employee status
        updatedSalesEmployee = await prisma.salesEmployee.update({
          where: { userId: id },
          data: { isActive: true }
        });
      }
    } else {
      // Create new sales employee record
      updatedSalesEmployee = await prisma.salesEmployee.create({
        data: {
          userId: id,
          isActive: true
        }
      });
    }

    // Return JSON response if client wants JSON
    if (wantsJson) {
      return NextResponse.json({
        success: true,
        salesEmployee: updatedSalesEmployee
      });
    }

    // Otherwise redirect back to employee details page
    return NextResponse.redirect(new URL(`/admin/employees/${id}`, request.url));
  } catch (error) {
    console.error('Error updating sales employee status:', error);
    return NextResponse.json(
      { error: 'Failed to update sales employee status' },
      { status: 500 }
    );
  }
} 