// Script to create portal admin user in the database
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createPortalAdmin() {
  try {
    console.log('Starting portal admin creation process...');
    
    // First, ensure we have a customer for this admin
    let customer = await prisma.customer.findFirst({
      where: { 
        name: 'PrintPack Admin' 
      }
    });
    
    if (!customer) {
      console.log('Creating admin customer...');
      customer = await prisma.customer.create({
        data: {
          name: 'PrintPack Admin',
          email: 'admin@printpack.com',
          phone: '+1234567890',
          address: '123 Admin Street, Admin City'
        }
      });
      console.log(`Created customer with ID: ${customer.id}`);
    } else {
      console.log(`Using existing customer with ID: ${customer.id}`);
    }
    
    // Check if portal user already exists
    const existingUser = await prisma.portalUser.findUnique({
      where: { 
        email: 'admin@printpack.com' 
      }
    });
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    
    if (existingUser) {
      console.log('Portal admin user already exists. Updating...');
      
      // Update the existing user
      await prisma.portalUser.update({
        where: { email: 'admin@printpack.com' },
        data: {
          passwordHash: hashedPassword,
          role: 'ADMIN',
          status: 'ACTIVE',
          firstName: 'Admin',
          lastName: 'User',
          customerId: customer.id
        }
      });
      
      console.log('Portal admin user updated successfully');
    } else {
      console.log('Creating new portal admin user...');
      
      // Create the portal admin user
      await prisma.portalUser.create({
        data: {
          email: 'admin@printpack.com',
          passwordHash: hashedPassword,
          role: 'ADMIN',
          status: 'ACTIVE',
          firstName: 'Admin',
          lastName: 'User',
          customerId: customer.id
        }
      });
      
      console.log('Portal admin user created successfully');
    }
  } catch (error) {
    console.error('Error creating portal admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createPortalAdmin()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 