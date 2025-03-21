import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Prevent static generation for this route
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;


const prisma = new PrismaClient();

// GET /api/portal/users/:id - Get a specific portal user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    
    // Find the user
    const user = await prisma.portalUser.findUnique({
      where: { id: userId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Return the user without sensitive information
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        role: user.role,
        status: user.status,
        customerId: user.customerId,
        customerName: user.customer?.name || '',
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      }
    });
  } catch (error) {
    console.error('Error fetching portal user:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching the portal user' },
      { status: 500 }
    );
  }
}

// PUT /api/portal/users/:id - Update a portal user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const data = await request.json();
    
    // Check if user exists
    const existingUser = await prisma.portalUser.findUnique({
      where: { id: userId },
    });
    
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Prepare update data
    const updateData: any = {};
    
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.role) updateData.role = data.role;
    if (data.status) updateData.status = data.status;
    if (data.customerId) {
      // Check if customer exists
      const customer = await prisma.customer.findUnique({
        where: { id: data.customerId },
      });
      
      if (!customer) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 400 }
        );
      }
      
      updateData.customerId = data.customerId;
    }
    
    // Update password if provided
    if (data.password) {
      // In production, hash the password with bcrypt
      updateData.passwordHash = data.password; // In production: await bcrypt.hash(data.password, 10)
    }
    
    // Update the user
    const updatedUser = await prisma.portalUser.update({
      where: { id: userId },
      data: updateData,
      include: {
        customer: {
          select: {
            name: true,
          },
        },
      },
    });
    
    // Return the updated user without the password
    return NextResponse.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName || '',
        lastName: updatedUser.lastName || '',
        name: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim(),
        role: updatedUser.role,
        status: updatedUser.status,
        customerId: updatedUser.customerId,
        customerName: updatedUser.customer?.name || '',
        lastLogin: updatedUser.lastLogin,
        updatedAt: updatedUser.updatedAt,
      }
    });
  } catch (error) {
    console.error('Error updating portal user:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating the portal user' },
      { status: 500 }
    );
  }
}

// DELETE /api/portal/users/:id - Delete a portal user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    
    // Check if user exists
    const existingUser = await prisma.portalUser.findUnique({
      where: { id: userId },
    });
    
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Delete the user
    await prisma.portalUser.delete({
      where: { id: userId },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting portal user:', error);
    return NextResponse.json(
      { error: 'An error occurred while deleting the portal user' },
      { status: 500 }
    );
  }
} 