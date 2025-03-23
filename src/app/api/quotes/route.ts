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

interface QuotationItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface QuotationRequest {
  customerName: string;
  expiresAt: string;
  totalAmount: number;
  items: QuotationItem[];
}

// POST /api/quotes - create a new quote
export async function POST(request: NextRequest) {
  try {
    const data: QuotationRequest = await request.json();
    
    // Validate required fields
    if (!data.customerName || !data.expiresAt || !data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Generate a unique quote number (in a real app, you might use a database sequence)
    const quoteNumber = `QT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    
    // In a real implementation, you would save this to your database
    // For now, we'll just return success with the quote number
    
    return NextResponse.json({
      success: true,
      quoteNumber,
      message: 'Quotation created successfully',
    });
    
  } catch (error) {
    console.error('Error creating quotation:', error);
    return NextResponse.json(
      { error: 'Failed to create quotation' },
      { status: 500 }
    );
  }
} 