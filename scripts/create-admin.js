// Script to create super admin user in the database
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    console.log('Starting super admin creation process...');
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { 
        email: 'admin@printpack.com' 
      }
    });
    
    if (existingUser) {
      console.log('Admin user already exists. Updating password...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      
      // Update the existing user
      await prisma.user.update({
        where: { email: 'admin@printpack.com' },
        data: {
          password: hashedPassword,
          role: 'ADMIN'
        }
      });
      
      console.log('Admin user password updated successfully');
    } else {
      console.log('Creating new admin user...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      
      // Create the admin user
      await prisma.user.create({
        data: {
          name: 'Super Admin',
          email: 'admin@printpack.com',
          password: hashedPassword,
          role: 'ADMIN'
        }
      });
      
      console.log('Super admin user created successfully');
    }
  } catch (error) {
    console.error('Error creating super admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createSuperAdmin()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 