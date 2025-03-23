import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const prisma = new PrismaClient();

// GET /api/quotes - retrieve all quotes or filtered by customer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    
    let quotes;
    
    if (customerId) {
      quotes = await prisma.quote.findMany({
        where: {
          customerId: customerId
        },
        include: {
          customer: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } else {
      quotes = await prisma.quote.findMany({
        include: {
          customer: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }
    
    return NextResponse.json(quotes);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes' },
      { status: 500 }
    );
  }
}

// POST /api/quotes - create a new quote
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Generate quote number (format: Q-YYYYMMDD-XXXX)
    const date = new Date();
    const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Get the count of quotes created today to create a sequential number
    const todayStart = new Date(date.setHours(0, 0, 0, 0));
    const todayEnd = new Date(date.setHours(23, 59, 59, 999));
    
    const quotesCount = await prisma.quote.count({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd
        }
      }
    });
    
    const sequentialNumber = (quotesCount + 1).toString().padStart(4, '0');
    const quoteNumber = `Q-${datePart}-${sequentialNumber}`;
    
    // Create the quote with the generated quote number
    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        customerId: data.customerId,
        status: 'PENDING',
        expiresAt: new Date(data.expiresAt),
        totalAmount: data.totalAmount,
        items: data.items
      }
    });
    
    return NextResponse.json(quote);
  } catch (error) {
    console.error('Error creating quote:', error);
    return NextResponse.json(
      { error: 'Failed to create quote' },
      { status: 500 }
    );
  }
} 