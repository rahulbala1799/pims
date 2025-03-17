const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Creating employee user...');
  
  try {
    // Check if employee already exists
    const existingEmployee = await prisma.user.findUnique({
      where: {
        email: 'employee@example.com',
      },
    });

    if (existingEmployee) {
      console.log('Employee user already exists.');
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('employee123', 10);

    // Create the employee user
    const employee = await prisma.user.create({
      data: {
        name: 'Demo Employee',
        email: 'employee@example.com',
        password: hashedPassword,
        role: 'EMPLOYEE',
      },
    });

    console.log(`Employee user created with ID: ${employee.id}`);
    console.log('Email: employee@example.com');
    console.log('Password: employee123');
  } catch (error) {
    console.error('Error creating employee user:', error);
    process.exit(1);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }); 