'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FiShoppingCart, 
  FiSearch, 
  FiFilter,
  FiChevronDown,
  FiInfo,
  FiX,
  FiGrid,
  FiList
} from 'react-icons/fi';

interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  price: number;
  unit: string;
  dimensions?: string;
  material?: string;
  finishOptions?: string[];
  minOrderQuantity: number;
  leadTime?: number;
  isCustomPriced: boolean;
}

export default function CustomerProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    material: [] as string[],
    finish: [] as string[]
  });
  
  // Get logged in user/customer info
  const getCustomerId = () => {
    try {
      const portalUser = localStorage.getItem('portalUser');
      if (portalUser) {
        const userData = JSON.parse(portalUser);
        return userData.customerId;
      }
      return null;
    } catch (error) {
      console.error('Error getting customer ID:', error);
      return null;
    }
  };
  
  // Fetch customer products
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const customerId = getCustomerId();
        
        if (!customerId) {
          throw new Error('Customer ID not found. Please log in again.');
        }
        
        const response = await fetch(`/api/portal/products?customerId=${customerId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const data = await response.json();
        setProducts(data.products || []);
        setFilteredProducts(data.products || []);
      } catch (err: any) {
        console.error('Error fetching products:', err);
        setError(err.message || 'An error occurred while fetching products');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProducts();
  }, []);
  
  // Filter products when search query or filters change
  useEffect(() => {
    if (!searchQuery && !filters.minPrice && !filters.maxPrice && filters.material.length === 0 && filters.finish.length === 0) {
      setFilteredProducts(products);
      return;
    }
    
    let filtered = [...products];
    
    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) || 
        product.sku.toLowerCase().includes(query) ||
        (product.description && product.description.toLowerCase().includes(query))
      );
    }
    
    // Apply price range filter
    if (filters.minPrice) {
      const minPrice = parseFloat(filters.minPrice);
      filtered = filtered.filter(product => product.price >= minPrice);
    }
    
    if (filters.maxPrice) {
      const maxPrice = parseFloat(filters.maxPrice);
      filtered = filtered.filter(product => product.price <= maxPrice);
    }
    
    // Apply material filter
    if (filters.material.length > 0) {
      filtered = filtered.filter(product => 
        product.material && filters.material.some(m => product.material?.includes(m))
      );
    }
    
    // Apply finish filter
    if (filters.finish.length > 0) {
      filtered = filtered.filter(product => 
        product.finishOptions && product.finishOptions.some(f => filters.finish.includes(f))
      );
    }
    
    setFilteredProducts(filtered);
  }, [searchQuery, filters, products]);
  
  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setFilters({
      minPrice: '',
      maxPrice: '',
      material: [],
      finish: []
    });
  };
  
  // Toggle material filter
  const toggleMaterialFilter = (material: string) => {
    setFilters(prev => {
      if (prev.material.includes(material)) {
        return { ...prev, material: prev.material.filter(m => m !== material) };
      } else {
        return { ...prev, material: [...prev.material, material] };
      }
    });
  };
  
  // Toggle finish filter
  const toggleFinishFilter = (finish: string) => {
    setFilters(prev => {
      if (prev.finish.includes(finish)) {
        return { ...prev, finish: prev.finish.filter(f => f !== finish) };
      } else {
        return { ...prev, finish: [...prev.finish, finish] };
      }
    });
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Get unique materials from products
  const getUniqueMaterials = () => {
    const materials = products
      .filter(p => p.material)
      .map(p => p.material as string);
    return Array.from(new Set(materials));
  };
  
  // Get unique finish options from products
  const getUniqueFinishes = () => {
    const finishes = products
      .filter(p => p.finishOptions)
      .flatMap(p => p.finishOptions as string[]);
    return Array.from(new Set(finishes));
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiX className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading products</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Product Catalog</h1>
        <p className="mt-1 text-sm text-gray-500">
          Browse our products and place your order
        </p>
      </div>
      
      {/* Search and filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
        <div className="relative flex-1 max-w-lg">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-4 w-full md:w-auto">
          <button
            type="button"
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter className="-ml-0.5 mr-2 h-4 w-4" />
            Filters
            <FiChevronDown className="ml-1 h-4 w-4" />
          </button>
          
          <div className="flex items-center space-x-2">
            <button
              type="button"
              className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-500'}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <FiGrid className="h-5 w-5" />
            </button>
            <button
              type="button"
              className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-500'}`}
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <FiList className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Filters panel */}
      {showFilters && (
        <div className="bg-white p-4 rounded-md shadow mb-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-gray-900">Filter Products</h3>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Reset filters
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Price range filters */}
            <div>
              <label htmlFor="min-price" className="block text-sm font-medium text-gray-700 mb-1">
                Min Price (€)
              </label>
              <input
                type="number"
                id="min-price"
                min="0"
                step="0.01"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="max-price" className="block text-sm font-medium text-gray-700 mb-1">
                Max Price (€)
              </label>
              <input
                type="number"
                id="max-price"
                min="0"
                step="0.01"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            {/* Material filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Material
              </label>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {getUniqueMaterials().map((material) => (
                  <div key={material} className="flex items-center">
                    <input
                      id={`material-${material}`}
                      type="checkbox"
                      checked={filters.material.includes(material)}
                      onChange={() => toggleMaterialFilter(material)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`material-${material}`} className="ml-2 text-sm text-gray-700">
                      {material}
                    </label>
                  </div>
                ))}
                {getUniqueMaterials().length === 0 && (
                  <p className="text-sm text-gray-500">No materials available</p>
                )}
              </div>
            </div>
            
            {/* Finish filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Finish
              </label>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {getUniqueFinishes().map((finish) => (
                  <div key={finish} className="flex items-center">
                    <input
                      id={`finish-${finish}`}
                      type="checkbox"
                      checked={filters.finish.includes(finish)}
                      onChange={() => toggleFinishFilter(finish)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`finish-${finish}`} className="ml-2 text-sm text-gray-700">
                      {finish}
                    </label>
                  </div>
                ))}
                {getUniqueFinishes().length === 0 && (
                  <p className="text-sm text-gray-500">No finish options available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* No products state */}
      {filteredProducts.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 text-center">
          <FiInfo className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {products.length === 0 
              ? "There are no products available in your catalog yet." 
              : "Try adjusting your search or filters to find what you're looking for."}
          </p>
          {products.length > 0 && (
            <div className="mt-6">
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Products grid or list */}
      {filteredProducts.length > 0 && (
        <div>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 flex flex-col">
                  <div className="flex-1 p-6">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                      {product.isCustomPriced && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Custom Price
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{product.sku}</p>
                    
                    {product.description && (
                      <p className="mt-2 text-sm text-gray-500 line-clamp-2">{product.description}</p>
                    )}
                    
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Price:</span>
                        <span className="font-medium text-gray-900">{formatCurrency(product.price)}/{product.unit}</span>
                      </div>
                      
                      {product.minOrderQuantity > 1 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Min. Order:</span>
                          <span className="text-gray-900">{product.minOrderQuantity} {product.unit}s</span>
                        </div>
                      )}
                      
                      {product.leadTime && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Lead Time:</span>
                          <span className="text-gray-900">{product.leadTime} day{product.leadTime !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                    <Link 
                      href={`/portal/products/${product.id}`} 
                      className="text-sm text-indigo-600 hover:text-indigo-900 font-medium"
                    >
                      View Details
                    </Link>
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      onClick={() => {/* Add to order functionality */}}
                    >
                      <FiShoppingCart className="-ml-0.5 mr-1.5 h-4 w-4" />
                      Add to Order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
              <ul className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <li key={product.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <p className="text-md font-medium text-indigo-600 truncate">{product.name}</p>
                            {product.isCustomPriced && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Custom Price
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            {product.sku} {product.description && `• ${product.description.substring(0, 60)}${product.description.length > 60 ? '...' : ''}`}
                          </p>
                        </div>
                        <div className="ml-6 flex-shrink-0 flex items-center">
                          <p className="px-2 inline-flex text-md leading-5 font-semibold text-green-800">
                            {formatCurrency(product.price)}/{product.unit}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          {product.material && (
                            <p className="flex items-center text-sm text-gray-500">
                              Material: {product.material}
                            </p>
                          )}
                          {product.material && product.dimensions && (
                            <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                              Dimensions: {product.dimensions}
                            </p>
                          )}
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <div className="flex space-x-4">
                            <Link 
                              href={`/portal/products/${product.id}`} 
                              className="text-indigo-600 hover:text-indigo-900 font-medium"
                            >
                              View Details
                            </Link>
                            <button
                              type="button"
                              className="inline-flex items-center text-indigo-600 hover:text-indigo-900"
                              onClick={() => {/* Add to order functionality */}}
                            >
                              <FiShoppingCart className="mr-1 h-4 w-4" />
                              Add to Order
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 