'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Define product classes
const PRODUCT_CLASSES = [
  { value: 'PACKAGING', label: 'Packaging' },
  { value: 'WIDE_FORMAT', label: 'Wide Format' },
  { value: 'LEAFLETS', label: 'Leaflets' },
  { value: 'FINISHED', label: 'Finished' },
];

// Define types
interface Product {
  id: string;
  name: string;
  sku: string;
  productClass: 'PACKAGING' | 'WIDE_FORMAT' | 'LEAFLETS' | 'FINISHED';
  basePrice: number;
  isActive: boolean;
  productVariants: { id: string }[];
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  
  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Build query parameters
        const params = new URLSearchParams();
        if (classFilter) params.append('class', classFilter);
        if (activeFilter !== 'all') params.append('active', activeFilter === 'active' ? 'true' : 'false');
        
        const queryString = params.toString() ? `?${params.toString()}` : '';
        const response = await fetch(`/api/products${queryString}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [classFilter, activeFilter]);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };
  
  // Get class badge color
  const getClassBadgeColor = (productClass: string) => {
    switch (productClass) {
      case 'PACKAGING':
        return 'bg-blue-100 text-blue-800';
      case 'WIDE_FORMAT':
        return 'bg-green-100 text-green-800';
      case 'LEAFLETS':
        return 'bg-yellow-100 text-yellow-800';
      case 'FINISHED':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div>
      {/* Filters */}
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 mb-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-medium leading-6 text-gray-900">Filters</h2>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-2">
            <label htmlFor="classFilter" className="block text-sm font-medium text-gray-700">
              Product Class
            </label>
            <select
              id="classFilter"
              name="classFilter"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="">All Classes</option>
              {PRODUCT_CLASSES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="sm:col-span-2">
            <label htmlFor="activeFilter" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="activeFilter"
              name="activeFilter"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Products Table */}
      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              {loading ? (
                <div className="bg-white px-4 py-12 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                  </div>
                </div>
              ) : error ? (
                <div className="bg-white px-4 py-8 text-center text-sm text-red-500">
                  <p>{error}</p>
                </div>
              ) : products.length === 0 ? (
                <div className="bg-white px-4 py-8 text-center text-sm text-gray-500">
                  <p>No products found.</p>
                  <p className="mt-2">
                    <Link
                      href="/admin/products/new"
                      className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Add your first product
                    </Link>
                  </p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Name
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        SKU
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Class
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Base Price
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Variants
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{product.sku}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getClassBadgeColor(product.productClass)}`}>
                            {product.productClass.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(product.basePrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.productVariants?.length || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link href={`/admin/products/${product.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                            View
                          </Link>
                          <Link href={`/admin/products/${product.id}/edit`} className="text-indigo-600 hover:text-indigo-900">
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 