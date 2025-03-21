'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';

interface CheckoutFormData {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  company: string;
  shippingAddress: string;
  billingAddress: string;
  sameAsBilling: boolean;
  specialInstructions: string;
  paymentMethod: 'invoice' | 'credit_card'; // Simplified for demo
}

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  
  const [formData, setFormData] = useState<CheckoutFormData>({
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    company: '',
    shippingAddress: '',
    billingAddress: '',
    sameAsBilling: true,
    specialInstructions: '',
    paymentMethod: 'invoice'
  });

  // Load user data from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('portalUser');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Prefill form with user data if available
      setFormData(prev => ({
        ...prev,
        contactName: parsedUser.name || '',
        contactEmail: parsedUser.email || '',
        contactPhone: parsedUser.phone || '',
        company: parsedUser.companyName || '',
        // If we had these stored, we would fill them:
        // shippingAddress: parsedUser.address || '',
        // billingAddress: parsedUser.address || ''
      }));
    }
  }, []);

  // Redirect to cart if cart is empty
  useEffect(() => {
    if (items.length === 0 && !isSubmitted) {
      router.push('/portal/cart');
    }
  }, [items, router, isSubmitted]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Update billing address when "same as shipping" is checked
    if (name === 'sameAsBilling' && checked) {
      setFormData(prev => ({
        ...prev,
        billingAddress: prev.shippingAddress
      }));
    } else if (name === 'shippingAddress' && formData.sameAsBilling) {
      setFormData(prev => ({
        ...prev,
        billingAddress: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      // Get token from localStorage
      const token = localStorage.getItem('portalToken');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const orderData = {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes
        })),
        specialInstructions: formData.specialInstructions,
        totalAmount: totalPrice,
        shipping: {
          address: formData.shippingAddress
        },
        billing: {
          address: formData.billingAddress,
          paymentMethod: formData.paymentMethod
        }
      };
      
      console.log('Placing order:', orderData);
      
      // Call API to create the order
      const response = await fetch('/api/portal/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to place order');
      }
      
      // Order placed successfully
      setIsSubmitted(true);
      clearCart();
      
    } catch (err: any) {
      console.error('Error placing order:', err);
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow-sm rounded-lg p-8 text-center">
          <div className="flex flex-col items-center justify-center">
            <FiCheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-medium text-gray-900 mb-2">Order Submitted Successfully!</h2>
            <p className="text-gray-500 mb-6">
              Thank you for your order. We will process it shortly and send you a confirmation email.
            </p>
            <Link 
              href="/portal/orders" 
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              View Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center mb-8">
        <Link 
          href="/portal/cart" 
          className="mr-4 text-gray-500 hover:text-gray-700"
        >
          <FiArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    id="contactName"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full shadow-sm sm:text-sm rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    id="contactEmail"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    className="mt-1 block w-full shadow-sm sm:text-sm rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    id="contactPhone"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    className="mt-1 block w-full shadow-sm sm:text-sm rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700">Company</label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="mt-1 block w-full shadow-sm sm:text-sm rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Information</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="shippingAddress" className="block text-sm font-medium text-gray-700">Shipping Address</label>
                    <textarea
                      id="shippingAddress"
                      name="shippingAddress"
                      value={formData.shippingAddress}
                      onChange={handleInputChange}
                      rows={3}
                      className="mt-1 block w-full shadow-sm sm:text-sm rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="sameAsBilling"
                      name="sameAsBilling"
                      checked={formData.sameAsBilling}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="sameAsBilling" className="ml-2 block text-sm text-gray-700">
                      Billing address is the same as shipping address
                    </label>
                  </div>
                  
                  {!formData.sameAsBilling && (
                    <div>
                      <label htmlFor="billingAddress" className="block text-sm font-medium text-gray-700">Billing Address</label>
                      <textarea
                        id="billingAddress"
                        name="billingAddress"
                        value={formData.billingAddress}
                        onChange={handleInputChange}
                        rows={3}
                        className="mt-1 block w-full shadow-sm sm:text-sm rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h2>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="invoice"
                      name="paymentMethod"
                      type="radio"
                      value="invoice"
                      checked={formData.paymentMethod === 'invoice'}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <label htmlFor="invoice" className="ml-3 block text-sm font-medium text-gray-700">
                      Pay by Invoice (Net 30)
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="credit_card"
                      name="paymentMethod"
                      type="radio"
                      value="credit_card"
                      checked={formData.paymentMethod === 'credit_card'}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <label htmlFor="credit_card" className="ml-3 block text-sm font-medium text-gray-700">
                      Credit Card (Payment details to be collected separately)
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <label htmlFor="specialInstructions" className="block text-sm font-medium text-gray-700">Special Instructions</label>
                <textarea
                  id="specialInstructions"
                  name="specialInstructions"
                  value={formData.specialInstructions}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full shadow-sm sm:text-sm rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? 'Processing...' : 'Place Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <div>
          <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
            <div className="border-b border-gray-200 divide-y divide-gray-200">
              {items.map((item) => (
                <div key={item.id} className="py-4 flex justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    {item.notes && <p className="text-xs text-gray-500 mt-1">Note: {item.notes}</p>}
                  </div>
                  <p className="text-sm font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="pt-4">
              <div className="flex justify-between text-base font-medium text-gray-900">
                <p>Subtotal</p>
                <p>${totalPrice.toFixed(2)}</p>
              </div>
              <p className="mt-0.5 text-sm text-gray-500">Shipping and taxes will be calculated after order submission.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 