import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

interface PortalTokenPayload {
  id: string;
  email: string;
  customerId: string;
  role: string;
}

export async function generatePortalToken(user: any): Promise<string> {
  const payload: PortalTokenPayload = {
    id: user.id,
    email: user.email,
    customerId: user.customerId,
    role: user.role
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export async function verifyPortalToken(token: string): Promise<PortalTokenPayload | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as PortalTokenPayload;
    
    // Verify user exists and is active
    const user = await prisma.portalUser.findUnique({
      where: { id: decoded.id },
      select: { 
        id: true, 
        status: true,
        customerId: true 
      }
    });
    
    if (!user || user.status !== 'ACTIVE') {
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function authenticatePortalUser(email: string, password: string) {
  try {
    // Find user by email
    const user = await prisma.portalUser.findUnique({
      where: { email },
      include: {
        customer: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    // If no user found or user is not active
    if (!user || user.status !== 'ACTIVE') {
      return { success: false, message: 'Invalid credentials' };
    }
    
    // Compare passwords (in a real implementation, use bcrypt to compare hashed passwords)
    const isPasswordValid = user.passwordHash === password;
    
    if (!isPasswordValid) {
      return { success: false, message: 'Invalid credentials' };
    }
    
    // Generate token
    const token = await generatePortalToken({
      id: user.id,
      email: user.email,
      customerId: user.customerId,
      role: user.role
    });
    
    return {
      success: true,
      user: {
        id: user.id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        email: user.email,
        role: user.role,
        customerId: user.customerId,
        companyName: user.customer?.name
      },
      token
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, message: 'Authentication failed' };
  }
} 