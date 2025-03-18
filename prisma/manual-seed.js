// This script is meant to be run manually on Railway as a one-off task
// It only runs the leaflet seed to avoid duplicating users and other data

const { PrismaClient, ProductClass } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting manual seed for products...');
  
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

  // PART 1: Leaflets and Brochures
  // Check if we already have leaflet products to avoid duplication
  const existingLeaflets = await prisma.product.count({
    where: {
      productClass: ProductClass.LEAFLETS
    }
  });
  
  if (existingLeaflets > 5) {
    console.log(`Found ${existingLeaflets} existing leaflet products. Skipping leaflet seeding to avoid duplication.`);
  } else {
    // Leaflets - A3
    await createLeaflet('A3 Leaflet 130gsm', 'LF-A3-130', 'A3 size leaflet on 130gsm paper', 0.036, 'A3 (297x420mm)', 130, null, adminId);
    await createLeaflet('A3 Leaflet 170gsm', 'LF-A3-170', 'A3 size leaflet on 170gsm paper', 0.05, 'A3 (297x420mm)', 170, null, adminId);
    await createLeaflet('A3 Leaflet 200gsm', 'LF-A3-200', 'A3 size leaflet on 200gsm paper', 0.07, 'A3 (297x420mm)', 200, null, adminId);
    await createLeaflet('A3 Leaflet 300gsm', 'LF-A3-300', 'A3 size leaflet on 300gsm paper', 0.08, 'A3 (297x420mm)', 300, null, adminId);
  
    // Leaflets - A4
    await createLeaflet('A4 Leaflet 130gsm', 'LF-A4-130', 'A4 size leaflet on 130gsm paper', 0.018, 'A4 (210x297mm)', 130, null, adminId);
    await createLeaflet('A4 Leaflet 170gsm', 'LF-A4-170', 'A4 size leaflet on 170gsm paper', 0.025, 'A4 (210x297mm)', 170, null, adminId);
    await createLeaflet('A4 Leaflet 200gsm', 'LF-A4-200', 'A4 size leaflet on 200gsm paper', 0.035, 'A4 (210x297mm)', 200, null, adminId);
    await createLeaflet('A4 Leaflet 300gsm', 'LF-A4-300', 'A4 size leaflet on 300gsm paper', 0.04, 'A4 (210x297mm)', 300, null, adminId);
  
    // Leaflets - A5
    await createLeaflet('A5 Leaflet 130gsm', 'LF-A5-130', 'A5 size leaflet on 130gsm paper', 0.009, 'A5 (148x210mm)', 130, null, adminId);
    await createLeaflet('A5 Leaflet 170gsm', 'LF-A5-170', 'A5 size leaflet on 170gsm paper', 0.0125, 'A5 (148x210mm)', 170, null, adminId);
    await createLeaflet('A5 Leaflet 200gsm', 'LF-A5-200', 'A5 size leaflet on 200gsm paper', 0.0175, 'A5 (148x210mm)', 200, null, adminId);
    await createLeaflet('A5 Leaflet 300gsm', 'LF-A5-300', 'A5 size leaflet on 300gsm paper', 0.02, 'A5 (148x210mm)', 300, null, adminId);
  
    // Leaflets - A6
    await createLeaflet('A6 Leaflet 130gsm', 'LF-A6-130', 'A6 size leaflet on 130gsm paper', 0.0045, 'A6 (105x148mm)', 130, null, adminId);
    await createLeaflet('A6 Leaflet 170gsm', 'LF-A6-170', 'A6 size leaflet on 170gsm paper', 0.00625, 'A6 (105x148mm)', 170, null, adminId);
    await createLeaflet('A6 Leaflet 200gsm', 'LF-A6-200', 'A6 size leaflet on 200gsm paper', 0.00875, 'A6 (105x148mm)', 200, null, adminId);
    await createLeaflet('A6 Leaflet 300gsm', 'LF-A6-300', 'A6 size leaflet on 300gsm paper', 0.01, 'A6 (105x148mm)', 300, null, adminId);
  
    // Brochures - A4 Tri-fold
    await createLeaflet('A4 Tri-fold Brochure 130gsm', 'BR-A4-TF-130', 'A4 tri-fold brochure on 130gsm paper', 0.022, 'A4 (210x297mm)', 130, 'tri-fold', adminId);
    await createLeaflet('A4 Tri-fold Brochure 170gsm', 'BR-A4-TF-170', 'A4 tri-fold brochure on 170gsm paper', 0.03, 'A4 (210x297mm)', 170, 'tri-fold', adminId);
    await createLeaflet('A4 Tri-fold Brochure 200gsm', 'BR-A4-TF-200', 'A4 tri-fold brochure on 200gsm paper', 0.042, 'A4 (210x297mm)', 200, 'tri-fold', adminId);
  
    // Brochures - A4 Z-fold
    await createLeaflet('A4 Z-fold Brochure 130gsm', 'BR-A4-ZF-130', 'A4 z-fold brochure on 130gsm paper', 0.022, 'A4 (210x297mm)', 130, 'z-fold', adminId);
    await createLeaflet('A4 Z-fold Brochure 170gsm', 'BR-A4-ZF-170', 'A4 z-fold brochure on 170gsm paper', 0.03, 'A4 (210x297mm)', 170, 'z-fold', adminId);
    await createLeaflet('A4 Z-fold Brochure 200gsm', 'BR-A4-ZF-200', 'A4 z-fold brochure on 200gsm paper', 0.042, 'A4 (210x297mm)', 200, 'z-fold', adminId);
  
    // Brochures - A3 Half-fold
    await createLeaflet('A3 Half-fold Brochure 130gsm', 'BR-A3-HF-130', 'A3 half-fold brochure on 130gsm paper', 0.043, 'A3 (297x420mm)', 130, 'half-fold', adminId);
    await createLeaflet('A3 Half-fold Brochure 170gsm', 'BR-A3-HF-170', 'A3 half-fold brochure on 170gsm paper', 0.06, 'A3 (297x420mm)', 170, 'half-fold', adminId);
    await createLeaflet('A3 Half-fold Brochure 200gsm', 'BR-A3-HF-200', 'A3 half-fold brochure on 200gsm paper', 0.084, 'A3 (297x420mm)', 200, 'half-fold', adminId);
  
    console.log('Leaflets and brochures seeded successfully!');
  }

  // PART 2: Pizza Boxes
  // Check if we already have pizza box products to avoid duplication
  const existingBoxes = await prisma.product.count({
    where: {
      productClass: ProductClass.PACKAGING,
      sku: { startsWith: 'PB-' }
    }
  });
  
  if (existingBoxes > 2) {
    console.log(`Found ${existingBoxes} existing pizza box products. Skipping pizza box seeding to avoid duplication.`);
  } else {
    // Add Pizza Boxes - Brown
    await createPizzaBox('9 inch Pizza Box - Brown', 'PB-9-BR', '9 inch pizza box in brown kraft', 0.13, '9 inch', 'Brown Kraft', adminId);
    await createPizzaBox('10 inch Pizza Box - Brown', 'PB-10-BR', '10 inch pizza box in brown kraft', 0.14, '10 inch', 'Brown Kraft', adminId);
    await createPizzaBox('12 inch Pizza Box - Brown', 'PB-12-BR', '12 inch pizza box in brown kraft', 0.21, '12 inch', 'Brown Kraft', adminId);
    await createPizzaBox('14 inch Pizza Box - Brown', 'PB-14-BR', '14 inch pizza box in brown kraft', 0.27, '14 inch', 'Brown Kraft', adminId);
  
    console.log('Pizza box products seeded successfully!');
  }

  console.log('All products seeded successfully!');
}

// Helper function to create leaflet or brochure products
async function createLeaflet(
  name,
  sku,
  description,
  basePrice,
  dimensions,
  paperWeight,
  foldType,
  createdById
) {
  try {
    const finishOptions = ['No coating', 'Gloss coating', 'Matte coating'];
    
    const product = await prisma.product.upsert({
      where: { sku },
      update: {
        name,
        description,
        basePrice,
        dimensions,
        paperWeight,
        foldType,
        finishOptions
      },
      create: {
        name,
        sku,
        description,
        productClass: ProductClass.LEAFLETS,
        basePrice,
        unit: 'per sheet',
        dimensions,
        material: `${paperWeight}gsm paper`,
        finishOptions,
        minOrderQuantity: 100,
        leadTime: 3,
        isActive: true,
        paperWeight,
        foldType,
        createdById
      }
    });

    // Create variants for different finishes
    await createVariant(product.id, 'Gloss Coating', 'With premium gloss coating', 0.015);
    await createVariant(product.id, 'Matte Coating', 'With premium matte coating', 0.018);

    console.log(`Created product: ${name} (${sku})`);
    return product;
  } catch (error) {
    console.error(`Error creating ${name}:`, error);
    throw error;
  }
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