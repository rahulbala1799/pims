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
    const includeAdmins = searchParams.get('includeAdmins') === 'true';
    
    let whereClause: any = {};
    
    // Build the where clause based on parameters
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
    
    // Otherwise return the detailed list with additional information
    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: {
        name: 'asc'
      },
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
    
    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create a new user (employee or admin)
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { name, email, password, role = 'EMPLOYEE' } = data;
    
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
        role: role as Role
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
    
    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 