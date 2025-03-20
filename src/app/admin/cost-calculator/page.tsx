'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  productClass: string;
  basePrice: number;
  costPerSqMeter?: number | null;
  defaultLength?: number | null;
  defaultWidth?: number | null;
}

export default function CostCalculator() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  // Calculator state
  const [length, setLength] = useState<number | ''>('');
  const [width, setWidth] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [inkCostPerUnit, setInkCostPerUnit] = useState<number>(0.04); // 4 cents default for packaging
  const [inkCostPerSqm, setInkCostPerSqm] = useState<number>(0.16); // 16 cents default for wide format
  const [inkCostPerPage, setInkCostPerPage] = useState<number>(0.004); // 0.4 cents default for leaflets
  
  // Results
  const [materialCost, setMaterialCost] = useState<number>(0);
  const [inkCost, setInkCost] = useState<number>(0);
  const [laborCost, setLaborCost] = useState<number>(0);
  const [consumablesCost, setConsumablesCost] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [selectedMargin, setSelectedMargin] = useState<number | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<number>(0);
  
  // Constants
  const CONSUMABLES_PACKAGING = 0.012; // €0.012
  const LABOR_PACKAGING = 0.02; // 2 cents
  const LABOR_WIDE_FORMAT = 4.8; // €4.8
  const LABOR_LEAFLETS = 0.01; // 1 cent per page
  
  useEffect(() => {
    // Fetch products
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);
  
  // Filter products based on search query
  useEffect(() => {
    if (searchQuery.length > 0) {
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
      setShowResults(true);
    } else {
      setFilteredProducts([]);
      setShowResults(false);
    }
  }, [searchQuery, products]);
  
  // Calculate costs when inputs change
  useEffect(() => {
    if (!selectedProduct) return;
    
    let material = 0;
    let ink = 0;
    let labor = 0;
    let consumables = 0;
    
    const qty = typeof quantity === 'number' ? quantity : 0;
    
    if (selectedProduct.productClass === 'PACKAGING') {
      // Packaging calculation
      material = parseFloat(selectedProduct.basePrice.toString()) * qty;
      ink = inkCostPerUnit * qty;
      labor = LABOR_PACKAGING * qty;
      consumables = CONSUMABLES_PACKAGING * qty;
    } else if (selectedProduct.productClass === 'WIDE_FORMAT') {
      // Wide format calculation
      const area = typeof length === 'number' && typeof width === 'number' 
        ? length * width 
        : (selectedProduct.defaultLength || 1) * (selectedProduct.defaultWidth || 1);
      
      material = (selectedProduct.costPerSqMeter || 0) * area * qty;
      ink = inkCostPerSqm * area * qty;
      labor = LABOR_WIDE_FORMAT * qty; // Multiply by quantity
      consumables = 0; // No consumables for wide format
    } else if (selectedProduct.productClass === 'LEAFLETS') {
      // Leaflets calculation
      material = parseFloat(selectedProduct.basePrice.toString()) * qty;
      ink = inkCostPerPage * qty;
      labor = LABOR_LEAFLETS * qty;
      consumables = 0; // No additional consumables for leaflets
    }
    
    setMaterialCost(material);
    setInkCost(ink);
    setLaborCost(labor);
    setConsumablesCost(consumables);
    setTotalCost(material + ink + labor + consumables);
    
  }, [selectedProduct, quantity, length, width, inkCostPerUnit, inkCostPerSqm, inkCostPerPage]);
  
  // Handle product selection
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setSearchQuery(product.name);
    setShowResults(false);
    setSelectedMargin(null);
    setQuantity(100); // Set default quantity
    
    // Set default values based on product type
    if (product.productClass === 'PACKAGING') {
      setInkCostPerUnit(0.04);
    } else if (product.productClass === 'WIDE_FORMAT') {
      setLength(product.defaultLength || 1);
      setWidth(product.defaultWidth || 1);
      setInkCostPerSqm(0.16);
    } else if (product.productClass === 'LEAFLETS') {
      setInkCostPerPage(0.004);
    }
  };
  
  // Format currency to euros with 2 decimal places using period as separator
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  // Calculate price with a given margin
  const calculatePriceWithMargin = (margin: number) => {
    if (totalCost === 0) return 0;
    return totalCost / (1 - margin / 100);
  };

  // Handle selecting a price margin
  const handleSelectMargin = (margin: number) => {
    setSelectedMargin(margin);
    setSelectedPrice(calculatePriceWithMargin(margin));
  };
  
  // Handle resetting the calculator for a new product
  const handleResetCalculator = () => {
    setSelectedProduct(null);
    setSearchQuery('');
    setSelectedMargin(null);
    setQuantity('');
    setLength('');
    setWidth('');
    setInkCostPerUnit(0.04);
    setInkCostPerSqm(0.16);
    setInkCostPerPage(0.004);
  };
  
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-md mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Print Cost Calculator</h1>
        <p className="text-gray-600">Calculate production costs and pricing for print products</p>
      </div>
      
      {/* Product Search */}
      <div className="mb-6">
        <label htmlFor="product-search" className="block text-lg font-medium text-gray-700 mb-2">
          Search for a product
        </label>
        <div className="relative">
          <input
            type="text"
            id="product-search"
            className="block w-full p-4 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-lg shadow-sm"
            placeholder="Enter product name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {showResults && filteredProducts.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md overflow-hidden">
              <ul className="max-h-60 overflow-y-auto">
                {filteredProducts.map(product => (
                  <li 
                    key={product.id}
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b truncate"
                    onClick={() => handleSelectProduct(product)}
                  >
                    <div className="font-medium truncate">{product.name}</div>
                    <div className="text-sm text-gray-500 truncate">SKU: {product.sku}</div>
                    <div className="text-sm text-gray-500 truncate">
                      {product.productClass} - Base: {formatCurrency(parseFloat(product.basePrice.toString()))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      {loading && (
        <div className="py-10 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-600">Loading products...</p>
        </div>
      )}
      
      {!loading && products.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-gray-600">No products found. Please add products to use the calculator.</p>
        </div>
      )}
      
      {selectedProduct && (
        <>
          <div className="p-4 bg-blue-50 rounded-md mb-6 shadow-sm">
            <h2 className="font-bold text-lg text-blue-800 truncate">{selectedProduct.name}</h2>
            <p className="text-blue-600 truncate">Category: {selectedProduct.productClass}</p>
            <p className="text-blue-600 text-sm truncate">Base Price: {formatCurrency(parseFloat(selectedProduct.basePrice.toString()))}</p>
          </div>
          
          {/* Calculator Form */}
          <div className="bg-white rounded-md shadow p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Production Details</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="quantity" className="block text-lg font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  id="quantity"
                  min="1"
                  className="block w-full p-4 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-lg shadow-sm"
                  value={quantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    setQuantity(val === '' ? '' : parseInt(val));
                  }}
                  placeholder="Enter quantity..."
                />
              </div>
              
              {selectedProduct.productClass === 'WIDE_FORMAT' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="length" className="block text-lg font-medium text-gray-700 mb-2">
                      Length (m)
                    </label>
                    <input
                      type="number"
                      id="length"
                      min="0.1"
                      step="0.1"
                      className="block w-full p-4 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-lg shadow-sm"
                      value={length}
                      onChange={(e) => setLength(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <label htmlFor="width" className="block text-lg font-medium text-gray-700 mb-2">
                      Width (m)
                    </label>
                    <input
                      type="number"
                      id="width"
                      min="0.1"
                      step="0.1"
                      className="block w-full p-4 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-lg shadow-sm"
                      value={width}
                      onChange={(e) => setWidth(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              )}
              
              {selectedProduct.productClass === 'PACKAGING' && (
                <div>
                  <label htmlFor="ink-cost" className="block text-lg font-medium text-gray-700 mb-2">
                    Ink Cost Per Unit (€)
                  </label>
                  <div className="relative mt-1 rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-lg">€</span>
                    </div>
                    <input
                      type="number"
                      id="ink-cost"
                      min="0.01"
                      step="0.01"
                      className="block w-full pl-10 p-4 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-lg shadow-sm"
                      value={inkCostPerUnit}
                      onChange={(e) => setInkCostPerUnit(parseFloat(e.target.value) || 0.04)}
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Default: €0.04 per unit</p>
                </div>
              )}
              
              {selectedProduct.productClass === 'WIDE_FORMAT' && (
                <div>
                  <label htmlFor="ink-cost-sqm" className="block text-lg font-medium text-gray-700 mb-2">
                    Ink Cost Per Square Meter (€)
                  </label>
                  <div className="relative mt-1 rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-lg">€</span>
                    </div>
                    <input
                      type="number"
                      id="ink-cost-sqm"
                      min="0.01"
                      step="0.01"
                      className="block w-full pl-10 p-4 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-lg shadow-sm"
                      value={inkCostPerSqm}
                      onChange={(e) => setInkCostPerSqm(parseFloat(e.target.value) || 0.16)}
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Default: €0.16 per square meter</p>
                </div>
              )}
              
              {selectedProduct.productClass === 'LEAFLETS' && (
                <div>
                  <label htmlFor="ink-cost-page" className="block text-lg font-medium text-gray-700 mb-2">
                    Ink Cost Per Page (€)
                  </label>
                  <div className="relative mt-1 rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-lg">€</span>
                    </div>
                    <input
                      type="number"
                      id="ink-cost-page"
                      min="0.001"
                      step="0.001"
                      className="block w-full pl-10 p-4 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-lg shadow-sm"
                      value={inkCostPerPage}
                      onChange={(e) => setInkCostPerPage(parseFloat(e.target.value) || 0.004)}
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Default: €0.004 per page</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Cost Breakdown */}
          <div className="bg-white rounded-md shadow p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Cost Breakdown</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span className="text-lg">Material Cost:</span>
                <span className="font-semibold text-lg">{formatCurrency(materialCost)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-lg">Ink Cost:</span>
                <span className="font-semibold text-lg">{formatCurrency(inkCost)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-lg">Labor Cost:</span>
                <span className="font-semibold text-lg">{formatCurrency(laborCost)}</span>
              </div>
              {consumablesCost > 0 && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-lg">Consumables:</span>
                  <span className="font-semibold text-lg">{formatCurrency(consumablesCost)}</span>
                </div>
              )}
              <div className="flex justify-between py-3 text-xl font-bold">
                <span>Total Cost:</span>
                <span>{formatCurrency(totalCost)}</span>
              </div>
            </div>
          </div>
          
          {/* Pricing Options */}
          <div className="bg-white rounded-md shadow p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Pricing Options</h3>
            <p className="text-gray-600 mb-4">Tap on a margin option to calculate the selling price:</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[20, 25, 50, 75, 95].map((margin) => (
                <button
                  key={margin}
                  onClick={() => handleSelectMargin(margin)}
                  className={`p-4 border rounded-md text-center transition-colors h-24 flex flex-col justify-center items-center ${
                    selectedMargin === margin 
                      ? 'border-indigo-500 bg-indigo-100 ring-2 ring-indigo-500 ring-opacity-50' 
                      : 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100'
                  }`}
                >
                  <div className={`font-semibold text-lg ${selectedMargin === margin ? 'text-indigo-900' : 'text-indigo-800'}`}>
                    {margin}% Margin
                  </div>
                  <div className={`text-lg ${selectedMargin === margin ? 'text-indigo-700' : 'text-indigo-600'} truncate max-w-full`}>
                    {formatCurrency(calculatePriceWithMargin(margin))}
                  </div>
                </button>
              ))}
            </div>
            
            {selectedMargin !== null && (
              <div className="mt-6 p-4 bg-green-50 rounded-md shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-green-800 text-lg">Selected Pricing</h4>
                    <p className="text-green-700">{selectedMargin}% Gross Margin</p>
                  </div>
                  <div className="text-2xl font-bold text-green-800">
                    {formatCurrency(selectedPrice)}
                  </div>
                </div>
                <div className="mt-2 text-green-600">
                  Profit: {formatCurrency(selectedPrice - totalCost)}
                </div>
              </div>
            )}
          </div>
        </>
      )}
      
      <div className="mt-8 mb-10 flex flex-col sm:flex-row gap-4">
        <Link 
          href="/admin/dashboard"
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Back to Dashboard
        </Link>
        
        {selectedProduct && (
          <button
            onClick={handleResetCalculator}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Calculate for Another Product
          </button>
        )}
      </div>
    </div>
  );
} 