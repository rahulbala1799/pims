'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Define product classes
const PRODUCT_CLASSES = [
  { value: 'PACKAGING', label: 'Packaging' },
  { value: 'WIDE_FORMAT', label: 'Wide Format' },
  { value: 'LEAFLETS', label: 'Leaflets' },
  { value: 'FINISHED', label: 'Finished' },
];

export default function NewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    productClass: '',
    basePrice: '',
    unit: '',
    dimensions: '',
    weight: '',
    material: '',
    finishOptions: '',
    minOrderQuantity: '1',
    leadTime: '',
    isActive: true,
    
    // Class-specific fields
    packagingType: '',
    printResolution: '',
    paperWeight: '',
    foldType: '',
    bindingType: '',
    defaultLength: '',
    defaultWidth: '',
    costPerSqMeter: '',
  });
  
  // Auto-calculate base price for Wide Format products
  useEffect(() => {
    if (selectedClass === 'WIDE_FORMAT' && 
        formData.defaultLength && 
        formData.defaultWidth && 
        formData.costPerSqMeter) {
      
      const length = parseFloat(formData.defaultLength);
      const width = parseFloat(formData.defaultWidth);
      const costPerSqMeter = parseFloat(formData.costPerSqMeter);
      
      if (length > 0 && width > 0 && costPerSqMeter > 0) {
        const area = length * width;
        const calculatedPrice = (area * costPerSqMeter).toFixed(2);
        
        setFormData(prev => ({
          ...prev,
          basePrice: calculatedPrice
        }));
      }
    }
  }, [selectedClass, formData.defaultLength, formData.defaultWidth, formData.costPerSqMeter]);
  
  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'productClass') {
      setSelectedClass(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Prepare data for API
      const apiData = {
        ...formData,
        basePrice: parseFloat(formData.basePrice),
        minOrderQuantity: parseInt(formData.minOrderQuantity),
        leadTime: formData.leadTime ? parseInt(formData.leadTime) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        paperWeight: formData.paperWeight ? parseInt(formData.paperWeight) : undefined,
        finishOptions: formData.finishOptions ? formData.finishOptions.split(',').map(item => item.trim()) : [],
        // Use the admin user ID (this would normally come from authentication)
        createdById: 'cm8d89fah000025bsnuwztyyq', // This should be replaced with the actual admin ID
      };
      
      // Send data to API
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create product');
      }
      
      const product = await response.json();
      
      // Redirect to product detail page
      router.push(`/admin/products/${product.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error creating product:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render class-specific fields
  const renderClassSpecificFields = () => {
    switch (selectedClass) {
      case 'PACKAGING':
        return (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900">Packaging Details</h3>
            <div className="mt-4">
              <label htmlFor="packagingType" className="block text-sm font-medium text-gray-700">
                Packaging Type
              </label>
              <input
                type="text"
                name="packagingType"
                id="packagingType"
                value={formData.packagingType}
                onChange={handleChange}
                placeholder="e.g., box, bag, envelope"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <p className="mt-1 text-sm text-gray-500">Specify the type of packaging (e.g., box, bag, envelope)</p>
            </div>
          </div>
        );
      
      case 'WIDE_FORMAT':
        return (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900">Wide Format Details</h3>
            <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label htmlFor="printResolution" className="block text-sm font-medium text-gray-700">
                  Print Resolution
                </label>
                <input
                  type="text"
                  name="printResolution"
                  id="printResolution"
                  value={formData.printResolution}
                  onChange={handleChange}
                  placeholder="e.g., 720dpi, 1440dpi"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="material" className="block text-sm font-medium text-gray-700">
                  Material
                </label>
                <input
                  type="text"
                  name="material"
                  id="material"
                  value={formData.material}
                  onChange={handleChange}
                  placeholder="e.g., Vinyl, Banner, Canvas"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="defaultLength" className="block text-sm font-medium text-gray-700">
                  Default Length (m)
                </label>
                <input
                  type="number"
                  name="defaultLength"
                  id="defaultLength"
                  value={formData.defaultLength || ''}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="e.g., 1.0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="defaultWidth" className="block text-sm font-medium text-gray-700">
                  Default Width (m)
                </label>
                <input
                  type="number"
                  name="defaultWidth"
                  id="defaultWidth"
                  value={formData.defaultWidth || ''}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="e.g., 1.0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="costPerSqMeter" className="block text-sm font-medium text-gray-700">
                  Cost Per Sq Meter (£)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">£</span>
                  </div>
                  <input
                    type="number"
                    name="costPerSqMeter"
                    id="costPerSqMeter"
                    value={formData.costPerSqMeter || ''}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  This will be used for job costing calculations
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="block text-sm font-medium text-gray-700">
                  Total Area
                </p>
                <div className="mt-1 text-sm text-gray-900">
                  {formData.defaultLength && formData.defaultWidth ? 
                    `${(parseFloat(formData.defaultLength) * parseFloat(formData.defaultWidth)).toFixed(2)} sq.m` : 
                    "Enter length and width to calculate area"}
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Base price = Cost per sq meter × Area
                </p>
              </div>
            </div>
          </div>
        );
      
      case 'LEAFLETS':
        return (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900">Leaflet Details</h3>
            <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label htmlFor="paperWeight" className="block text-sm font-medium text-gray-700">
                  Paper Weight (gsm)
                </label>
                <input
                  type="number"
                  name="paperWeight"
                  id="paperWeight"
                  value={formData.paperWeight}
                  onChange={handleChange}
                  placeholder="e.g., 120"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="foldType" className="block text-sm font-medium text-gray-700">
                  Fold Type
                </label>
                <input
                  type="text"
                  name="foldType"
                  id="foldType"
                  value={formData.foldType}
                  onChange={handleChange}
                  placeholder="e.g., tri-fold, z-fold"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        );
      
      case 'FINISHED':
        return (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900">Finished Product Details</h3>
            <div className="mt-4">
              <label htmlFor="bindingType" className="block text-sm font-medium text-gray-700">
                Binding Type
              </label>
              <input
                type="text"
                name="bindingType"
                id="bindingType"
                value={formData.bindingType}
                onChange={handleChange}
                placeholder="e.g., perfect bound, saddle stitch"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <p className="mt-1 text-sm text-gray-500">Specify the binding type (e.g., perfect bound, saddle stitch)</p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Add New Product
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            href="/admin/products"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </Link>
        </div>
      </div>
      
      {error && (
        <div className="mt-6 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="mt-6 space-y-8 divide-y divide-gray-200">
        <div className="space-y-8 divide-y divide-gray-200">
          {/* Basic Information */}
          <div>
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">Basic Information</h3>
              <p className="mt-1 text-sm text-gray-500">
                Provide the basic details about the product.
              </p>
            </div>
            
            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Product Name *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
                  SKU *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="sku"
                    id="sku"
                    required
                    value={formData.sku}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Stock Keeping Unit. Must be unique.
                </p>
              </div>
              
              <div className="sm:col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Brief description of the product.
                </p>
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="productClass" className="block text-sm font-medium text-gray-700">
                  Product Class *
                </label>
                <div className="mt-1">
                  <select
                    id="productClass"
                    name="productClass"
                    required
                    value={formData.productClass}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Select a class</option>
                    {PRODUCT_CLASSES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="sm:col-span-3">
                <div className="flex items-center h-full mt-6">
                  <input
                    id="isActive"
                    name="isActive"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Active product
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Pricing and Quantity */}
          <div className="pt-8">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">Pricing and Quantity</h3>
              <p className="mt-1 text-sm text-gray-500">
                Set the pricing and quantity information.
              </p>
            </div>
            
            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700">
                  Base Price *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">£</span>
                  </div>
                  <input
                    type="number"
                    name="basePrice"
                    id="basePrice"
                    required
                    min="0"
                    step="0.01"
                    value={formData.basePrice}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
                  Unit *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="unit"
                    id="unit"
                    required
                    value={formData.unit}
                    onChange={handleChange}
                    placeholder="e.g., per item, per sq.m"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="minOrderQuantity" className="block text-sm font-medium text-gray-700">
                  Min Order Quantity
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="minOrderQuantity"
                    id="minOrderQuantity"
                    min="1"
                    value={formData.minOrderQuantity}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="leadTime" className="block text-sm font-medium text-gray-700">
                  Lead Time (days)
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="leadTime"
                    id="leadTime"
                    min="0"
                    value={formData.leadTime}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Product Specifications */}
          <div className="pt-8">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">Product Specifications</h3>
              <p className="mt-1 text-sm text-gray-500">
                Provide additional details about the product.
              </p>
            </div>
            
            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="dimensions" className="block text-sm font-medium text-gray-700">
                  Dimensions
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="dimensions"
                    id="dimensions"
                    value={formData.dimensions}
                    onChange={handleChange}
                    placeholder="e.g., 100 x 200 x 50 mm"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Format: width x height x depth in mm
                </p>
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                  Weight (g)
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="weight"
                    id="weight"
                    min="0"
                    step="0.1"
                    value={formData.weight}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="material" className="block text-sm font-medium text-gray-700">
                  Material
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="material"
                    id="material"
                    value={formData.material}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="finishOptions" className="block text-sm font-medium text-gray-700">
                  Finish Options
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="finishOptions"
                    id="finishOptions"
                    value={formData.finishOptions}
                    onChange={handleChange}
                    placeholder="e.g., Matte, Gloss, Satin"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Comma-separated list of finish options
                </p>
              </div>
            </div>
          </div>
          
          {/* Class-specific fields */}
          {renderClassSpecificFields()}
        </div>
        
        <div className="pt-5">
          <div className="flex justify-end">
            <Link
              href="/admin/products"
              className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 