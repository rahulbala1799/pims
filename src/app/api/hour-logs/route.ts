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
    
    console.log('Fetching hour logs with params:', {
      id, userId, startDate, endDate, isPaid
    });
    
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
    
    // Date range filtering - handle with more care
    if (startDate || endDate) {
      filters.date = {};
      
      if (startDate) {
        try {
          // Parse the date safely
          const parsedStartDate = new Date(startDate);
          if (!isNaN(parsedStartDate.getTime())) {
            filters.date.gte = parsedStartDate;
          } else {
            console.warn('Invalid startDate format:', startDate);
          }
        } catch (error) {
          console.error('Error parsing startDate:', error);
          // Don't add invalid date filter
        }
      }
      
      if (endDate) {
        try {
          // Parse the date safely
          const parsedEndDate = new Date(endDate);
          if (!isNaN(parsedEndDate.getTime())) {
            filters.date.lte = parsedEndDate;
          } else {
            console.warn('Invalid endDate format:', endDate);
          }
        } catch (error) {
          console.error('Error parsing endDate:', error);
          // Don't add invalid date filter
        }
      }
      
      // If no valid dates were added, remove the empty date filter
      if (Object.keys(filters.date).length === 0) {
        delete filters.date;
      }
    }
    
    console.log('Using filters:', JSON.stringify(filters));
    
    // Fetch hour logs with better error handling
    try {
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
    } catch (dbError) {
      console.error('Database error fetching hour logs:', dbError);
      return NextResponse.json(
        { error: 'Database error while fetching hour logs' },
        { status: 500 }
      );
    }
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
      isPaid = false,
      notes 
    } = body;
    
    // Validate required fields with better error messages
    if (!userId) {
      console.error('Missing userId in hour log creation');
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    if (!startTime) {
      console.error('Missing startTime in hour log creation');
      return NextResponse.json(
        { error: 'Start time is required' },
        { status: 400 }
      );
    }
    
    if (!date) {
      console.error('Missing date in hour log creation');
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      );
    }
    
    // Parse the date from the request - we need to handle both ISO string dates and YYYY-MM-DD format
    let parsedDate;
    try {
      // First check if it's a date object already
      if (date instanceof Date) {
        parsedDate = date;
      } else if (typeof date === 'string') {
        // If it's a simple YYYY-MM-DD format, we need to convert it properly
        if (date.length === 10 && date.includes('-')) {
          parsedDate = new Date(date);
        } else {
          // Otherwise assume it's an ISO string or some other valid date format
          parsedDate = new Date(date);
        }
      } else {
        throw new Error('Invalid date format');
      }
      
      // Make sure the date is valid
      if (isNaN(parsedDate.getTime())) {
        throw new Error('Invalid date');
      }
    } catch (error) {
      console.error('Error parsing date:', error, 'Date value was:', date);
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }
    
    // Calculate hours if both start and end time are provided
    let calculatedHours = hours;
    if (endTime && !calculatedHours) {
      try {
        const startMs = new Date(startTime).getTime();
        const endMs = new Date(endTime).getTime();
        const diffMs = endMs - startMs;
        
        if (diffMs > 0) {
          calculatedHours = diffMs / (1000 * 60 * 60);
        }
      } catch (error) {
        console.error('Error calculating hours:', error, 'Start:', startTime, 'End:', endTime);
        return NextResponse.json(
          { error: 'Invalid start or end time format' },
          { status: 400 }
        );
      }
    }
    
    // Create the hour log
    console.log('Creating hour log with parsed data:', {
      userId,
      startTime,
      endTime,
      hours: calculatedHours,
      date: parsedDate,
      isActive,
      isPaid
    });
    
    const hourLog = await prisma.hourLog.create({
      data: {
        userId,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        hours: calculatedHours,
        date: parsedDate,
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