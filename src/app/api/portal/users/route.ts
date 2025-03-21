import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// GET /api/portal/users - Get all portal users
export async function GET(request: NextRequest) {
  try {
    // In a production app, add authentication middleware here
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    
    // Build the query
    const whereClause: any = {};
    if (customerId) {
      whereClause.customerId = customerId;
    }
    
    // Get all portal users
    const portalUsers = await prisma.portalUser.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Transform the data to protect sensitive information
    const users = portalUsers.map(user => ({
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
    }));
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching portal users:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching portal users' },
      { status: 500 }
    );
  }
}

// POST /api/portal/users - Create a new portal user
export async function POST(request: NextRequest) {
  try {
    // In a production app, add authentication middleware here
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.email || !data.password || !data.customerId) {
      return NextResponse.json(
        { error: 'Email, password, and customer ID are required' },
        { status: 400 }
      );
    }
    
    // Check if email already exists
    const existingUser = await prisma.portalUser.findUnique({
      where: { email: data.email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }
    
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
    
    // Hash the password with bcrypt
    const passwordHash = await bcrypt.hash(data.password, 10);
    
    // Create the new portal user
    const newUser = await prisma.portalUser.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        role: data.role || 'STANDARD',
        status: data.status || 'ACTIVE',
        customerId: data.customerId,
      },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
      },
    });
    
    // Return the new user without the password
    return NextResponse.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName || '',
        lastName: newUser.lastName || '',
        name: `${newUser.firstName || ''} ${newUser.lastName || ''}`.trim(),
        role: newUser.role,
        status: newUser.status,
        customerId: newUser.customerId,
        customerName: newUser.customer?.name || '',
        createdAt: newUser.createdAt,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating portal user:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating the portal user' },
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
    // In a production app, add authentication middleware here
    
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
      // Hash the password with bcrypt
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
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
    // In a production app, add authentication middleware here
    
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