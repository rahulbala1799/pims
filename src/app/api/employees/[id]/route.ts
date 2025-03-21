import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Prevent static generation for this route
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;


const prisma = new PrismaClient();

// GET - Get an employee by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employeeId = params.id;
    
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            jobs: true
          }
        }
      }
    });
    
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }
    
    return NextResponse.json(employee);
  } catch (error: any) {
    console.error('Error fetching employee:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update an employee
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employeeId = params.id;
    const data = await req.json();
    const { name, email, password } = data;
    
    // Check if the employee exists
    const employee = await prisma.user.findUnique({
      where: { id: employeeId }
    });
    
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }
    
    // Check if email already exists (if changing email)
    if (email && email !== employee.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        return NextResponse.json({ 
          error: 'A user with this email already exists' 
        }, { status: 400 });
      }
    }
    
    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    
    // Only hash and update password if it's provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    // Update the employee
    const updatedEmployee = await prisma.user.update({
      where: { id: employeeId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    return NextResponse.json(updatedEmployee);
  } catch (error: any) {
    console.error('Error updating employee:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete an employee
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employeeId = params.id;
    
    // Check if the employee exists
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      include: {
        _count: {
          select: {
            jobs: true
          }
        }
      }
    });
    
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }
    
    // Check if the employee has any assigned jobs
    if (employee._count.jobs > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete employee with assigned jobs. Reassign or complete their jobs first.' 
      }, { status: 400 });
    }
    
    // Delete the employee
    await prisma.user.delete({
      where: { id: employeeId }
    });
    
    return NextResponse.json({ message: 'Employee deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting employee:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 