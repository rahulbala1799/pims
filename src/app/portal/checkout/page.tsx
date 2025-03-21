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

// Interface for invoice items
interface InvoiceItem {
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Interface for invoice
interface Invoice {
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  issueDate: string;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  notes: string;
}

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  
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

  // Create a date in ISO format that is X days from today
  const getFutureDate = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };
  
  // Generate a unique invoice number
  const generateInvoiceNumber = (): string => {
    const prefix = 'INV';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}${random}`;
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
      const orderResponse = await fetch('/api/portal/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });
      
      const orderResult = await orderResponse.json();
      
      if (!orderResponse.ok) {
        throw new Error(orderResult.error || 'Failed to place order');
      }
      
      // Store the order ID
      const newOrderId = orderResult.id || `order-${Date.now()}`;
      setOrderId(newOrderId);
      
      // Create invoice data
      const taxRate = 23; // 23% tax rate as requested
      const subtotal = totalPrice;
      const taxAmount = (subtotal * taxRate) / 100;
      const totalWithTax = subtotal + taxAmount;
      
      const invoiceData: Invoice = {
        invoiceNumber: generateInvoiceNumber(),
        customerId: user?.id || 'guest',
        customerName: formData.contactName,
        items: items.map(item => ({
          productId: item.productId,
          description: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity
        })),
        subtotal,
        taxRate,
        taxAmount,
        totalAmount: totalWithTax,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: getFutureDate(14), // Due in 14 days
        status: 'PENDING',
        notes: `Order: ${newOrderId}\nSpecial instructions: ${formData.specialInstructions}`
      };
      
      console.log('Creating invoice:', invoiceData);
      
      // Call API to create the invoice
      const invoiceResponse = await fetch('/api/portal/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(invoiceData)
      });
      
      const invoiceResult = await invoiceResponse.json();
      
      if (!invoiceResponse.ok) {
        // If the invoice fails, we still have the order, so don't throw an error
        console.error('Failed to create invoice:', invoiceResult.error);
      } else {
        // Store the invoice ID
        setInvoiceId(invoiceResult.id);
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

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
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
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link 
                href="/portal/orders" 
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                View Orders
              </Link>
              <Link 
                href="/portal/invoices" 
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                View Invoice
              </Link>
            </div>
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping & Billing</h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="shippingAddress" className="block text-sm font-medium text-gray-700">Shipping Address</label>
                    <textarea
                      id="shippingAddress"
                      name="shippingAddress"
                      rows={3}
                      value={formData.shippingAddress}
                      onChange={handleInputChange}
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
                    <label htmlFor="sameAsBilling" className="ml-2 block text-sm text-gray-900">
                      Billing address same as shipping
                    </label>
                  </div>
                  
                  {!formData.sameAsBilling && (
                    <div>
                      <label htmlFor="billingAddress" className="block text-sm font-medium text-gray-700">Billing Address</label>
                      <textarea
                        id="billingAddress"
                        name="billingAddress"
                        rows={3}
                        value={formData.billingAddress}
                        onChange={handleInputChange}
                        className="mt-1 block w-full shadow-sm sm:text-sm rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                  )}
                  
                  <div>
                    <label htmlFor="specialInstructions" className="block text-sm font-medium text-gray-700">Special Instructions</label>
                    <textarea
                      id="specialInstructions"
                      name="specialInstructions"
                      rows={3}
                      value={formData.specialInstructions}
                      onChange={handleInputChange}
                      className="mt-1 block w-full shadow-sm sm:text-sm rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Any specific requirements for your order?"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="paymentMethod-invoice"
                      name="paymentMethod"
                      type="radio"
                      checked={formData.paymentMethod === 'invoice'}
                      onChange={() => setFormData({...formData, paymentMethod: 'invoice'})}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <label htmlFor="paymentMethod-invoice" className="ml-3 block text-sm font-medium text-gray-700">
                      Pay by Invoice (Net 14 days)
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="paymentMethod-card"
                      name="paymentMethod"
                      type="radio"
                      checked={formData.paymentMethod === 'credit_card'}
                      onChange={() => setFormData({...formData, paymentMethod: 'credit_card'})}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <label htmlFor="paymentMethod-card" className="ml-3 block text-sm font-medium text-gray-700">
                      Credit Card
                    </label>
                  </div>
                  
                  {formData.paymentMethod === 'credit_card' && (
                    <div className="ml-7 bg-gray-50 p-4 rounded-md">
                      <p className="text-sm text-gray-500">
                        Credit card payment will be handled on the next screen by our secure payment processor.
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-8 lg:hidden">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
            
            <div className="border-t border-gray-200 pt-4">
              <ul role="list" className="divide-y divide-gray-200">
                {items.map((item) => (
                  <li key={item.id} className="py-4 flex">
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className="text-sm font-medium text-gray-900">
                          {item.name}
                        </h3>
                        <p className="text-sm font-medium text-gray-900 ml-4">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                      <div className="mt-1 flex justify-between text-sm text-gray-500">
                        <p>{item.quantity} × {formatCurrency(item.price)}</p>
                        <p className="ml-4">{item.sku}</p>
                      </div>
                      {item.notes && (
                        <p className="mt-1 text-sm text-gray-500 italic">
                          Note: {item.notes}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <p className="text-gray-500">Subtotal</p>
                <p className="font-medium text-gray-900">{formatCurrency(totalPrice)}</p>
              </div>
              
              <div className="flex justify-between text-sm">
                <p className="text-gray-500">VAT (23%)</p>
                <p className="font-medium text-gray-900">{formatCurrency(totalPrice * 0.23)}</p>
              </div>
              
              <div className="flex justify-between text-sm font-medium">
                <p className="text-gray-900">Order Total</p>
                <p className="text-indigo-600">{formatCurrency(totalPrice * 1.23)}</p>
              </div>
            </div>
          </div>
          
          <div className="hidden lg:block">
            <button
              type="submit"
              form="checkout-form"
              disabled={isLoading}
              onClick={handleSubmit}
              className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isLoading ? 'Processing...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 