import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Prevent static generation for this route
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;


// GET - Get all hour logs for a user with basic filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    
    console.log('Fetching hour logs with params:', { id, userId });
    
    // Simple filter that just looks for userId
    const filters: any = {};
    
    if (id) {
      filters.id = id;
    }
    
    if (userId) {
      filters.userId = userId;
    }
    
    // Simple fetch all logs for the user
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
    
    console.log(`Successfully fetched ${hourLogs.length} hour logs`);
    return NextResponse.json(hourLogs);
  } catch (error) {
    console.error('Error in hour logs GET route:', error);
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
    console.log('Received hour log creation request:', body);
    
    const { 
      userId, 
      startTime, 
      endTime = null, 
      hours = null,
      date,
      isActive = false,
      notes 
    } = body;
    
    // Basic validation
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
    
    // Calculate hours if end time is provided
    let calculatedHours = hours;
    if (endTime && !calculatedHours) {
      const startMs = new Date(startTime).getTime();
      const endMs = new Date(endTime).getTime();
      const diffMs = endMs - startMs;
      
      // Default to 6 hours if calculation is negative or invalid
      if (diffMs <= 0) {
        calculatedHours = 6;
      } else {
        calculatedHours = diffMs / (1000 * 60 * 60);
      }
    }
    
    // Default to 6 hours if no end time and no hours specified
    if (!endTime && !calculatedHours) {
      calculatedHours = 6;
    }
    
    // Parse the date string
    let parsedDate;
    try {
      parsedDate = new Date(date);
    } catch (error) {
      // If date parsing fails, use current date
      parsedDate = new Date();
    }
    
    // Create the hour log
    const hourLog = await prisma.hourLog.create({
      data: {
        userId,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        hours: calculatedHours,
        date: parsedDate,
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
    
    console.log('Successfully created hour log:', hourLog.id);
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
    if (startTime !== undefined) updateData.startTime = new Date(startTime);
    if (endTime !== undefined) updateData.endTime = endTime ? new Date(endTime) : null;
    if (date !== undefined) updateData.date = new Date(date);
    if (isActive !== undefined) updateData.isActive = isActive;
    if (notes !== undefined) updateData.notes = notes;
    
    // Calculate hours if both start and end time are provided
    // or if hours are explicitly provided
    if (hours !== undefined) {
      updateData.hours = hours;
    } else if (endTime) {
      const start = startTime ? new Date(startTime) : new Date(existingLog.startTime);
      const end = new Date(endTime);
      const diffMs = end.getTime() - start.getTime();
      
      // Default to 6 hours if calculation is negative or invalid
      if (diffMs <= 0) {
        updateData.hours = 6;
      } else {
        updateData.hours = diffMs / (1000 * 60 * 60);
      }
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