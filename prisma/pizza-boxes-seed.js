// This script adds pizza box products to the database
const { PrismaClient, ProductClass } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed for pizza boxes...');
  
  // Get admin user ID
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (!adminUser) {
    console.error('No admin user found. Please ensure the main seed has been run first.');
    process.exit(1);
  }

  const adminId = adminUser.id;
  console.log(`Using admin user with ID: ${adminId}`);

  // Check if we already have pizza box products to avoid duplication
  const existingBoxes = await prisma.product.count({
    where: {
      productClass: ProductClass.PACKAGING,
      sku: { startsWith: 'PB-' }
    }
  });
  
  if (existingBoxes > 2) {
    console.log(`Found ${existingBoxes} existing pizza box products. Skipping seeding to avoid duplication.`);
    process.exit(0);
  }

  // Add Pizza Boxes - Brown
  await createPizzaBox('9 inch Pizza Box - Brown', 'PB-9-BR', '9 inch pizza box in brown kraft', 0.13, '9 inch', 'Brown Kraft', adminId);
  await createPizzaBox('10 inch Pizza Box - Brown', 'PB-10-BR', '10 inch pizza box in brown kraft', 0.14, '10 inch', 'Brown Kraft', adminId);
  await createPizzaBox('12 inch Pizza Box - Brown', 'PB-12-BR', '12 inch pizza box in brown kraft', 0.21, '12 inch', 'Brown Kraft', adminId);
  await createPizzaBox('14 inch Pizza Box - Brown', 'PB-14-BR', '14 inch pizza box in brown kraft', 0.27, '14 inch', 'Brown Kraft', adminId);

  console.log('Pizza box products seeded successfully!');
}

// Helper function to create pizza box products
async function createPizzaBox(
  name,
  sku,
  description,
  basePrice,
  dimensions,
  material,
  createdById
) {
  try {
    const product = await prisma.product.upsert({
      where: { sku },
      update: {
        name,
        description,
        basePrice,
        dimensions,
        material
      },
      create: {
        name,
        sku,
        description,
        productClass: ProductClass.PACKAGING,
        basePrice,
        unit: 'per box',
        dimensions,
        material,
        finishOptions: ['Standard'],
        minOrderQuantity: 50,
        leadTime: 2,
        isActive: true,
        createdById
      }
    });

    // Create variant for custom printing
    await createVariant(product.id, 'Custom Print', 'With 1-color custom printing', 0.08);

    console.log(`Created product: ${name} (${sku})`);
    return product;
  } catch (error) {
    console.error(`Error creating ${name}:`, error);
    throw error;
  }
}

// Helper function to create product variants
async function createVariant(
  productId,
  name,
  description,
  priceAdjustment,
) {
  try {
    const variant = await prisma.productVariant.upsert({
      where: {
        id: `${productId}-${name.replace(/\s+/g, '-').toLowerCase()}`
      },
      update: {
        name,
        description,
        priceAdjustment
      },
      create: {
        id: `${productId}-${name.replace(/\s+/g, '-').toLowerCase()}`,
        productId,
        name,
        description,
        priceAdjustment,
        isActive: true
      }
    });
    return variant;
  } catch (error) {
    console.error(`Error creating variant ${name}:`, error);
    // Don't throw error for variants, just log it
    return null;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 