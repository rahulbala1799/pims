import { PrismaClient } from '@prisma/client';

// Add prisma to the global type
declare global {
  var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  // In production, use a new PrismaClient instance
  prisma = new PrismaClient({
    log: ['error'],
    errorFormat: 'minimal',
  });
} else {
  // In development, use a global variable to prevent multiple instances
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
      errorFormat: 'pretty',
    });
  }
  prisma = global.prisma;
}

// Handle connection errors
prisma.$use(async (params, next) => {
  try {
    return await next(params);
  } catch (error: any) {
    // Log the error
    console.error(`Prisma Error in ${params.model}.${params.action}:`, error.message);
    
    // Rethrow the error
    throw error;
  }
});

// Enable query caching for better performance
prisma.$use(async (params, next) => {
  const startTime = Date.now();
  const result = await next(params);
  const endTime = Date.now();
  
  // Log slow queries in development
  if (process.env.NODE_ENV !== 'production' && endTime - startTime > 100) {
    console.warn(`Slow query detected (${endTime - startTime}ms): ${params.model}.${params.action}`);
  }
  
  return result;
});

export default prisma; 