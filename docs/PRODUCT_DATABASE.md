# Product Database Documentation

This document outlines the structure of the product database in the PrintPack MIS system, including the relationships between products and other entities in the system.

## Product Model

The `Product` model is the central entity for managing all products in the system. Products are categorized into four classes:

1. **Packaging** - Boxes, bags, envelopes, etc.
2. **Wide Format** - Banners, posters, signage, etc.
3. **Leaflets** - Brochures, flyers, pamphlets, etc.
4. **Finished** - Books, magazines, bound documents, etc.

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| id | String | Unique identifier (CUID) |
| name | String | Product name |
| sku | String | Stock Keeping Unit (unique) |
| description | String? | Optional product description |
| productClass | Enum | PACKAGING, WIDE_FORMAT, LEAFLETS, FINISHED |
| basePrice | Decimal | Base price of the product |
| unit | String | Unit of measurement (e.g., "per item", "per square meter") |
| dimensions | String? | Format: "width x height x depth" in mm |
| weight | Float? | Weight in grams |
| material | String? | Material used |
| finishOptions | String[] | Array of available finishing options |
| minOrderQuantity | Int | Minimum order quantity (default: 1) |
| leadTime | Int? | Production lead time in days |
| isActive | Boolean | Whether the product is active (default: true) |
| createdById | String | ID of the user who created the product |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

### Class-Specific Fields

#### Packaging
- **packagingType**: Type of packaging (e.g., "box", "bag", "envelope")

#### Wide Format
- **printResolution**: Print resolution (e.g., "720dpi", "1440dpi")

#### Leaflets
- **paperWeight**: Paper weight in gsm
- **foldType**: Type of fold (e.g., "tri-fold", "z-fold")

#### Finished
- **bindingType**: Type of binding (e.g., "perfect bound", "saddle stitch")

## Product Variants

Products can have variants with different specifications or options:

| Field | Type | Description |
|-------|------|-------------|
| id | String | Unique identifier (CUID) |
| productId | String | Reference to the parent product |
| name | String | Variant name |
| description | String? | Optional variant description |
| priceAdjustment | Decimal | Amount to add/subtract from base price |
| isActive | Boolean | Whether the variant is active (default: true) |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

## Relationships

The Product model has relationships with several other entities in the system:

### 1. User (Creator)
- Each product is created by a user
- Relationship: Many-to-one (Many products can be created by one user)

### 2. Jobs (via JobProduct)
- Products are associated with jobs through the JobProduct junction table
- Relationship: Many-to-many (Many products can be used in many jobs)

### 3. Invoices (via InvoiceItem)
- Products appear on invoices through the InvoiceItem junction table
- Relationship: Many-to-many (Many products can appear on many invoices)

### 4. Job Costing
- Products indirectly relate to job costing through jobs
- The cost of products contributes to the overall job cost

## Database Diagram

```
User 1:N Product
Product 1:N ProductVariant
Product N:M Job (via JobProduct)
Product N:M Invoice (via InvoiceItem)
Job 1:N JobCosting
```

## Usage Guidelines

When working with the product database:

1. Always use the appropriate product class for categorization
2. Ensure SKUs are unique across all products
3. Use product variants for different options of the same base product
4. When connecting products to jobs, always use the JobProduct junction table
5. When adding products to invoices, use the InvoiceItem junction table

## API Endpoints

The following API endpoints are available for product management:

- `GET /api/products` - List all products
- `GET /api/products/:id` - Get a specific product
- `POST /api/products` - Create a new product
- `PUT /api/products/:id` - Update a product
- `DELETE /api/products/:id` - Delete a product
- `GET /api/products/class/:class` - Get products by class

## Future Considerations

1. **Inventory Management**: Track stock levels for physical products
2. **Product Categories**: Add more detailed categorization beyond the four main classes
3. **Custom Fields**: Allow for custom fields based on product type
4. **Product Images**: Add support for product images and galleries
5. **Pricing Tiers**: Implement quantity-based pricing tiers 