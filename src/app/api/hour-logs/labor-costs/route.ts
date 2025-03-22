import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subWeeks, subYears } from 'date-fns';
import { Role } from '@prisma/client';

// Prevent static generation for this route
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Helper function to get date range
function getDateRange(period: string, date = new Date()) {
  switch (period) {
    case 'week':
      return {
        start: startOfWeek(date, { weekStartsOn: 1 }),
        end: endOfWeek(date, { weekStartsOn: 1 })
      };
    case 'month':
      return {
        start: startOfMonth(date),
        end: endOfMonth(date)
      };
    case 'year':
      return {
        start: startOfYear(date),
        end: endOfYear(date)
      };
    case 'all':
      return {
        start: new Date(0), // beginning of time
        end: new Date()
      };
    // Previous periods
    case 'prev-week':
      return getDateRange('week', subWeeks(date, 1));
    case 'prev-month':
      return getDateRange('month', subMonths(date, 1));
    case 'prev-year':
      return getDateRange('year', subYears(date, 1));
    default:
      return {
        start: startOfMonth(date),
        end: endOfMonth(date)
      };
  }
}

// Define types for our hourLogs result
type HourLogWithUser = {
  id: string;
  userId: string;
  date: Date;
  startTime: Date;
  endTime: Date | null;
  hours: number | null;
  isActive: boolean;
  autoStopped: boolean;
  isPaid: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    hourlyWage: any; // Using any for now as we're not sure of the exact type
  };
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const userId = searchParams.get('userId');
    
    // Get date range for the specified period
    const { start, end } = getDateRange(period);
    
    // Build the query filter
    const filter: any = {
      date: {
        gte: start,
        lte: end
      }
    };
    
    // Add user filter if specified
    if (userId) {
      filter.userId = userId;
    }
    
    // Get all hour logs in the date range with user information
    const hourLogs = await prisma.hourLog.findMany({
      where: filter,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            hourlyWage: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    }) as HourLogWithUser[];
    
    // Calculate labor costs by employee
    const employeeCosts = new Map<string, {
      id: string;
      name: string;
      email: string;
      role: string;
      hourlyWage: number;
      hours: number;
      cost: number;
    }>();
    
    let totalHours = 0;
    let totalCost = 0;
    
    // Process each hour log
    for (const log of hourLogs) {
      const employeeId = log.user.id;
      const hours = log.hours || 0;
      const hourlyWage = Number(log.user.hourlyWage || 12);
      const cost = hours * hourlyWage;
      
      totalHours += hours;
      totalCost += cost;
      
      if (!employeeCosts.has(employeeId)) {
        employeeCosts.set(employeeId, {
          id: employeeId,
          name: log.user.name,
          email: log.user.email,
          role: log.user.role as string,
          hourlyWage,
          hours: 0,
          cost: 0
        });
      }
      
      const employee = employeeCosts.get(employeeId)!;
      employee.hours += hours;
      employee.cost += cost;
    }
    
    // Convert Map to array and sort by cost (descending)
    const sortedEmployeeCosts = Array.from(employeeCosts.values())
      .sort((a, b) => b.cost - a.cost)
      .map(employee => ({
        ...employee,
        hours: parseFloat(employee.hours.toFixed(2)),
        cost: parseFloat(employee.cost.toFixed(2))
      }));
    
    // Calculate summary metrics
    const summary = {
      totalEmployees: sortedEmployeeCosts.length,
      totalHours: parseFloat(totalHours.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      averageHourlyWage: sortedEmployeeCosts.length 
        ? parseFloat((sortedEmployeeCosts.reduce((sum, emp) => sum + emp.hourlyWage, 0) / sortedEmployeeCosts.length).toFixed(2)) 
        : 0,
      period,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    };
    
    return NextResponse.json({
      employees: sortedEmployeeCosts,
      summary
    });
  } catch (error) {
    console.error('Error fetching labor costs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch labor costs' },
      { status: 500 }
    );
  }
} 