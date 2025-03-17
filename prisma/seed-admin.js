const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Creating superadmin user...');
  
  try {
    // Check if superadmin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: {
        email: 'admin@printpack.com',
      },
    });

    if (existingAdmin) {
      console.log('Superadmin user already exists.');
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    // Create the superadmin user
    const superadmin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'admin@printpack.com',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    console.log(`Superadmin user created with ID: ${superadmin.id}`);
    console.log('Email: admin@printpack.com');
    console.log('Password: Admin@123');
  } catch (error) {
    console.error('Error creating superadmin user:', error);
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