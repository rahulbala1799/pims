// Script to add correct products to Railway PostgreSQL database
const { PrismaClient, ProductClass } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedProducts() {
  console.log('Starting to add products with correct product classes...');
  
  // First get the admin user to set as the creator
  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@printpack.com' }
  });
  
  if (!adminUser) {
    throw new Error('Admin user not found. Please run create-admin.js first.');
  }
  
  const createdById = adminUser.id;
  
  // First, let's clean up the products table to avoid duplicates
  console.log('Clearing existing products...');
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});
  
  console.log('Adding Leaflet products...');
  // A3 Leaflets
  await createLeaflet('A3 Leaflet 130gsm', 'LF-A3-130', 'A3 size leaflet on 130gsm paper', 0.036, 'A3 (297x420mm)', 130, null, createdById);
  await createLeaflet('A3 Leaflet 170gsm', 'LF-A3-170', 'A3 size leaflet on 170gsm paper', 0.05, 'A3 (297x420mm)', 170, null, createdById);
  await createLeaflet('A3 Leaflet 200gsm', 'LF-A3-200', 'A3 size leaflet on 200gsm paper', 0.07, 'A3 (297x420mm)', 200, null, createdById);
  await createLeaflet('A3 Leaflet 300gsm', 'LF-A3-300', 'A3 size leaflet on 300gsm paper', 0.08, 'A3 (297x420mm)', 300, null, createdById);
  
  // A4 Leaflets
  await createLeaflet('A4 Leaflet 130gsm', 'LF-A4-130', 'A4 size leaflet on 130gsm paper', 0.018, 'A4 (210x297mm)', 130, null, createdById);
  await createLeaflet('A4 Leaflet 170gsm', 'LF-A4-170', 'A4 size leaflet on 170gsm paper', 0.025, 'A4 (210x297mm)', 170, null, createdById);
  await createLeaflet('A4 Leaflet 200gsm', 'LF-A4-200', 'A4 size leaflet on 200gsm paper', 0.035, 'A4 (210x297mm)', 200, null, createdById);
  await createLeaflet('A4 Leaflet 300gsm', 'LF-A4-300', 'A4 size leaflet on 300gsm paper', 0.04, 'A4 (210x297mm)', 300, null, createdById);
  
  // A5 Leaflets
  await createLeaflet('A5 Leaflet 130gsm', 'LF-A5-130', 'A5 size leaflet on 130gsm paper', 0.009, 'A5 (148x210mm)', 130, null, createdById);
  await createLeaflet('A5 Leaflet 170gsm', 'LF-A5-170', 'A5 size leaflet on 170gsm paper', 0.0125, 'A5 (148x210mm)', 170, null, createdById);
  await createLeaflet('A5 Leaflet 200gsm', 'LF-A5-200', 'A5 size leaflet on 200gsm paper', 0.0175, 'A5 (148x210mm)', 200, null, createdById);
  await createLeaflet('A5 Leaflet 300gsm', 'LF-A5-300', 'A5 size leaflet on 300gsm paper', 0.02, 'A5 (148x210mm)', 300, null, createdById);
  
  // A6 Leaflets
  await createLeaflet('A6 Leaflet 130gsm', 'LF-A6-130', 'A6 size leaflet on 130gsm paper', 0.0045, 'A6 (105x148mm)', 130, null, createdById);
  await createLeaflet('A6 Leaflet 170gsm', 'LF-A6-170', 'A6 size leaflet on 170gsm paper', 0.00625, 'A6 (105x148mm)', 170, null, createdById);
  await createLeaflet('A6 Leaflet 200gsm', 'LF-A6-200', 'A6 size leaflet on 200gsm paper', 0.00875, 'A6 (105x148mm)', 200, null, createdById);
  await createLeaflet('A6 Leaflet 300gsm', 'LF-A6-300', 'A6 size leaflet on 300gsm paper', 0.01, 'A6 (105x148mm)', 300, null, createdById);
  
  // Brochures - A4 Tri-fold
  await createLeaflet('A4 Tri-fold Brochure 130gsm', 'BR-A4-TF-130', 'A4 tri-fold brochure on 130gsm paper', 0.022, 'A4 (210x297mm)', 130, 'tri-fold', createdById);
  await createLeaflet('A4 Tri-fold Brochure 170gsm', 'BR-A4-TF-170', 'A4 tri-fold brochure on 170gsm paper', 0.03, 'A4 (210x297mm)', 170, 'tri-fold', createdById);
  await createLeaflet('A4 Tri-fold Brochure 200gsm', 'BR-A4-TF-200', 'A4 tri-fold brochure on 200gsm paper', 0.042, 'A4 (210x297mm)', 200, 'tri-fold', createdById);
  
  // Brochures - A4 Z-fold
  await createLeaflet('A4 Z-fold Brochure 130gsm', 'BR-A4-ZF-130', 'A4 z-fold brochure on 130gsm paper', 0.022, 'A4 (210x297mm)', 130, 'z-fold', createdById);
  await createLeaflet('A4 Z-fold Brochure 170gsm', 'BR-A4-ZF-170', 'A4 z-fold brochure on 170gsm paper', 0.03, 'A4 (210x297mm)', 170, 'z-fold', createdById);
  await createLeaflet('A4 Z-fold Brochure 200gsm', 'BR-A4-ZF-200', 'A4 z-fold brochure on 200gsm paper', 0.042, 'A4 (210x297mm)', 200, 'z-fold', createdById);
  
  // Brochures - A3 Half-fold
  await createLeaflet('A3 Half-fold Brochure 130gsm', 'BR-A3-HF-130', 'A3 half-fold brochure on 130gsm paper', 0.043, 'A3 (297x420mm)', 130, 'half-fold', createdById);
  await createLeaflet('A3 Half-fold Brochure 170gsm', 'BR-A3-HF-170', 'A3 half-fold brochure on 170gsm paper', 0.06, 'A3 (297x420mm)', 170, 'half-fold', createdById);
  await createLeaflet('A3 Half-fold Brochure 200gsm', 'BR-A3-HF-200', 'A3 half-fold brochure on 200gsm paper', 0.084, 'A3 (297x420mm)', 200, 'half-fold', createdById);
  
  console.log('Adding packaging products...');
  // Add Pizza Boxes
  await createPizzaBox('9 inch Pizza Box - Brown', 'PB-9-BR', '9 inch pizza box in brown kraft', 0.13, '9 inch', 'Brown Kraft', createdById);
  await createPizzaBox('10 inch Pizza Box - Brown', 'PB-10-BR', '10 inch pizza box in brown kraft', 0.14, '10 inch', 'Brown Kraft', createdById);
  await createPizzaBox('12 inch Pizza Box - Brown', 'PB-12-BR', '12 inch pizza box in brown kraft', 0.21, '12 inch', 'Brown Kraft', createdById);
  await createPizzaBox('14 inch Pizza Box - Brown', 'PB-14-BR', '14 inch pizza box in brown kraft', 0.27, '14 inch', 'Brown Kraft', createdById);
  
  console.log('Adding wide format products...');
  // Wide Format Products
  await createWideFormat('Vinyl Banner', 'WF-BN-01', 'Outdoor vinyl banner with eyelets', 11.99, 'Custom (per sq meter)', 'Vinyl 400gsm', createdById);
  await createWideFormat('Poster Print', 'WF-PP-01', 'High quality poster print', 9.99, 'Custom (per sq meter)', 'Satin 180gsm', createdById);
  await createWideFormat('Foamex Board', 'WF-FB-01', 'Rigid PVC foam board', 24.99, 'Custom (per sq meter)', 'Foamex 5mm', createdById);
  await createWideFormat('Correx Sheet', 'WF-CX-01', 'Corrugated plastic sheet', 19.99, 'Custom (per sq meter)', 'Correx 4mm', createdById);
  await createWideFormat('Roll-up Banner', 'WF-RB-01', 'Complete roll-up banner stand with print', 59.99, '85cm x 200cm', 'PVC with stand', createdById);
  await createWideFormat('Window Vinyl', 'WF-WV-01', 'Self-adhesive window vinyl', 14.99, 'Custom (per sq meter)', 'Window Vinyl', createdById);
  
  // Finished Products
  console.log('Adding finished products...');
  await createFinishedProduct('Business Cards', 'FN-BC-01', 'Standard business cards on premium stock', 19.99, '85mm x 55mm', '400gsm Silk', createdById, 100);
  await createFinishedProduct('Premium Invitations', 'FN-IN-01', 'Luxury invitations with envelopes', 99.99, 'A5 (148mm x 210mm)', '350gsm Silk', createdById, 50);
  await createFinishedProduct('Letterheads', 'FN-LH-01', 'Corporate letterheads', 29.99, 'A4 (210mm x 297mm)', '120gsm Uncoated', createdById, 250);
  await createFinishedProduct('Compliment Slips', 'FN-CS-01', 'Matching compliment slips', 24.99, 'DL (99mm x 210mm)', '120gsm Uncoated', createdById, 250);

  console.log('Products added successfully!');
}

