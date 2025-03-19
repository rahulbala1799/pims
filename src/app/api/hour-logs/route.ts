import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Get all hour logs for a user with optional date filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Query filters
    const filters: any = {};
    
    if (id) {
      filters.id = id;
    }
    
    if (userId) {
      filters.userId = userId;
    }
    
    // Date range filtering
    if (startDate || endDate) {
      filters.date = {};
      
      if (startDate) {
        filters.date.gte = startDate;
      }
      
      if (endDate) {
        filters.date.lte = endDate;
      }
    }
    
    const hourLogs = await prisma.hourLog.findMany({
      where: filters,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
    
    return NextResponse.json(hourLogs);
  } catch (error) {
    console.error('Error fetching hour logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hour logs' },
      { status: 500 }
    );
  }
}

// POST - Start a new hour log
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      userId, 
      startTime, 
      endTime, 
      hours,
      date,
      isActive = false,
      notes 
    } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    if (!startTime) {
      return NextResponse.json(
        { error: 'Start time is required' },
        { status: 400 }
      );
    }
    
    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      );
    }
    
    // Create the hour log
    const hourLog = await prisma.hourLog.create({
      data: {
        userId,
        startTime,
        endTime,
        hours,
        date,
        isActive,
        notes,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    return NextResponse.json(hourLog);
  } catch (error) {
    console.error('Error creating hour log:', error);
    return NextResponse.json(
      { error: 'Failed to create hour log' },
      { status: 500 }
    );
  }
}

// PATCH - End an hour log or update details
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { 
      id, 
      startTime, 
      endTime, 
      hours,
      date,
      isActive,
      notes 
    } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Hour log ID is required' },
        { status: 400 }
      );
    }
    
    // Check if the hour log exists
    const existingLog = await prisma.hourLog.findUnique({
      where: { id },
    });
    
    if (!existingLog) {
      return NextResponse.json(
        { error: 'Hour log not found' },
        { status: 404 }
      );
    }
    
    // Prepare update data
    const updateData: any = {};
    
    // Only update fields that are provided
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (hours !== undefined) updateData.hours = hours;
    if (date !== undefined) updateData.date = date;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (notes !== undefined) updateData.notes = notes;
    
    // Update the hour log
    const updatedLog = await prisma.hourLog.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    return NextResponse.json(updatedLog);
  } catch (error) {
    console.error('Error updating hour log:', error);
    return NextResponse.json(
      { error: 'Failed to update hour log' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an hour log
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Hour log ID is required' },
        { status: 400 }
      );
    }
    
    // Check if the hour log exists
    const existingLog = await prisma.hourLog.findUnique({
      where: { id },
    });
    
    if (!existingLog) {
      return NextResponse.json(
        { error: 'Hour log not found' },
        { status: 404 }
      );
    }
    
    // Delete the hour log
    await prisma.hourLog.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting hour log:', error);
    return NextResponse.json(
      { error: 'Failed to delete hour log' },
      { status: 500 }
    );
  }
} 