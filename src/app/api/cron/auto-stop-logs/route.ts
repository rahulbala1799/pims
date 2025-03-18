import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get active logs
    const activeLogs = await prisma.hourLog.findMany({
      where: {
        isActive: true,
        endTime: null
      }
    });
    
    const currentTime = new Date();
    const maxHours = 8; // Maximum hours before auto-stop
    const maxMilliseconds = maxHours * 60 * 60 * 1000;
    
    let autoStoppedCount = 0;
    
    // Process each active log
    for (const log of activeLogs) {
      const startTime = new Date(log.startTime);
      const elapsedTime = currentTime.getTime() - startTime.getTime();
      
      // If log has been active for more than 8 hours
      if (elapsedTime > maxMilliseconds) {
        // Calculate hours (cap at 8 hours as per requirement)
        const hours = Math.min(elapsedTime / 3600000, maxHours);
        
        // Calculate end time (start time + 8 hours)
        const endTime = new Date(startTime.getTime() + maxMilliseconds);
        
        // Update the log
        await prisma.hourLog.update({
          where: { id: log.id },
          data: {
            endTime,
            hours,
            isActive: false,
            autoStopped: true,
            notes: log.notes ? `${log.notes} (Auto-stopped after ${maxHours} hours)` : `Auto-stopped after ${maxHours} hours`
          }
        });
        
        autoStoppedCount++;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Checked ${activeLogs.length} active logs, auto-stopped ${autoStoppedCount} logs`
    });
  } catch (error: any) {
    console.error('Error in auto-stop logs cron job:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 