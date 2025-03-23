import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Prevent static generation for this route
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const prisma = new PrismaClient();

// GET - List all employee users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeAdmins = searchParams.get('includeAdmins') === 'true';
    const includeSalesStatus = searchParams.get('includeSalesStatus') === 'true';
    const query = searchParams.get('query') || '';
    const forDropdown = searchParams.get('forDropdown') === 'true';

    // Build where conditions
    let whereClause: any = {};
    
    // Only include employees (exclude admins) if specified
    if (!includeAdmins) {
      whereClause.role = Role.EMPLOYEE;
    }
    
    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } }
      ];
    }
    
    // If it's for dropdown, return a simplified list
    if (forDropdown) {
      const employees = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        },
        orderBy: {
          name: 'asc'
        }
      });
      
      return NextResponse.json(employees);
    }
    
    // Include sales employee relationship if requested
    const include: any = {
      _count: {
        select: {
          jobs: true,
        },
      },
    };
    
    if (includeSalesStatus) {
      include.salesEmployee = true;
    }
    
    // Otherwise return the detailed list with additional information
    const users = await prisma.user.findMany({
      where: whereClause,
      include,
      orderBy: {
        name: 'asc'
      }
    });
    
    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching employees' },
      { status: 500 }
    );
  }
}

// POST - Create a new user (employee or admin)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { name, email, password, role = 'EMPLOYEE', hourlyWage = 12.00 } = data;
    
    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json({ 
        error: 'Name, email, and password are required' 
      }, { status: 400 });
    }
    
    // Validate role
    if (role !== 'EMPLOYEE' && role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'Role must be either EMPLOYEE or ADMIN' 
      }, { status: 400 });
    }
    
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return NextResponse.json({ 
        error: 'A user with this email already exists' 
      }, { status: 400 });
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create the new user with the specified role
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as Role,
        hourlyWage
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        hourlyWage: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error('Error creating employee:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 