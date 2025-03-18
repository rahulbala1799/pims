import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, notes } = body;

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

    // Update the notes
    const updatedLog = await prisma.hourLog.update({
      where: { id },
      data: { notes },
    });

    return NextResponse.json(updatedLog);
  } catch (error) {
    console.error('Error updating hour log notes:', error);
    return NextResponse.json(
      { error: 'Failed to update hour log notes' },
      { status: 500 }
    );
  }
} 