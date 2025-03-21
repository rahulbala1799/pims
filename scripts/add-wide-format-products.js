// Script to add additional wide format products with finishing cost included in base price
const { PrismaClient, ProductClass } = require('@prisma/client');
const prisma = new PrismaClient();

async function addWideFormatProducts() {
  console.log('Starting to add additional wide format products...');
  
  // Get the admin user to set as the creator
  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@printpack.com' }
  });
  
  if (!adminUser) {
    throw new Error('Admin user not found. Please run create-admin.js first.');
  }
  
  const createdById = adminUser.id;
  
  // Add the new wide format products
  console.log('Adding new wide format products...');
  
  // Corriboard products
  await createWideFormatProduct(
    'Corriboard 3.5mm',
    'WF-CB-3.5',
    'Corrugated plastic board, 3.5mm thickness', 
    6.63,  // €4.63 + €2 finishing
    'Custom (per sq meter)',
    'Corriboard 3.5mm',
    createdById
  );
  
  await createWideFormatProduct(
    'Corriboard 5mm',
    'WF-CB-5',
    'Corrugated plastic board, 5mm thickness',
    7.72,  // €5.72 + €2 finishing
    'Custom (per sq meter)',
    'Corriboard 5mm',
    createdById
  );
  
  // Foamex products
  await createWideFormatProduct(
    'Foamex Board 3.5mm',
    'WF-FX-3.5',
    'Rigid PVC foam board, 3.5mm thickness',
    9.40,  // €7.40 + €2 finishing
    'Custom (per sq meter)',
    'Foamex 3.5mm',
    createdById
  );
  
  await createWideFormatProduct(
    'Foamex Board 5mm',
    'WF-FX-5',
    'Rigid PVC foam board, 5mm thickness',
    11.08,  // €9.08 + €2 finishing
    'Custom (per sq meter)',
    'Foamex 5mm',
    createdById
  );
  
  console.log('Additional wide format products added successfully!');
}

// Helper function to create wide format products
async function createWideFormatProduct(name, sku, description, basePrice, dimensions, material, createdById) {
  try {
    // Check if the product already exists
    const existingProduct = await prisma.product.findUnique({
      where: { sku }
    });
    
    if (existingProduct) {
      console.log(`Product ${name} (${sku}) already exists, updating...`);
      
      const product = await prisma.product.update({
        where: { sku },
        data: {
          name,
          description,
          basePrice,
          dimensions,
          material
        }
      });
      
      console.log(`Updated product: ${name} (${sku})`);
      return product;
    } else {
      // Create a new product
      const product = await prisma.product.create({
        data: {
          name,
          sku,
          description,
          productClass: ProductClass.WIDE_FORMAT,
          basePrice,
          unit: 'per sq meter',
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
    }
  } catch (error) {
    console.error(`Error creating/updating ${name}:`, error);
    return null; // Don't throw so script continues
  }
}

// Run the function
addWideFormatProducts()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 