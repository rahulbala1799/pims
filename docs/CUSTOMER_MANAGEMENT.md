# Customer Management

This document outlines the customer management features of the Printing Management Information System (PMIS).

## Database Schema

The customer management system is built around the `Customer` model in the Prisma schema. The model includes:

- `id`: The unique identifier for each customer
- `name`: The customer's full name
- `email`: The customer's email address (unique)
- `phone`: The customer's phone number (optional)
- `address`: The customer's mailing address (optional)
- `createdAt`: Timestamp for when the customer was added
- `updatedAt`: Timestamp for when the customer was last updated

Customers are related to:
- `Job`: A customer can have multiple jobs
- `Invoice`: A customer can have multiple invoices

## API Routes

The customer management system exposes the following API endpoints:

### GET /api/customers
- Returns a list of all customers
- Includes counts of related jobs and invoices for each customer
- Orders customers by name in ascending order

### POST /api/customers
- Creates a new customer
- Required fields: `name`, `email`
- Optional fields: `phone`, `address`
- Validates that the email is not already in use

### GET /api/customers/[id]
- Returns a specific customer by ID
- Includes related jobs and invoices

### PUT /api/customers/[id]
- Updates a specific customer
- Required fields: `name`, `email`
- Optional fields: `phone`, `address`
- Validates that the email is not already in use by another customer

### DELETE /api/customers/[id]
- Deletes a specific customer
- Shows warnings if the customer has related jobs or invoices, but allows deletion

## User Interface

The customer management system provides the following pages:

### Customer List (/admin/customers)
- Displays a table of all customers
- Allows filtering by name, email, or phone
- Allows sorting by different fields
- Shows counts of jobs and invoices for each customer
- Provides links to view, edit, or add customers

### Add Customer (/admin/customers/new)
- Form to create a new customer
- Validates required fields
- Shows error messages for validation failures

### Customer Details (/admin/customers/[id])
- Displays all information about a specific customer
- Shows lists of the customer's jobs and invoices
- Provides links to add new jobs or invoices for the customer
- Includes buttons to edit or delete the customer

### Edit Customer (/admin/customers/[id]/edit)
- Form to update an existing customer
- Pre-filled with the customer's current information
- Validates required fields
- Shows error messages for validation failures

## Error Handling

All forms include comprehensive error handling for:
- Network errors when calling the API
- Validation errors for required fields
- Format validation for email addresses
- Unique constraint violations (duplicate email addresses)

## Future Enhancements

Potential future enhancements to the customer management system:
- Customer categories/tags for better organization
- Customer notes for recording additional information
- Customer portal for self-service
- Integration with marketing tools for customer communications
- Enhanced search capabilities with advanced filters
- Import/export functionality for customer data
- Customer activity log for tracking interactions 