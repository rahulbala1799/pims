import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Prevent static generation for this route
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;


// GET - Get a specific hour log by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Hour log ID is required' },
        { status: 400 }
      );
    }
    
    const hourLog = await prisma.hourLog.findUnique({
      where: { id },
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
    
    if (!hourLog) {
      return NextResponse.json(
        { error: 'Hour log not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(hourLog);
  } catch (error) {
    console.error('Error fetching hour log:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hour log' },
      { status: 500 }
    );
  }
}

// PATCH - Update a specific hour log by ID
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Hour log ID is required' },
        { status: 400 }
      );
    }
    
    // Check if hour log exists
    const existingLog = await prisma.hourLog.findUnique({
      where: { id },
    });
    
    if (!existingLog) {
      return NextResponse.json(
        { error: 'Hour log not found' },
        { status: 404 }
      );
    }
    
    // Update the hour log with the fields from the request body
    const updatedLog = await prisma.hourLog.update({
      where: { id },
      data: {
        ...(body.startTime !== undefined && { startTime: new Date(body.startTime) }),
        ...(body.endTime !== undefined && { 
          endTime: body.endTime ? new Date(body.endTime) : null 
        }),
        ...(body.hours !== undefined && { hours: body.hours }),
        ...(body.date !== undefined && { date: new Date(body.date) }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.isPaid !== undefined && { isPaid: body.isPaid }),
        ...(body.notes !== undefined && { notes: body.notes }),
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
    
    return NextResponse.json(updatedLog);
  } catch (error) {
    console.error('Error updating hour log:', error);
    return NextResponse.json(
      { error: 'Failed to update hour log' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a specific hour log by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Hour log ID is required' },
        { status: 400 }
      );
    }
    
    // Check if hour log exists
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