// Script to restore products to Railway PostgreSQL database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedProducts() {
  console.log('Starting product restoration...');
  
  // First get the admin user to set as the creator
  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@printpack.com' }
  });
  
  if (!adminUser) {
    throw new Error('Admin user not found. Please run create-admin.js first.');
  }
  
  const createdById = adminUser.id;
  
  // Define product categories/classes
  const productClasses = ['BUSINESS_CARDS', 'BROCHURES', 'FLYERS', 'POSTERS', 'BANNERS', 'PACKAGING', 'STATIONERY', 'STICKERS', 'SIGNS', 'PROMOTIONAL'];
  
  const products = [
    // Business Cards
    {
      name: 'Standard Business Cards',
      sku: 'BC-STD-01',
      description: 'Standard 85 x 55mm business cards on 350gsm silk card',
      productClass: 'BUSINESS_CARDS',
      basePrice: 29.99,
      unit: 'pack',
      dimensions: '85mm x 55mm',
      weight: 0.1,
      material: 'Silk Card 350gsm',
      finishOptions: ['Matte', 'Gloss', 'Spot UV'],
      minOrderQuantity: 100,
      leadTime: 3,
      paperWeight: 350
    },
    {
      name: 'Premium Business Cards',
      sku: 'BC-PRM-01',
      description: 'Premium 85 x 55mm business cards on 400gsm silk card with lamination',
      productClass: 'BUSINESS_CARDS',
      basePrice: 39.99,
      unit: 'pack',
      dimensions: '85mm x 55mm',
      weight: 0.12,
      material: 'Silk Card 400gsm',
      finishOptions: ['Matte Lamination', 'Gloss Lamination', 'Spot UV'],
      minOrderQuantity: 100,
      leadTime: 3,
      paperWeight: 400
    },
    // Flyers
    {
      name: 'A5 Flyers',
      sku: 'FL-A5-01',
      description: 'A5 flyers on 150gsm gloss paper',
      productClass: 'FLYERS',
      basePrice: 49.99,
      unit: 'pack',
      dimensions: 'A5 (148mm x 210mm)',
      weight: 0.2,
      material: 'Gloss Paper 150gsm',
      finishOptions: ['Matte', 'Gloss'],
      minOrderQuantity: 250,
      leadTime: 4,
      paperWeight: 150
    },
    {
      name: 'A4 Flyers',
      sku: 'FL-A4-01',
      description: 'A4 flyers on 150gsm gloss paper',
      productClass: 'FLYERS',
      basePrice: 69.99,
      unit: 'pack',
      dimensions: 'A4 (210mm x 297mm)',
      weight: 0.4,
      material: 'Gloss Paper 150gsm',
      finishOptions: ['Matte', 'Gloss'],
      minOrderQuantity: 250,
      leadTime: 4,
      paperWeight: 150
    },
    // Brochures
    {
      name: 'A4 Bifold Brochure',
      sku: 'BR-A4BF-01',
      description: 'A4 bifold brochures on 170gsm silk paper',
      productClass: 'BROCHURES',
      basePrice: 89.99,
      unit: 'pack',
      dimensions: 'A4 folded to A5',
      weight: 0.5,
      material: 'Silk Paper 170gsm',
      finishOptions: ['Matte', 'Gloss'],
      minOrderQuantity: 100,
      leadTime: 5,
      paperWeight: 170,
      foldType: 'Bifold'
    },
    {
      name: 'A4 Trifold Brochure',
      sku: 'BR-A4TF-01',
      description: 'A4 trifold brochures on 170gsm silk paper',
      productClass: 'BROCHURES',
      basePrice: 99.99,
      unit: 'pack',
      dimensions: 'A4 folded to DL',
      weight: 0.5,
      material: 'Silk Paper 170gsm',
      finishOptions: ['Matte', 'Gloss'],
      minOrderQuantity: 100,
      leadTime: 5,
      paperWeight: 170,
      foldType: 'Trifold'
    },
    // Posters
    {
      name: 'A3 Poster',
      sku: 'PO-A3-01',
      description: 'A3 posters on 180gsm gloss paper',
      productClass: 'POSTERS',
      basePrice: 39.99,
      unit: 'each',
      dimensions: 'A3 (297mm x 420mm)',
      weight: 0.3,
      material: 'Gloss Paper 180gsm',
      finishOptions: ['Matte', 'Gloss'],
      minOrderQuantity: 10,
      leadTime: 3,
      paperWeight: 180
    },
    {
      name: 'A2 Poster',
      sku: 'PO-A2-01',
      description: 'A2 posters on 180gsm gloss paper',
      productClass: 'POSTERS',
      basePrice: 59.99,
      unit: 'each',
      dimensions: 'A2 (420mm x 594mm)',
      weight: 0.6,
      material: 'Gloss Paper 180gsm',
      finishOptions: ['Matte', 'Gloss'],
      minOrderQuantity: 5,
      leadTime: 3,
      paperWeight: 180
    },
    // Banners
    {
      name: 'Roll-up Banner',
      sku: 'BN-RU-01',
      description: 'Roll-up banner with stand, 85cm x 200cm',
      productClass: 'BANNERS',
      basePrice: 129.99,
      unit: 'each',
      dimensions: '850mm x 2000mm',
      weight: 2.5,
      material: 'PVC Banner Material',
      finishOptions: ['Matte', 'Semi-Gloss'],
      minOrderQuantity: 1,
      leadTime: 5,
      costPerSqMeter: 15.0,
      defaultLength: 2.0,
      defaultWidth: 0.85
    },
    {
      name: 'PVC Banner',
      sku: 'BN-PVC-01',
      description: 'Custom size PVC banner with eyelets',
      productClass: 'BANNERS',
      basePrice: 49.99,
      unit: 'sq.meter',
      dimensions: 'Custom',
      weight: 1.0,
      material: 'PVC Banner 440gsm',
      finishOptions: ['Matte', 'Gloss', 'Mesh'],
      minOrderQuantity: 1,
      leadTime: 3,
      costPerSqMeter: 12.0,
      defaultLength: 1.0,
      defaultWidth: 1.0
    },
    // Stationery
    {
      name: 'Letterheads',
      sku: 'ST-LH-01',
      description: 'A4 letterheads on 120gsm uncoated paper',
      productClass: 'STATIONERY',
      basePrice: 49.99,
      unit: 'pack',
      dimensions: 'A4 (210mm x 297mm)',
      weight: 0.5,
      material: 'Uncoated Paper 120gsm',
      finishOptions: ['Uncoated'],
      minOrderQuantity: 100,
      leadTime: 4,
      paperWeight: 120
    },
    {
      name: 'Compliment Slips',
      sku: 'ST-CS-01',
      description: 'DL compliment slips on 100gsm uncoated paper',
      productClass: 'STATIONERY',
      basePrice: 29.99,
      unit: 'pack',
      dimensions: 'DL (99mm x 210mm)',
      weight: 0.2,
      material: 'Uncoated Paper 100gsm',
      finishOptions: ['Uncoated'],
      minOrderQuantity: 100,
      leadTime: 3,
      paperWeight: 100
    },
    // Stickers
    {
      name: 'Circle Stickers',
      sku: 'SK-CIR-01',
      description: 'Circle stickers, 50mm diameter',
      productClass: 'STICKERS',
      basePrice: 59.99,
      unit: 'roll',
      dimensions: '50mm diameter',
      weight: 0.3,
      material: 'Vinyl',
      finishOptions: ['Matte', 'Gloss'],
      minOrderQuantity: 100,
      leadTime: 4
    },
    {
      name: 'Rectangle Stickers',
      sku: 'SK-REC-01',
      description: 'Rectangle stickers, 70mm x 50mm',
      productClass: 'STICKERS',
      basePrice: 59.99,
      unit: 'roll',
      dimensions: '70mm x 50mm',
      weight: 0.3,
      material: 'Vinyl',
      finishOptions: ['Matte', 'Gloss'],
      minOrderQuantity: 100,
      leadTime: 4
    },
    // Packaging
    {
      name: 'Small Cardboard Box',
      sku: 'PK-SCB-01',
      description: 'Small cardboard box, 200mm x 150mm x 100mm',
      productClass: 'PACKAGING',
      basePrice: 1.99,
      unit: 'each',
      dimensions: '200mm x 150mm x 100mm',
      weight: 0.2,
      material: 'Corrugated Cardboard',
      finishOptions: ['Plain', 'Printed 1 Color'],
      minOrderQuantity: 50,
      leadTime: 7,
      packagingType: 'Box'
    },
    {
      name: 'Medium Cardboard Box',
      sku: 'PK-MCB-01',
      description: 'Medium cardboard box, 300mm x 250mm x 150mm',
      productClass: 'PACKAGING',
      basePrice: 2.99,
      unit: 'each',
      dimensions: '300mm x 250mm x 150mm',
      weight: 0.4,
      material: 'Corrugated Cardboard',
      finishOptions: ['Plain', 'Printed 1 Color'],
      minOrderQuantity: 50,
      leadTime: 7,
      packagingType: 'Box'
    },
    // Signs
    {
      name: 'Correx Sign',
      sku: 'SG-CRX-01',
      description: 'Correx sign, 600mm x 400mm, 4mm thick',
      productClass: 'SIGNS',
      basePrice: 19.99,
      unit: 'each',
      dimensions: '600mm x 400mm',
      weight: 0.5,
      material: 'Correx 4mm',
      finishOptions: ['Full Color Print'],
      minOrderQuantity: 1,
      leadTime: 3,
      costPerSqMeter: 25.0,
      defaultLength: 0.6,
      defaultWidth: 0.4
    },
    {
      name: 'Foamex Sign',
      sku: 'SG-FMX-01',
      description: 'Foamex sign, 600mm x 400mm, 5mm thick',
      productClass: 'SIGNS',
      basePrice: 29.99,
      unit: 'each',
      dimensions: '600mm x 400mm',
      weight: 1.0,
      material: 'Foamex 5mm',
      finishOptions: ['Full Color Print'],
      minOrderQuantity: 1,
      leadTime: 4,
      costPerSqMeter: 35.0,
      defaultLength: 0.6,
      defaultWidth: 0.4
    },
    // Promotional
    {
      name: 'Branded Pens',
      sku: 'PR-PEN-01',
      description: 'Branded ballpoint pens',
      productClass: 'PROMOTIONAL',
      basePrice: 0.99,
      unit: 'each',
      dimensions: 'Standard',
      weight: 0.01,
      material: 'Plastic',
      finishOptions: ['1 Color Print', '2 Color Print'],
      minOrderQuantity: 100,
      leadTime: 7
    },
    {
      name: 'Branded Mugs',
      sku: 'PR-MUG-01',
      description: 'Branded ceramic mugs',
      productClass: 'PROMOTIONAL',
      basePrice: 4.99,
      unit: 'each',
      dimensions: 'Standard',
      weight: 0.3,
      material: 'Ceramic',
      finishOptions: ['Full Color Print'],
      minOrderQuantity: 36,
      leadTime: 10
    }
  ];
  
  // Additional products for a total of 40
  const additionalProducts = [
    // More Business Cards
    {
      name: 'Luxury Embossed Business Cards',
      sku: 'BC-LUX-01',
      description: 'Luxurious 400gsm business cards with embossing',
      productClass: 'BUSINESS_CARDS',
      basePrice: 59.99,
      unit: 'pack',
      dimensions: '85mm x 55mm',
      weight: 0.15,
      material: 'Cotton Paper 400gsm',
      finishOptions: ['Embossed', 'Foil Stamping', 'Die Cut'],
      minOrderQuantity: 100,
      leadTime: 5,
      paperWeight: 400
    },
    {
      name: 'Square Business Cards',
      sku: 'BC-SQ-01',
      description: 'Square 55mm x 55mm business cards on 350gsm silk card',
      productClass: 'BUSINESS_CARDS',
      basePrice: 34.99,
      unit: 'pack',
      dimensions: '55mm x 55mm',
      weight: 0.08,
      material: 'Silk Card 350gsm',
      finishOptions: ['Matte', 'Gloss', 'Spot UV'],
      minOrderQuantity: 100,
      leadTime: 3,
      paperWeight: 350
    },
    // More Flyers
    {
      name: 'A6 Flyers',
      sku: 'FL-A6-01',
      description: 'A6 flyers on 150gsm gloss paper',
      productClass: 'FLYERS',
      basePrice: 39.99,
      unit: 'pack',
      dimensions: 'A6 (105mm x 148mm)',
      weight: 0.15,
      material: 'Gloss Paper 150gsm',
      finishOptions: ['Matte', 'Gloss'],
      minOrderQuantity: 250,
      leadTime: 3,
      paperWeight: 150
    },
    {
      name: 'DL Flyers',
      sku: 'FL-DL-01',
      description: 'DL flyers on 150gsm gloss paper',
      productClass: 'FLYERS',
      basePrice: 44.99,
      unit: 'pack',
      dimensions: 'DL (99mm x 210mm)',
      weight: 0.25,
      material: 'Gloss Paper 150gsm',
      finishOptions: ['Matte', 'Gloss'],
      minOrderQuantity: 250,
      leadTime: 3,
      paperWeight: 150
    },
    // More Brochures
    {
      name: 'A5 Booklet',
      sku: 'BR-A5BK-01',
      description: 'A5 booklet, 8 pages on 130gsm gloss paper with stapled binding',
      productClass: 'BROCHURES',
      basePrice: 129.99,
      unit: 'pack',
      dimensions: 'A5 (148mm x 210mm)',
      weight: 0.8,
      material: 'Gloss Paper 130gsm',
      finishOptions: ['Matte', 'Gloss'],
      minOrderQuantity: 50,
      leadTime: 7,
      paperWeight: 130,
      bindingType: 'Stapled'
    },
    {
      name: 'Square Brochure',
      sku: 'BR-SQ-01',
      description: 'Square brochure, 210mm x 210mm, 4 pages on 170gsm silk paper',
      productClass: 'BROCHURES',
      basePrice: 109.99,
      unit: 'pack',
      dimensions: '210mm x 210mm',
      weight: 0.6,
      material: 'Silk Paper 170gsm',
      finishOptions: ['Matte', 'Gloss'],
      minOrderQuantity: 100,
      leadTime: 5,
      paperWeight: 170,
      foldType: 'Single Fold'
    },
    // More Posters
    {
      name: 'A1 Poster',
      sku: 'PO-A1-01',
      description: 'A1 posters on 180gsm gloss paper',
      productClass: 'POSTERS',
      basePrice: 79.99,
      unit: 'each',
      dimensions: 'A1 (594mm x 841mm)',
      weight: 1.0,
      material: 'Gloss Paper 180gsm',
      finishOptions: ['Matte', 'Gloss'],
      minOrderQuantity: 3,
      leadTime: 4,
      paperWeight: 180
    },
    {
      name: 'A0 Poster',
      sku: 'PO-A0-01',
      description: 'A0 posters on 180gsm gloss paper',
      productClass: 'POSTERS',
      basePrice: 99.99,
      unit: 'each',
      dimensions: 'A0 (841mm x 1189mm)',
      weight: 2.0,
      material: 'Gloss Paper 180gsm',
      finishOptions: ['Matte', 'Gloss'],
      minOrderQuantity: 1,
      leadTime: 5,
      paperWeight: 180
    },
    // More Banners
    {
      name: 'Fabric Banner',
      sku: 'BN-FB-01',
      description: 'Custom size fabric banner for indoor use',
      productClass: 'BANNERS',
      basePrice: 69.99,
      unit: 'sq.meter',
      dimensions: 'Custom',
      weight: 0.8,
      material: 'Polyester Fabric',
      finishOptions: ['Hemmed', 'With Pole Pockets'],
      minOrderQuantity: 1,
      leadTime: 5,
      costPerSqMeter: 18.0,
      defaultLength: 1.5,
      defaultWidth: 1.0
    },
    {
      name: 'X-Banner Stand',
      sku: 'BN-XB-01',
      description: 'X-Banner stand with print, 60cm x 160cm',
      productClass: 'BANNERS',
      basePrice: 89.99,
      unit: 'each',
      dimensions: '600mm x 1600mm',
      weight: 1.5,
      material: 'PVC Banner with Stand',
      finishOptions: ['Matte', 'Semi-Gloss'],
      minOrderQuantity: 1,
      leadTime: 4,
      costPerSqMeter: 14.0,
      defaultLength: 1.6,
      defaultWidth: 0.6
    },
    // More Stationery
    {
      name: 'Envelopes',
      sku: 'ST-ENV-01',
      description: 'C5 envelopes, white, self-seal',
      productClass: 'STATIONERY',
      basePrice: 39.99,
      unit: 'pack',
      dimensions: 'C5 (162mm x 229mm)',
      weight: 0.4,
      material: 'White Wove 100gsm',
      finishOptions: ['Plain', 'Printed'],
      minOrderQuantity: 100,
      leadTime: 5,
      paperWeight: 100
    },
    {
      name: 'NCR Forms',
      sku: 'ST-NCR-01',
      description: 'A4 NCR forms, 2-part',
      productClass: 'STATIONERY',
      basePrice: 79.99,
      unit: 'pack',
      dimensions: 'A4 (210mm x 297mm)',
      weight: 0.6,
      material: 'NCR Paper',
      finishOptions: ['2-Part', '3-Part', '4-Part'],
      minOrderQuantity: 50,
      leadTime: 6
    },
    // More Stickers
    {
      name: 'Custom Shape Stickers',
      sku: 'SK-CST-01',
      description: 'Custom shape stickers, maximum size 100mm x 100mm',
      productClass: 'STICKERS',
      basePrice: 69.99,
      unit: 'roll',
      dimensions: 'Max 100mm x 100mm',
      weight: 0.3,
      material: 'Vinyl',
      finishOptions: ['Matte', 'Gloss', 'Transparent'],
      minOrderQuantity: 100,
      leadTime: 6
    },
    {
      name: 'Waterproof Stickers',
      sku: 'SK-WP-01',
      description: 'Waterproof stickers, various shapes and sizes',
      productClass: 'STICKERS',
      basePrice: 79.99,
      unit: 'roll',
      dimensions: 'Various',
      weight: 0.3,
      material: 'Waterproof Vinyl',
      finishOptions: ['Matte', 'Gloss'],
      minOrderQuantity: 100,
      leadTime: 5
    },
    // More Packaging
    {
      name: 'Custom Mailer Box',
      sku: 'PK-CMB-01',
      description: 'Custom branded mailer box',
      productClass: 'PACKAGING',
      basePrice: 3.99,
      unit: 'each',
      dimensions: 'Custom',
      weight: 0.3,
      material: 'E-flute Cardboard',
      finishOptions: ['Full Color Print', 'Spot UV', 'Embossing'],
      minOrderQuantity: 100,
      leadTime: 10,
      packagingType: 'Mailer Box'
    },
    {
      name: 'Paper Bags',
      sku: 'PK-PBG-01',
      description: 'Branded paper bags with handles',
      productClass: 'PACKAGING',
      basePrice: 1.29,
      unit: 'each',
      dimensions: '250mm x 350mm x 100mm',
      weight: 0.15,
      material: 'Kraft Paper 170gsm',
      finishOptions: ['1 Color Print', 'Full Color Print'],
      minOrderQuantity: 100,
      leadTime: 8,
      packagingType: 'Bag'
    },
    // More Signs
    {
      name: 'Acrylic Sign',
      sku: 'SG-ACR-01',
      description: 'Acrylic sign, 400mm x 300mm, 5mm thick',
      productClass: 'SIGNS',
      basePrice: 49.99,
      unit: 'each',
      dimensions: '400mm x 300mm',
      weight: 1.2,
      material: 'Acrylic 5mm',
      finishOptions: ['Full Color Print', 'Engraved'],
      minOrderQuantity: 1,
      leadTime: 7,
      costPerSqMeter: 80.0,
      defaultLength: 0.4,
      defaultWidth: 0.3
    },
    {
      name: 'Aluminum Composite Sign',
      sku: 'SG-ACP-01',
      description: 'Aluminum composite panel sign, 600mm x 400mm, 3mm thick',
      productClass: 'SIGNS',
      basePrice: 39.99,
      unit: 'each',
      dimensions: '600mm x 400mm',
      weight: 1.5,
      material: 'Aluminum Composite 3mm',
      finishOptions: ['Full Color Print'],
      minOrderQuantity: 1,
      leadTime: 5,
      costPerSqMeter: 45.0,
      defaultLength: 0.6,
      defaultWidth: 0.4
    },
    // More Promotional
    {
      name: 'Branded USB Drives',
      sku: 'PR-USB-01',
      description: 'Branded USB flash drives, 8GB',
      productClass: 'PROMOTIONAL',
      basePrice: 8.99,
      unit: 'each',
      dimensions: 'Standard',
      weight: 0.02,
      material: 'Plastic/Metal',
      finishOptions: ['1 Color Print', 'Full Color Print'],
      minOrderQuantity: 50,
      leadTime: 10
    },
    {
      name: 'Branded Tote Bags',
      sku: 'PR-TOT-01',
      description: 'Branded cotton tote bags',
      productClass: 'PROMOTIONAL',
      basePrice: 3.99,
      unit: 'each',
      dimensions: '380mm x 420mm',
      weight: 0.15,
      material: 'Cotton',
      finishOptions: ['1 Color Print', 'Full Color Print'],
      minOrderQuantity: 50,
      leadTime: 7
    }
  ];
  
  // Combine all products
  const allProducts = [...products, ...additionalProducts];
  
  // Create the products
  console.log(`Creating ${allProducts.length} products...`);
  
  for (const product of allProducts) {
    // Check if product already exists by SKU
    const existingProduct = await prisma.product.findUnique({
      where: { sku: product.sku }
    });
    
    if (existingProduct) {
      console.log(`Product with SKU ${product.sku} already exists, skipping.`);
      continue;
    }
    
    // Prepare the data with proper type casting
    const productData = {
      ...product,
      basePrice: typeof product.basePrice === 'number' ? product.basePrice : parseFloat(product.basePrice),
      weight: typeof product.weight === 'number' ? product.weight : parseFloat(product.weight),
      minOrderQuantity: typeof product.minOrderQuantity === 'number' ? product.minOrderQuantity : parseInt(product.minOrderQuantity),
      leadTime: typeof product.leadTime === 'number' ? product.leadTime : parseInt(product.leadTime),
      paperWeight: product.paperWeight ? (typeof product.paperWeight === 'number' ? product.paperWeight : parseInt(product.paperWeight)) : null,
      costPerSqMeter: product.costPerSqMeter ? (typeof product.costPerSqMeter === 'number' ? product.costPerSqMeter : parseFloat(product.costPerSqMeter)) : null,
      defaultLength: product.defaultLength ? (typeof product.defaultLength === 'number' ? product.defaultLength : parseFloat(product.defaultLength)) : null,
      defaultWidth: product.defaultWidth ? (typeof product.defaultWidth === 'number' ? product.defaultWidth : parseFloat(product.defaultWidth)) : null,
      createdById
    };
    
    try {
      const newProduct = await prisma.product.create({
        data: productData
      });
      
      console.log(`Created product: ${newProduct.name} (${newProduct.sku})`);
    } catch (error) {
      console.error(`Error creating product ${product.sku}:`, error);
    }
  }
  
  console.log('Product restoration completed!');
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