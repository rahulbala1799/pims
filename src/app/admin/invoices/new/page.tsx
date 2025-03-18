'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Define types
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  productClass: string;
  basePrice: number;
  unit: string;
  defaultLength?: number;
  defaultWidth?: number;
}

interface InvoiceItem {
  productId: string;
  product?: Product;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  length?: number;
  width?: number;
  area?: number;
}

interface InvoiceFormData {
  customerId: string;
  items: InvoiceItem[];
  taxRate: number;
  issueDate: string;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  notes: string;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productClass, setProductClass] = useState<string | null>(null);
  const [productLoading, setProductLoading] = useState(false);
  
  // Current item being edited
  const [currentItem, setCurrentItem] = useState<InvoiceItem>({
    productId: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0
  });
  
  // Edit mode for items
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<InvoiceFormData>({
    customerId: '',
    items: [],
    taxRate: 20, // Default to 20%
    issueDate: new Date().toISOString().split('T')[0], // Store as YYYY-MM-DD string
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    status: 'PENDING',
    notes: ''
  });

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/customers');
        if (!response.ok) {
          throw new Error('Failed to fetch customers');
        }
        const data = await response.json();
        setCustomers(data);
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // Filter customers based on search query
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (customer.phone && customer.phone.includes(searchQuery))
  );

  // Handle customer selection
  const handleSelectCustomer = (customerId: string) => {
    setFormData(prev => ({
      ...prev,
      customerId
    }));
  };

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setProductLoading(true);
      try {
        const endpoint = productClass 
          ? `/api/products/class/${productClass}` 
          : '/api/products';
          
        console.log(`Fetching products from: ${endpoint}`);
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error fetching products:', response.status, errorData);
          throw new Error(`Failed to fetch products: ${response.statusText}`);
        }
        
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setProductLoading(false);
      }
    };
    
    fetchProducts();
  }, [productClass]);
  
  // Filter products based on search query
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(productSearchQuery.toLowerCase())
  );
  
  // Add or update item to invoice
  const addItemToInvoice = () => {
    if (!currentItem.productId) return;
    
    const selectedProduct = products.find(p => p.id === currentItem.productId);
    if (!selectedProduct) return;
    
    // Calculate total price based on quantity and unit price
    const totalPrice = currentItem.quantity * currentItem.unitPrice;
    
    // Calculate area if wide format
    let area: number | undefined;
    if (selectedProduct.productClass === 'WIDE_FORMAT' && currentItem.length && currentItem.width) {
      area = parseFloat((currentItem.length * currentItem.width).toFixed(2));
    }
    
    const newItem: InvoiceItem = {
      ...currentItem,
      totalPrice,
      area
    };
    
    // If editing an existing item, replace it
    if (editingItemIndex !== null) {
      const updatedItems = [...formData.items];
      updatedItems[editingItemIndex] = newItem;
      
      setFormData(prev => ({
        ...prev,
        items: updatedItems
      }));
      
      setEditingItemIndex(null);
    } else {
      // Otherwise add as new item
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }));
    }
    
    // Reset current item
    setCurrentItem({
      productId: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0
    });
  };
  
  // Remove item from invoice
  const removeItem = (index: number) => {
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };
  
  // Edit an existing item
  const editItem = (index: number) => {
    setCurrentItem(formData.items[index]);
    setEditingItemIndex(index);
  };
  
  // Handle product selection
  const handleSelectProduct = (product: Product) => {
    const description = `${product.name} - ${product.sku}`;
    const unitPrice = product.basePrice;
    
    let length: number | undefined;
    let width: number | undefined;
    
    // Pre-fill dimensions for wide format products
    if (product.productClass === 'WIDE_FORMAT') {
      length = product.defaultLength;
      width = product.defaultWidth;
    }
    
    setCurrentItem({
      productId: product.id,
      description,
      quantity: 1,
      unitPrice,
      totalPrice: unitPrice, // Initial total = unit price * 1
      product,
      length,
      width
    });
  };
  
  // Calculate total when dimensions change for wide format
  useEffect(() => {
    if (currentItem.product?.productClass === 'WIDE_FORMAT' && 
        currentItem.length && 
        currentItem.width) {
      const area = currentItem.length * currentItem.width;
      const totalPrice = area * currentItem.unitPrice * currentItem.quantity;
      
      setCurrentItem(prev => ({
        ...prev,
        area,
        totalPrice
      }));
    } else if (currentItem.productId) {
      // For non-wide format products
      const totalPrice = currentItem.quantity * currentItem.unitPrice;
      
      setCurrentItem(prev => ({
        ...prev,
        totalPrice
      }));
    }
  }, [currentItem.length, currentItem.width, currentItem.quantity, currentItem.unitPrice, currentItem.product]);

  // Handle form field changes
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      status: e.target.value as 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED',
    });
  };

  const handleTaxRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      taxRate: Number(e.target.value),
    });
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      notes: e.target.value,
    });
  };

  // Calculate subtotal, tax amount, and total
  const subtotal = formData.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const taxAmount = subtotal * (formData.taxRate / 100);
  const total = subtotal + taxAmount;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  // Add the handleSubmit function
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validate form data
      if (!formData.customerId) {
        throw new Error('Customer is required');
      }
      
      if (formData.items.length === 0) {
        throw new Error('At least one item is required');
      }
      
      // Prepare the request body
      const invoiceData = {
        customerId: formData.customerId,
        invoiceItems: formData.items.map(item => ({
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          length: item.length,
          width: item.width,
          area: item.area
        })),
        taxRate: formData.taxRate / 100, // Convert from percentage to decimal
        issueDate: formData.issueDate,
        dueDate: formData.dueDate,
        status: formData.status,
        notes: formData.notes,
        subtotal, // Add subtotal
        taxAmount, // Add taxAmount
        totalAmount: total // Add total as totalAmount
      };
      
      console.log('Submitting invoice data:', invoiceData);
      
      // Send the request
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create invoice');
      }
      
      const result = await response.json();
      console.log('Invoice created successfully:', result);
      
      // Redirect to the invoice list page on success
      router.push('/admin/invoices');
    } catch (err) {
      console.error('Error creating invoice:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb navigation */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link href="/admin/dashboard" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-indigo-600">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
              </svg>
              Dashboard
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
              </svg>
              <Link href="/admin/invoices" className="ml-1 text-sm font-medium text-gray-700 hover:text-indigo-600 md:ml-2">Invoices</Link>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
              </svg>
              <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Create Invoice</span>
            </div>
          </li>
        </ol>
      </nav>
      
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Create New Invoice
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            href="/admin/invoices"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </Link>
        </div>
      </div>
      
      {/* Main form container */}
      <div className="bg-white shadow-md rounded-lg mt-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            {/* Left panel - Form fields */}
            <div className="col-span-12 lg:col-span-8 p-6">
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
                <div className="mb-4">
                  <label htmlFor="customer-search" className="block text-sm font-medium text-gray-700 mb-1">
                    Search Customer
                  </label>
                  <input
                    type="text"
                    id="customer-search"
                    placeholder="Search by name, email, or phone"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                  {filteredCustomers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No customers found
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {filteredCustomers.map((customer) => (
                        <li 
                          key={customer.id}
                          className={`p-4 cursor-pointer hover:bg-gray-50 ${
                            formData.customerId === customer.id ? 'bg-indigo-50' : ''
                          }`}
                          onClick={() => handleSelectCustomer(customer.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">{customer.name}</h4>
                              <p className="text-sm text-gray-500">{customer.email}</p>
                              {customer.phone && (
                                <p className="text-sm text-gray-500">{customer.phone}</p>
                              )}
                            </div>
                            {formData.customerId === customer.id && (
                              <svg className="h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              
              {/* Invoice Items section */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice Items</h3>
                
                {/* Product search and selection */}
                <div className="mb-4 border border-gray-200 rounded-md p-4 bg-gray-50">
                  <div className="flex flex-col space-y-4">
                    <div>
                      <label htmlFor="product-class" className="block text-sm font-medium text-gray-700 mb-1">
                        Product Class
                      </label>
                      <select
                        id="product-class"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={productClass || ''}
                        onChange={(e) => setProductClass(e.target.value || null)}
                      >
                        <option value="">All Products</option>
                        <option value="PACKAGING">Packaging</option>
                        <option value="PRINTING">Printing</option>
                        <option value="WIDE_FORMAT">Wide Format</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="product-search" className="block text-sm font-medium text-gray-700 mb-1">
                        Search Product
                      </label>
                      <input
                        type="text"
                        id="product-search"
                        placeholder="Search by name or SKU"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={productSearchQuery}
                        onChange={(e) => setProductSearchQuery(e.target.value)}
                      />
                    </div>
                    
                    {/* Display filtered products */}
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md bg-white">
                      {productLoading ? (
                        <div className="p-4 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                        </div>
                      ) : filteredProducts.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No products found
                        </div>
                      ) : (
                        <ul className="divide-y divide-gray-200">
                          {filteredProducts.map((product) => (
                            <li 
                              key={product.id}
                              className={`p-4 cursor-pointer hover:bg-gray-50 ${
                                currentItem.productId === product.id ? 'bg-indigo-50' : ''
                              }`}
                              onClick={() => handleSelectProduct(product)}
                            >
                              <div className="flex justify-between">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900">{product.name}</h4>
                                  <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                                  <p className="text-xs text-gray-500">
                                    Class: {product.productClass.replace('_', ' ')}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium text-gray-900">
                                    {formatCurrency(product.basePrice)} / {product.unit}
                                  </p>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Item details form */}
                {currentItem.productId && (
                  <div className="border border-gray-200 rounded-md p-4 mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      {editingItemIndex !== null ? 'Edit Item' : 'New Item'}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          id="description"
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          value={currentItem.description}
                          onChange={(e) => setCurrentItem({...currentItem, description: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="unit-price" className="block text-sm font-medium text-gray-700 mb-1">
                          Unit Price (£)
                        </label>
                        <input
                          type="number"
                          id="unit-price"
                          step="0.01"
                          min="0"
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          value={currentItem.unitPrice}
                          onChange={(e) => setCurrentItem({...currentItem, unitPrice: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          id="quantity"
                          min="1"
                          step="1"
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          value={currentItem.quantity}
                          onChange={(e) => setCurrentItem({...currentItem, quantity: parseInt(e.target.value) || 1})}
                        />
                      </div>
                      
                      {/* Show dimensions fields for WIDE_FORMAT products */}
                      {currentItem.product?.productClass === 'WIDE_FORMAT' && (
                        <>
                          <div>
                            <label htmlFor="length" className="block text-sm font-medium text-gray-700 mb-1">
                              Length (m)
                            </label>
                            <input
                              type="number"
                              id="length"
                              step="0.01"
                              min="0"
                              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              value={currentItem.length || ''}
                              onChange={(e) => setCurrentItem({...currentItem, length: parseFloat(e.target.value) || 0})}
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="width" className="block text-sm font-medium text-gray-700 mb-1">
                              Width (m)
                            </label>
                            <input
                              type="number"
                              id="width"
                              step="0.01"
                              min="0"
                              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              value={currentItem.width || ''}
                              onChange={(e) => setCurrentItem({...currentItem, width: parseFloat(e.target.value) || 0})}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Area (m²)
                            </label>
                            <input
                              type="text"
                              className="bg-gray-100 shadow-sm block w-full sm:text-sm border-gray-300 rounded-md"
                              value={currentItem.area?.toFixed(2) || '0.00'}
                              readOnly
                            />
                          </div>
                        </>
                      )}
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Total Price
                        </label>
                        <input
                          type="text"
                          className="bg-gray-100 shadow-sm block w-full sm:text-sm border-gray-300 rounded-md"
                          value={formatCurrency(currentItem.totalPrice)}
                          readOnly
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentItem({
                            productId: '',
                            description: '',
                            quantity: 1,
                            unitPrice: 0,
                            totalPrice: 0
                          });
                          setEditingItemIndex(null);
                        }}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={addItemToInvoice}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        {editingItemIndex !== null ? 'Update Item' : 'Add Item'}
                      </button>
                    </div>
                  </div>
                )}
                
                {/* List of invoice items */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Invoice Line Items</h4>
                  
                  {formData.items.length === 0 ? (
                    <div className="border border-dashed border-gray-300 rounded-md p-4 text-center text-gray-500">
                      No items added yet
                    </div>
                  ) : (
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Description</th>
                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Quantity</th>
                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Unit Price</th>
                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Total</th>
                            <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {formData.items.map((item, index) => (
                            <tr key={index}>
                              <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                                <div className="font-medium text-gray-900">{item.description}</div>
                                {item.area !== undefined && (
                                  <div className="text-xs text-gray-500">
                                    {item.length?.toFixed(2)}m × {item.width?.toFixed(2)}m = {item.area.toFixed(2)}m²
                                  </div>
                                )}
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-500">{item.quantity}</td>
                              <td className="px-3 py-4 text-sm text-gray-500">{formatCurrency(item.unitPrice)}</td>
                              <td className="px-3 py-4 text-sm text-gray-500 font-medium">{formatCurrency(item.totalPrice)}</td>
                              <td className="py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                <div className="flex justify-end space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => editItem(index)}
                                    className="text-indigo-600 hover:text-indigo-900"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeItem(index)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right panel - Invoice details and summary */}
            <div className="col-span-12 lg:col-span-4 bg-gray-50 p-6 border-l border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice Details</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    id="issueDate"
                    name="issueDate"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={formData.issueDate}
                    onChange={handleDateChange}
                  />
                </div>
                
                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={formData.dueDate}
                    onChange={handleDateChange}
                  />
                </div>
                
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={formData.status}
                    onChange={handleStatusChange}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                    <option value="OVERDUE">Overdue</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700 mb-1">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    id="taxRate"
                    min="0"
                    max="100"
                    step="0.1"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={formData.taxRate}
                    onChange={handleTaxRateChange}
                  />
                </div>
                
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={formData.notes}
                    onChange={handleNotesChange}
                  />
                </div>
                
                {/* Invoice summary calculations */}
                <div className="mt-8 pt-4 border-t border-gray-200">
                  <h4 className="text-base font-medium text-gray-900 mb-3">Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">Subtotal:</span>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">Tax ({formData.taxRate}%):</span>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(taxAmount)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-base font-medium text-gray-900">Total:</span>
                      <span className="text-base font-bold text-gray-900">{formatCurrency(total)}</span>
                    </div>
                  </div>
                  
                  {/* Submit and cancel buttons */}
                  <div className="mt-6 flex flex-col space-y-2">
                    {error && (
                      <div className="rounded-md bg-red-50 p-3 mb-4">
                        <div className="text-sm text-red-700">{error}</div>
                      </div>
                    )}
                    
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                        isSubmitting ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                    >
                      {isSubmitting ? 'Creating Invoice...' : 'Create Invoice'}
                    </button>
                    
                    <Link
                      href="/admin/invoices"
                      className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Cancel
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 