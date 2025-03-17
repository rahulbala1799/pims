import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/customers/[id] - Get a specific customer
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customer = await prisma.customer.findUnique({
      where: {
        id: params.id,
      },
      include: {
        jobs: {
          select: {
            id: true,
            title: true,
            status: true,
            dueDate: true,
          }
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            totalAmount: true,
            dueDate: true,
          }
        },
      },
    });
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/customers/[id] - Update a customer
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    
    if (!body.email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: {
        id: params.id,
      },
    });
    
    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    // Check if email is already used by another customer
    if (body.email !== existingCustomer.email) {
      const customerWithEmail = await prisma.customer.findUnique({
        where: {
          email: body.email,
        },
      });
      
      if (customerWithEmail && customerWithEmail.id !== params.id) {
        return NextResponse.json(
          { error: 'Email is already used by another customer' },
          { status: 409 }
        );
      }
    }
    
    // Update customer
    const updatedCustomer = await prisma.customer.update({
      where: {
        id: params.id,
      },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        address: body.address || null,
      },
    });
    
    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/customers/[id] - Delete a customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: {
        id: params.id,
      },
      include: {
        _count: {
          select: {
            jobs: true,
            invoices: true,
          }
        }
      }
    });
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    // Optional: Add logic to prevent deletion if customer has associated jobs or invoices
    // Uncomment if you want to implement this safety check
    /*
    if (customer._count.jobs > 0 || customer._count.invoices > 0) {
      return NextResponse.json(
        { error: 'Cannot delete customer with associated jobs or invoices' },
        { status: 400 }
      );
    }
    */
    
    // Delete customer
    await prisma.customer.delete({
      where: {
        id: params.id,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 