// Helper function to create leaflet products
async function createLeaflet(name, sku, description, basePrice, dimensions, paperWeight, foldType, createdById) {
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
        weight: 0.1,
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
    return null; // Don't throw so script continues
  }
}

// Helper function to create pizza box products
async function createPizzaBox(name, sku, description, basePrice, dimensions, material, createdById) {
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
        weight: 0.2,
        material,
        finishOptions: ['Standard'],
        minOrderQuantity: 50,
        leadTime: 2,
        isActive: true,
        createdById,
        packagingType: 'Box'
      }
    });

    // Create variant for custom printing
    await createVariant(product.id, 'Custom Print', 'With 1-color custom printing', 0.08);

    console.log(`Created product: ${name} (${sku})`);
    return product;
  } catch (error) {
    console.error(`Error creating ${name}:`, error);
    return null; // Don't throw so script continues
  }
}

// Helper function to create wide format products
async function createWideFormat(name, sku, description, basePrice, dimensions, material, createdById) {
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
        productClass: ProductClass.WIDE_FORMAT,
        basePrice,
        unit: 'per item',
        dimensions,
        weight: 1.0,
        material,
        finishOptions: ['Standard'],
        minOrderQuantity: 1,
        leadTime: 2,
        isActive: true,
        createdById,
        costPerSqMeter: basePrice
      }
    });

    console.log(`Created product: ${name} (${sku})`);
    return product;
  } catch (error) {
    console.error(`Error creating ${name}:`, error);
    return null; // Don't throw so script continues
  }
}

// Helper function to create finished products
async function createFinishedProduct(name, sku, description, basePrice, dimensions, material, createdById, minOrderQuantity) {
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
        productClass: ProductClass.FINISHED,
        basePrice,
        unit: 'per pack',
        dimensions,
        weight: 0.3,
        material,
        finishOptions: ['Standard', 'Premium'],
        minOrderQuantity,
        leadTime: 3,
        isActive: true,
        createdById
      }
    });

    // Create premium variant 
    await createVariant(product.id, 'Premium Finish', 'With premium finishing options', basePrice * 0.2);

    console.log(`Created product: ${name} (${sku})`);
    return product;
  } catch (error) {
    console.error(`Error creating ${name}:`, error);
    return null; // Don't throw so script continues
  }
}

// Helper function to create product variants
async function createVariant(productId, name, description, priceAdjustment) {
  try {
    const variantId = `${productId}-${name.replace(/\s+/g, '-').toLowerCase()}`;
    
    const variant = await prisma.productVariant.upsert({
      where: { id: variantId },
      update: {
        name,
        description,
        priceAdjustment
      },
      create: {
        id: variantId,
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
    return null; // Don't throw error for variants, just log it
  }
}

// Run the function
seedProducts()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 