import { PrismaClient, ProductClass } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get admin user ID
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (!adminUser) {
    console.error('No admin user found. Please run the main seed script first.');
    process.exit(1);
  }

  const adminId = adminUser.id;
  console.log(`Using admin user with ID: ${adminId}`);

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

// Helper function to create leaflet or brochure products
async function createLeaflet(
  name: string,
  sku: string,
  description: string,
  basePrice: number,
  dimensions: string,
  paperWeight: number,
  foldType: string | null,
  createdById: string
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
    await createVariant(product.id, 'Gloss Coating', 'With premium gloss coating', 0.015, createdById);
    await createVariant(product.id, 'Matte Coating', 'With premium matte coating', 0.018, createdById);

    console.log(`Created product: ${name} (${sku})`);
    return product;
  } catch (error) {
    console.error(`Error creating ${name}:`, error);
    throw error;
  }
}

// Helper function to create product variants
async function createVariant(
  productId: string,
  name: string,
  description: string,
  priceAdjustment: number,
  createdById: string
) {
  try {
    const variant = await prisma.productVariant.create({
      data: {
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
    throw error;
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