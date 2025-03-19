import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// GET - List all employee users
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const forDropdown = searchParams.get('forDropdown') === 'true';
    
    // If it's for dropdown, return a simplified list
    if (forDropdown) {
      const employees = await prisma.user.findMany({
        where: {
          role: Role.EMPLOYEE
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
        orderBy: {
          name: 'asc'
        }
      });
      
      return NextResponse.json(employees);
    }
    
    // Otherwise return the detailed list with additional information
    const employees = await prisma.user.findMany({
      where: {
        role: Role.EMPLOYEE,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ]
      },
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            jobs: true
          }
        }
      }
    });
    
    return NextResponse.json(employees);
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create a new employee user
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { name, email, password } = data;
    
    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json({ 
        error: 'Name, email, and password are required' 
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
    
    // Create the new employee
    const employee = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.EMPLOYEE
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    return NextResponse.json(employee, { status: 201 });
  } catch (error: any) {
    console.error('Error creating employee:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 