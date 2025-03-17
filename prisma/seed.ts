import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create a test admin user if it doesn't exist
  const adminEmail = 'admin@example.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  let adminId;
  
  if (!existingAdmin) {
    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: adminEmail,
        password: '$2a$10$ixlPY3AAd4ty1l6E2IsXUOXLm/49sQItKCyu1qzQAlhy9e0YwOw/K', // "password" hashed
        role: 'ADMIN',
      }
    });
    adminId = admin.id;
    console.log(`Created admin user with ID: ${adminId}`);
  } else {
    adminId = existingAdmin.id;
    console.log(`Using existing admin user with ID: ${adminId}`);
  }

  // Create test products
  const wideFormatProduct = await prisma.product.upsert({
    where: { sku: 'WF001' },
    update: {},
    create: {
      name: 'Vinyl Banner',
      sku: 'WF001',
      description: 'Outdoor vinyl banner with grommets',
      productClass: 'WIDE_FORMAT',
      basePrice: 25.00,
      unit: 'per square meter',
      material: 'Heavy-duty vinyl',
      finishOptions: ['Grommets', 'Hemmed edges'],
      minOrderQuantity: 1,
      leadTime: 3,
      isActive: true,
      printResolution: '1440dpi',
      defaultLength: 2,
      defaultWidth: 1,
      costPerSqMeter: 15.00,
      createdById: adminId,
    }
  });
  
  const packagingProduct = await prisma.product.upsert({
    where: { sku: 'PK001' },
    update: {},
    create: {
      name: 'Custom Box',
      sku: 'PK001',
      description: 'Custom printed box with full color printing',
      productClass: 'PACKAGING',
      basePrice: 3.50,
      unit: 'per item',
      dimensions: '300x200x100',
      material: 'Corrugated cardboard',
      finishOptions: ['Gloss finish', 'Matte finish'],
      minOrderQuantity: 50,
      leadTime: 7,
      isActive: true,
      packagingType: 'box',
      createdById: adminId,
    }
  });
  
  const leafletProduct = await prisma.product.upsert({
    where: { sku: 'LF001' },
    update: {},
    create: {
      name: 'Tri-fold Brochure',
      sku: 'LF001',
      description: 'Full color tri-fold brochure on high quality paper',
      productClass: 'LEAFLETS',
      basePrice: 0.75,
      unit: 'per item',
      dimensions: '210x297',
      material: 'Glossy paper',
      finishOptions: ['Single-sided', 'Double-sided'],
      minOrderQuantity: 100,
      leadTime: 5,
      isActive: true,
      paperWeight: 150,
      foldType: 'tri-fold',
      createdById: adminId,
    }
  });
  
  console.log('Products seeded successfully!');
  console.log(`Wide Format: ${wideFormatProduct.id}`);
  console.log(`Packaging: ${packagingProduct.id}`);
  console.log(`Leaflet: ${leafletProduct.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 