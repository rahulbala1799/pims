import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Get all hour logs for a user with optional date filtering
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    const query: any = { userId };
    
    // Filter by specific date
    if (date) {
      const targetDate = new Date(date);
      targetDate.setUTCHours(0, 0, 0, 0);
      
      const nextDate = new Date(targetDate);
      nextDate.setUTCDate(nextDate.getUTCDate() + 1);
      
      query.date = {
        gte: targetDate,
        lt: nextDate
      };
    }
    // Filter by date range
    else if (startDate && endDate) {
      const start = new Date(startDate);
      start.setUTCHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);
      
      query.date = {
        gte: start,
        lte: end
      };
    }
    
    const hourLogs = await prisma.hourLog.findMany({
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
    
    return NextResponse.json(hourLogs);
  } catch (error: any) {
    console.error('Error fetching hour logs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Start a new hour log
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { userId, date, notes } = data;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Parse date or use current date
    const logDate = date ? new Date(date) : new Date();
    // Set time to midnight to store just the date
    const dateOnly = new Date(logDate.toISOString().split('T')[0]);
    
    // Check for active (uncompleted) logs for this user
    const activeLog = await prisma.hourLog.findFirst({
      where: {
        userId,
        isActive: true
      }
    });
    
    if (activeLog) {
      return NextResponse.json({ 
        error: 'You already have an active hour log. Please complete it before starting a new one.',
        hourLog: activeLog 
      }, { status: 400 });
    }
    
    // Create a new hour log
    const hourLog = await prisma.hourLog.create({
      data: {
        userId,
        date: dateOnly,
        startTime: new Date(), // Current time
        isActive: true,
        notes
      }
    });
    
    return NextResponse.json(hourLog);
  } catch (error: any) {
    console.error('Error starting hour log:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - End an hour log or update details
export async function PATCH(req: NextRequest) {
  try {
    const data = await req.json();
    const { id, userId, notes } = data;
    
    if (!id && !userId) {
      return NextResponse.json({ error: 'Hour log ID or user ID is required' }, { status: 400 });
    }
    
    let hourLog;
    
    // Find by ID if provided
    if (id) {
      hourLog = await prisma.hourLog.findUnique({
        where: { id }
      });
    } 
    // Otherwise find active log for user
    else {
      hourLog = await prisma.hourLog.findFirst({
        where: {
          userId,
          isActive: true
        }
      });
    }
    
    if (!hourLog) {
      return NextResponse.json({ error: 'No active hour log found' }, { status: 404 });
    }
    
    if (!hourLog.isActive) {
      return NextResponse.json({ 
        error: 'This hour log is already completed',
        hourLog 
      }, { status: 400 });
    }
    
    // Set end time
    const endTime = new Date();
    
    // Calculate hours (difference in milliseconds / 3600000 to get hours)
    const startTime = new Date(hourLog.startTime);
    const hours = (endTime.getTime() - startTime.getTime()) / 3600000;
    
    // Update the hour log
    const updatedHourLog = await prisma.hourLog.update({
      where: { id: hourLog.id },
      data: {
        endTime,
        hours,
        isActive: false,
        notes: notes || hourLog.notes,
      }
    });
    
    return NextResponse.json(updatedHourLog);
  } catch (error: any) {
    console.error('Error updating hour log:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete an hour log
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Hour log ID is required' }, { status: 400 });
    }
    
    // Check if the hour log exists
    const hourLog = await prisma.hourLog.findUnique({
      where: { id }
    });
    
    if (!hourLog) {
      return NextResponse.json({ error: 'Hour log not found' }, { status: 404 });
    }
    
    // Delete the hour log
    await prisma.hourLog.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true, message: 'Hour log deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting hour log:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 