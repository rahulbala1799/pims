const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getAdminUserId() {
  try {
    // Try to find an admin user
    const adminUser = await prisma.user.findFirst({
      where: {
        role: 'ADMIN'
      }
    });

    if (adminUser) {
      return adminUser.id;
    }

    // If no admin user exists, create one
    console.log('No admin user found, creating a new one...');
    const newAdmin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@printpack.com',
        password: '$2a$10$EKiSLUXPm.QZB.4NhfR9Ien.Kn4OdX1g8yD3GGSvT40FNsM.5Beeq', // hashed 'password'
        role: 'ADMIN'
      }
    });
    
    console.log(`Created new admin user with id: ${newAdmin.id}`);
    return newAdmin.id;
  } catch (error) {
    console.error('Error getting admin user:', error);
    throw error;
  }
}

async function main() {
  console.log('Adding sample products...');

  try {
    // Get a valid admin user ID
    const ADMIN_USER_ID = await getAdminUserId();
    console.log(`Using admin user ID: ${ADMIN_USER_ID}`);

    // Paper Bags - Packaging Products
    const paperBags = [
      {
        name: 'Paper Bag - Large',
        sku: 'PKG-BAG-L',
        description: 'Large size kraft paper bag with handles, suitable for retail and food service.',
        productClass: 'PACKAGING',
        basePrice: 0.09, // 9 cents
        unit: 'per item',
        dimensions: '320 x 410 x 120 mm',
        weight: 45,
        material: 'Brown Kraft Paper',
        finishOptions: ['Plain', 'Printed'],
        minOrderQuantity: 100,
        leadTime: 3,
        packagingType: 'bag',
        createdById: ADMIN_USER_ID
      },
      {
        name: 'Paper Bag - Medium',
        sku: 'PKG-BAG-M',
        description: 'Medium size kraft paper bag with handles, suitable for retail and food service.',
        productClass: 'PACKAGING',
        basePrice: 0.07, // 7 cents
        unit: 'per item',
        dimensions: '250 x 320 x 100 mm',
        weight: 35,
        material: 'Brown Kraft Paper',
        finishOptions: ['Plain', 'Printed'],
        minOrderQuantity: 100,
        leadTime: 3,
        packagingType: 'bag',
        createdById: ADMIN_USER_ID
      },
      {
        name: 'Paper Bag - Small',
        sku: 'PKG-BAG-S',
        description: 'Small size kraft paper bag with handles, suitable for retail and food service.',
        productClass: 'PACKAGING',
        basePrice: 0.06, // 6 cents
        unit: 'per item',
        dimensions: '180 x 220 x 80 mm',
        weight: 25,
        material: 'Brown Kraft Paper',
        finishOptions: ['Plain', 'Printed'],
        minOrderQuantity: 100,
        leadTime: 3,
        packagingType: 'bag',
        createdById: ADMIN_USER_ID
      }
    ];

    // Burger Boxes and Meal Boxes - Packaging Products
    const foodBoxes = [
      {
        name: '6-inch Burger Box',
        sku: 'PKG-BBOX-6',
        description: '6-inch eco-friendly burger box, perfect for standard burgers and sandwiches.',
        productClass: 'PACKAGING',
        basePrice: 0.09, // 9 cents
        unit: 'per item',
        dimensions: '152 x 152 x 80 mm',
        weight: 20,
        material: 'Kraft Cardboard',
        finishOptions: ['Plain', 'Custom Print'],
        minOrderQuantity: 250,
        leadTime: 4,
        packagingType: 'box',
        createdById: ADMIN_USER_ID
      },
      {
        name: '9-inch Bagasse Meal Box',
        sku: 'PKG-MBOX-9',
        description: '9-inch biodegradable bagasse meal box for takeaway food, environmentally friendly alternative to plastic containers.',
        productClass: 'PACKAGING',
        basePrice: 0.11, // 11 cents
        unit: 'per item',
        dimensions: '230 x 230 x 75 mm',
        weight: 30,
        material: 'Bagasse (Sugarcane Fiber)',
        finishOptions: ['Natural White'],
        minOrderQuantity: 250,
        leadTime: 5,
        packagingType: 'box',
        createdById: ADMIN_USER_ID
      },
      {
        name: '7-inch Bagasse Meal Box',
        sku: 'PKG-MBOX-7',
        description: '7-inch biodegradable bagasse meal box for smaller portions, environmentally friendly.',
        productClass: 'PACKAGING',
        basePrice: 0.09, // 9 cents
        unit: 'per item',
        dimensions: '180 x 180 x 75 mm',
        weight: 25,
        material: 'Bagasse (Sugarcane Fiber)',
        finishOptions: ['Natural White'],
        minOrderQuantity: 250,
        leadTime: 5,
        packagingType: 'box',
        createdById: ADMIN_USER_ID
      }
    ];

    // Wide Format Products
    const wideFormatProducts = [
      {
        name: 'Vinyl Roll - Standard',
        sku: 'WF-VINYL-STD',
        description: 'Standard vinyl roll for outdoor and indoor signage, banners and displays.',
        productClass: 'WIDE_FORMAT',
        basePrice: 120, // 120 euros for the roll
        unit: 'per roll',
        dimensions: '1300 x 50000 mm',
        weight: 18000,
        material: 'PVC Vinyl',
        finishOptions: ['Gloss', 'Matte'],
        minOrderQuantity: 1,
        leadTime: 2,
        printResolution: '1440dpi',
        defaultLength: 50, // 50 meters
        defaultWidth: 1.3, // 1.3 meters
        costPerSqMeter: 1.84, // 1.84 euros per square meter
        createdById: ADMIN_USER_ID
      },
      {
        name: 'Foamex Board',
        sku: 'WF-FOAMEX-STD',
        description: 'Rigid foam PVC board for signs, displays and exhibition graphics.',
        productClass: 'WIDE_FORMAT',
        basePrice: 46.8, // Base price calculated: 2.4m x 1.3m x €15 per sqm = €46.8
        unit: 'per board',
        dimensions: '2400 x 1300 x 5 mm',
        weight: 3500,
        material: 'PVC Foam',
        finishOptions: ['White', 'Printed'],
        minOrderQuantity: 1,
        leadTime: 3,
        printResolution: '1200dpi',
        defaultLength: 2.4, // 2.4 meters
        defaultWidth: 1.3, // 1.3 meters
        costPerSqMeter: 15, // 15 euros per square meter
        createdById: ADMIN_USER_ID
      }
    ];

    // Create all products
    const allProducts = [...paperBags, ...foodBoxes, ...wideFormatProducts];

    for (const product of allProducts) {
      const createdProduct = await prisma.product.create({
        data: product
      });
      console.log(`Created product: ${createdProduct.name} (SKU: ${createdProduct.sku})`);
    }

    console.log('All sample products have been added successfully!');
  } catch (error) {
    console.error('Error adding sample products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 