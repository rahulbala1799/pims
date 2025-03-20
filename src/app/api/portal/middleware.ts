import { NextRequest, NextResponse } from 'next/server';

// Simple placeholder middleware - we'll implement real JWT auth later
export async function authMiddleware(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // In a real implementation, we would verify the token here
    // For now, just extract it
    const token = authHeader.split(' ')[1];
    
    // Simple validation - in production we'd properly verify the JWT
    if (!token || token.length < 10) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    // Simulation of decoded data - would be extracted from JWT in real app
    const user = {
      id: 'simulated-user-id',
      name: 'Simulated User',
      email: 'user@example.com',
      customerId: 'simulated-customer-id'
    };
    
    // Add user data to request for downstream handlers
    return { user };
    
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
} 