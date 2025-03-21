'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiShoppingCart, FiInfo, FiCheck } from 'react-icons/fi';
import { useCart } from '@/context/CartContext';

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

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedFinish, setSelectedFinish] = useState<string>('');
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    if (!params?.id) return;

    // Fetch product details
    setIsLoading(true);
    setError(null);

    // In a real app, this would be an API call to get the product by ID
    // For now, we'll simulate the API call with a timeout
    setTimeout(() => {
      // Mock product data for demonstration purposes
      // In a real app, you'd fetch this from an API
      const mockProduct: Product = {
        id: params.id as string,
        name: "Business Card",
        sku: "BC-001",
        description: "High quality business cards printed on premium stock.",
        price: 49.99,
        unit: "pack",
        dimensions: "85mm x 55mm",
        material: "350gsm Premium Matte",
        finishOptions: ["Matte", "Glossy", "Spot UV"],
        minOrderQuantity: 100,
        leadTime: 3,
        isCustomPriced: false
      };
      
      setProduct(mockProduct);
      setQuantity(mockProduct.minOrderQuantity);
      if (mockProduct.finishOptions && mockProduct.finishOptions.length > 0) {
        setSelectedFinish(mockProduct.finishOptions[0]);
      }
      setIsLoading(false);
    }, 1000);
  }, [params]);

  const handleQuantityChange = (newQuantity: number) => {
    if (product && newQuantity >= product.minOrderQuantity) {
      setQuantity(newQuantity);
    }
  };

  const handleQuantityInputChange = (value: string) => {
    const parsedValue = parseInt(value) || product?.minOrderQuantity || 1;
    if (product && parsedValue >= product.minOrderQuantity) {
      setQuantity(parsedValue);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    addItem({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      quantity: quantity,
      unit: product.unit,
      customPriced: product.isCustomPriced
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleOrderNow = () => {
    handleAddToCart();
    router.push('/portal/cart');
  };

  // Format currency
  const formatCurrency = (amount: number | string) => {
    // Convert to number if it's a string, or default to 0 if conversion fails
    const numAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
    return typeof numAmount === 'number' ? 
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2
      }).format(numAmount) : '€0.00';
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiInfo className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
        <Link href="/portal/products" className="text-indigo-600 hover:text-indigo-900">
          ← Back to Products
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiInfo className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Product not found
              </p>
            </div>
          </div>
        </div>
        <Link href="/portal/products" className="text-indigo-600 hover:text-indigo-900">
          ← Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/portal/products" className="inline-flex items-center text-indigo-600 hover:text-indigo-900 mb-6">
        <FiArrowLeft className="mr-2" /> Back to Products
      </Link>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">{product.name}</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">SKU: {product.sku}</p>
          </div>
          {product.isCustomPriced && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Custom Price
            </span>
          )}
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Price</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatCurrency(product.price)} per {product.unit}
              </dd>
            </div>
            {product.description && (
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {product.description}
                </dd>
              </div>
            )}
            {product.dimensions && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Dimensions</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {product.dimensions}
                </dd>
              </div>
            )}
            {product.material && (
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Material</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {product.material}
                </dd>
              </div>
            )}
            {product.finishOptions && product.finishOptions.length > 0 && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Finish Options</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="flex flex-wrap gap-2">
                    {product.finishOptions.map((finish) => (
                      <button
                        key={finish}
                        type="button"
                        className={`inline-flex items-center px-3 py-1.5 border rounded-md text-sm font-medium ${
                          selectedFinish === finish
                            ? 'bg-indigo-100 border-indigo-500 text-indigo-800'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedFinish(finish)}
                      >
                        {finish}
                      </button>
                    ))}
                  </div>
                </dd>
              </div>
            )}
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Minimum Order</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {product.minOrderQuantity} {product.unit}s
              </dd>
            </div>
            {product.leadTime && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Lead Time</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {product.leadTime} day{product.leadTime !== 1 ? 's' : ''}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Order Information</h4>
        
        <div className="mb-6">
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
            Quantity ({product.unit}s)
          </label>
          <div className="flex items-center">
            <button
              type="button"
              className="inline-flex items-center p-1 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              onClick={() => handleQuantityChange(quantity - product.minOrderQuantity)}
              disabled={quantity <= product.minOrderQuantity}
            >
              <span className="sr-only">Decrease</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <input
              type="number"
              id="quantity"
              value={quantity}
              onChange={(e) => handleQuantityInputChange(e.target.value)}
              min={product.minOrderQuantity}
              step={product.minOrderQuantity}
              className="mx-2 block w-24 shadow-sm sm:text-sm border-gray-300 rounded-md text-center"
              placeholder={product.minOrderQuantity.toString()}
            />
            <button
              type="button"
              className="inline-flex items-center p-1 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              onClick={() => handleQuantityChange(quantity + product.minOrderQuantity)}
            >
              <span className="sr-only">Increase</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Minimum order quantity: {product.minOrderQuantity} {product.unit}s
          </p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between">
            <p className="text-sm font-medium text-gray-700">Subtotal:</p>
            <p className="text-sm font-medium text-gray-900">
              {formatCurrency(product.price * quantity)}
            </p>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Taxes and shipping calculated at checkout
          </p>
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={addedToCart}
            className={`flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              addedToCart ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
          >
            {addedToCart ? (
              <>
                <FiCheck className="-ml-1 mr-2 h-5 w-5" />
                Added to Cart
              </>
            ) : (
              <>
                <FiShoppingCart className="-ml-1 mr-2 h-5 w-5" />
                Add to Cart
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleOrderNow}
            className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-indigo-600 rounded-md text-sm font-medium text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Order Now
          </button>
        </div>
      </div>
    </div>
  );
} 