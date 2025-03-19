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
    const isPaid = searchParams.get('isPaid');
    
    // Query filters
    const filters: any = {};
    
    if (id) {
      filters.id = id;
    }
    
    if (userId) {
      filters.userId = userId;
    }

    if (isPaid !== null) {
      filters.isPaid = isPaid === 'true';
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
      endTime = null, 
      hours = null,
      date,
      isActive = false,
      isPaid = false,
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
    
    // Calculate hours if both start and end time are provided
    let calculatedHours = hours;
    if (endTime && !calculatedHours) {
      const startMs = new Date(startTime).getTime();
      const endMs = new Date(endTime).getTime();
      const diffMs = endMs - startMs;
      
      if (diffMs > 0) {
        calculatedHours = diffMs / (1000 * 60 * 60);
      }
    }
    
    // Create the hour log
    const hourLog = await prisma.hourLog.create({
      data: {
        userId,
        startTime,
        endTime,
        hours: calculatedHours,
        date,
        isActive,
        isPaid,
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
      isPaid,
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
    if (date !== undefined) updateData.date = date;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isPaid !== undefined) updateData.isPaid = isPaid;
    if (notes !== undefined) updateData.notes = notes;
    
    // Calculate hours if both start and end time are provided
    if (endTime !== undefined || (startTime !== undefined && existingLog.endTime)) {
      const start = startTime !== undefined ? new Date(startTime) : new Date(existingLog.startTime);
      const end = endTime !== undefined ? new Date(endTime) : existingLog.endTime ? new Date(existingLog.endTime) : null;
      
      if (end) {
        const diffMs = end.getTime() - start.getTime();
        
        if (diffMs > 0) {
          updateData.hours = diffMs / (1000 * 60 * 60);
        }
      } else {
        // If end time is set to null, clear hours
        updateData.hours = null;
      }
    } else if (hours !== undefined) {
      updateData.hours = hours;
    }
    
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