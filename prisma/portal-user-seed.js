const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting to seed portal users...');

  // Find if we have any customers to associate with the portal user
  const customers = await prisma.customer.findMany({
    take: 1,
  });

  if (customers.length === 0) {
    console.log('No customers found, creating a test customer first...');
    
    // Create a test customer
    const testCustomer = await prisma.customer.create({
      data: {
        name: 'Test Customer',
        email: 'testcustomer@example.com',
        phone: '1234567890',
        address: '123 Test St',
      }
    });
    
    console.log(`Created test customer: ${testCustomer.name} (${testCustomer.id})`);
    
    // Use the newly created customer
    var customerId = testCustomer.id;
  } else {
    // Use the first existing customer
    var customerId = customers[0].id;
    console.log(`Using existing customer ID: ${customerId}`);
  }

  // Check if we already have a test portal user
  const existingUser = await prisma.portalUser.findUnique({
    where: {
      email: 'portal@example.com',
    },
  });

  if (existingUser) {
    console.log(`Test portal user already exists: ${existingUser.email}`);
    
    // Update the password to make sure it's what we expect
    const passwordHash = await bcrypt.hash('password123', 10);
    
    await prisma.portalUser.update({
      where: {
        id: existingUser.id,
      },
      data: {
        passwordHash,
        status: 'ACTIVE',
      },
    });
    
    console.log('Updated test portal user password');
  } else {
    // Create a test portal user
    const passwordHash = await bcrypt.hash('password123', 10);
    
    const newUser = await prisma.portalUser.create({
      data: {
        email: 'portal@example.com',
        passwordHash,
        firstName: 'Portal',
        lastName: 'User',
        role: 'ADMIN', // Make this user an admin for full access
        status: 'ACTIVE',
        customerId,
      },
    });
    
    console.log(`Created test portal user: ${newUser.email} (${newUser.id})`);
  }

  console.log('Portal user seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding portal users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 