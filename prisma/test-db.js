const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing database connection...');
    
    // Test connection by querying users
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users in the database:`);
    
    // Print user details (excluding password)
    users.forEach(user => {
      const { password, ...userData } = user;
      console.log(userData);
    });
    
    console.log('Database connection successful!');
  } catch (error) {
    console.error('Error connecting to database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 