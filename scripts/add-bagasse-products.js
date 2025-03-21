// Script to add bagasse products to the database
const { PrismaClient, ProductClass } = require('@prisma/client');
const prisma = new PrismaClient();

async function addBagasseProducts() {
  console.log('Starting to add bagasse products...');
  
  // Get the admin user to set as the creator
  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@printpack.com' }
  });
  
  if (!adminUser) {
    throw new Error('Admin user not found. Please run create-admin.js first.');
  }
  
  const createdById = adminUser.id;
  
  // Add the bagasse products
  console.log('Adding bagasse products...');
  
  // 9-inch Bagasse Meal Box
  await createBagasseProduct(
    '9-inch Bagasse Meal Box',
    'PKG-MBOX-9',
    '9-inch biodegradable bagasse meal box for takeaway food, environmentally friendly alternative to plastic containers.',
    0.11,
    '230 x 230 x 75 mm',
    30,
    'Bagasse (Sugarcane Fiber)',
    createdById
  );
  
  // 7-inch Bagasse Meal Box
  await createBagasseProduct(
    '7-inch Bagasse Meal Box',
    'PKG-MBOX-7',
    '7-inch biodegradable bagasse meal box for smaller portions, environmentally friendly.',
    0.09,
    '180 x 180 x 75 mm',
    25,
    'Bagasse (Sugarcane Fiber)',
    createdById
  );
  
  // 6-inch Bagasse Meal Box
  await createBagasseProduct(
    '6-inch Bagasse Meal Box',
    'PKG-MBOX-6',
    '6-inch biodegradable bagasse meal box for small portions, environmentally friendly.',
    0.07,
    '150 x 150 x 75 mm',
    20,
    'Bagasse (Sugarcane Fiber)',
    createdById
  );
  
  console.log('Bagasse products added successfully!');
}

// Helper function to create bagasse products
async function createBagasseProduct(name, sku, description, basePrice, dimensions, weight, material, createdById) {
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
          weight,
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
          productClass: ProductClass.PACKAGING,
          basePrice,
          unit: 'per item',
          dimensions,
          weight,
          material,
          finishOptions: ['Natural White'],
          minOrderQuantity: 250,
          leadTime: 5,
          isActive: true,
          createdById,
          packagingType: 'box'
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
addBagasseProducts()
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