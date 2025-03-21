import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Prevent static generation for this route
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;


const prisma = new PrismaClient();

// GET - Get all attendance records for a user
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const date = searchParams.get('date');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    const query: any = { userId };
    
    // Add date filter if provided
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      query.date = {
        gte: startDate,
        lte: endDate
      };
    }
    
    const attendances = await prisma.attendance.findMany({
      where: query,
      orderBy: {
        date: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    return NextResponse.json(attendances);
  } catch (error: any) {
    console.error('Error fetching attendance records:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Clock in or create new attendance record
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { userId } = data;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Get today's date (without time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if there's already an attendance record for today
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        userId,
        date: {
          equals: today
        }
      }
    });
    
    if (existingAttendance) {
      // If already clocked in but not clocked out, return the existing record
      if (!existingAttendance.clockOutTime) {
        return NextResponse.json(existingAttendance);
      }
      
      // If already clocked in and out, return an error
      return NextResponse.json({ 
        error: 'You have already clocked in and out for today',
        attendance: existingAttendance 
      }, { status: 400 });
    }
    
    // Create a new attendance record
    const attendance = await prisma.attendance.create({
      data: {
        userId,
        clockInTime: new Date(),
        date: today
      }
    });
    
    return NextResponse.json(attendance);
  } catch (error: any) {
    console.error('Error clocking in:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Clock out
export async function PATCH(req: NextRequest) {
  try {
    const data = await req.json();
    const { userId } = data;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Get today's date (without time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find today's attendance record
    const attendance = await prisma.attendance.findFirst({
      where: {
        userId,
        date: {
          equals: today
        }
      }
    });
    
    if (!attendance) {
      return NextResponse.json({ error: 'No clock-in record found for today' }, { status: 404 });
    }
    
    if (attendance.clockOutTime) {
      return NextResponse.json({ 
        error: 'You have already clocked out for today',
        attendance 
      }, { status: 400 });
    }
    
    // Set clock out time
    const clockOutTime = new Date();
    
    // Calculate total hours (difference in milliseconds / 3600000 to get hours)
    const totalHours = (clockOutTime.getTime() - new Date(attendance.clockInTime).getTime()) / 3600000;
    
    // Update the attendance record
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        clockOutTime,
        totalHours
      }
    });
    
    return NextResponse.json(updatedAttendance);
  } catch (error: any) {
    console.error('Error clocking out:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 