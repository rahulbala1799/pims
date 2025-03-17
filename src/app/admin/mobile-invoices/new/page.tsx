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

export default function NewMobileInvoicePage() {
  const router = useRouter();
  const [formStep, setFormStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productClass, setProductClass] = useState<string | null>(null);
  const [productLoading, setProductLoading] = useState(false);
  
  // Form state with updated date types
  const [formData, setFormData] = useState<InvoiceFormData>({
    customerId: '',
    items: [],
    taxRate: 20, // Default to 20%
    issueDate: new Date().toISOString().split('T')[0], // Store as YYYY-MM-DD string
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    status: 'PENDING',
    notes: ''
  });
  
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
    setFormStep(2);
  };

  // Navigation functions
  const goBack = () => {
    if (formStep > 1) {
      setFormStep(formStep - 1);
    } else {
      router.push('/admin/mobile-invoices');
    }
  };

  const goNext = () => {
    setFormStep(formStep + 1);
  };

  // Save form progress between steps
  useEffect(() => {
    // Could add local storage functionality here if needed
  }, [formData]);

  // Fetch products
  useEffect(() => {
    if (formStep === 2) {
      const fetchProducts = async () => {
        setProductLoading(true);
        try {
          const endpoint = productClass 
            ? `/api/products/class/${productClass}` 
            : '/api/products';
            
          const response = await fetch(endpoint);
          if (!response.ok) {
            throw new Error('Failed to fetch products');
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
    }
  }, [formStep, productClass]);
  
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

  // Format date for input field - update to work with string dates
  const formatDateForInput = (date: string) => {
    return date;
  };
  
  // Handle issueDate change - update for string dates
  const handleIssueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    
    // Set due date to 30 days after issue date by default
    const dueDate = new Date(newDate);
    dueDate.setDate(dueDate.getDate() + 30);
    const newDueDate = dueDate.toISOString().split('T')[0];
    
    setFormData(prev => ({
      ...prev,
      issueDate: newDate,
      dueDate: newDueDate
    }));
  };
  
  // Calculate subtotal, tax amount, and total
  const subtotal = formData.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const taxAmount = subtotal * (formData.taxRate / 100);
  const total = subtotal + taxAmount;

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
        items: formData.items.map(item => ({
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          length: item.length,
          width: item.width,
          area: item.area
        })),
        taxRate: formData.taxRate,
        issueDate: formData.issueDate,
        dueDate: formData.dueDate,
        status: formData.status,
        notes: formData.notes
      };
      
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
      
      // Redirect to the invoice list page on success
      router.push('/admin/mobile-invoices');
    } catch (err) {
      console.error('Error creating invoice:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setFormStep(4); // Stay on the review page to show the error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-24">
      {/* Mobile header with progress indicator */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-white border-b border-gray-200">
        <div className="px-4 py-2 flex items-center">
          <button onClick={goBack} className="text-indigo-600 mr-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path>
            </svg>
          </button>
          <h1 className="text-lg font-bold">New Invoice</h1>
          <div className="ml-auto flex">
            <span className="text-xs bg-gray-200 rounded-full px-2 py-1">
              Step {formStep} of 4
            </span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-gray-200 w-full">
          <div 
            className="h-full bg-indigo-600" 
            style={{ width: `${(formStep / 4) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="mt-16 px-4 py-6">
        {/* Step 1: Customer Selection */}
        {formStep === 1 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Select Customer</h2>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredCustomers.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No customers found</p>
                    <Link href="/admin/customers/new" className="text-indigo-600 mt-2 inline-block">
                      + Add new customer
                    </Link>
                  </div>
                ) : (
                  filteredCustomers.map(customer => (
                    <div 
                      key={customer.id}
                      onClick={() => handleSelectCustomer(customer.id)}
                      className={`p-3 rounded-lg border-2 ${
                        formData.customerId === customer.id 
                          ? 'border-indigo-500 bg-indigo-50' 
                          : 'border-gray-200'
                      } hover:bg-gray-50 cursor-pointer transition-colors`}
                    >
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.email}</div>
                      {customer.phone && (
                        <div className="text-sm text-gray-500">{customer.phone}</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            <div className="mt-4 text-center">
              <Link 
                href="/admin/customers/new" 
                className="text-indigo-600 inline-flex items-center text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add new customer
              </Link>
            </div>
          </div>
        )}

        {/* Step 2: Add Products */}
        {formStep === 2 && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Add Products</h2>
            
            {/* Product items list */}
            {formData.items.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Added Items:</h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex items-center p-2 bg-gray-50 rounded-md">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{item.description}</div>
                        <div className="text-xs text-gray-500">
                          {item.quantity} × £{item.unitPrice.toFixed(2)}
                          {item.area && ` (${item.area} m²)`}
                        </div>
                      </div>
                      <div className="font-medium">£{item.totalPrice.toFixed(2)}</div>
                      <div className="flex ml-2">
                        <button 
                          onClick={() => editItem(index)}
                          className="text-indigo-600 p-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => removeItem(index)}
                          className="text-red-600 p-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-right text-sm font-medium">
                  Subtotal: £{formData.items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}
                </div>
              </div>
            )}
            
            {/* Product filter tabs */}
            <div className="border-b border-gray-200 mb-4">
              <nav className="-mb-px flex space-x-4 overflow-x-auto">
                <button
                  onClick={() => setProductClass(null)}
                  className={`py-2 px-1 text-sm font-medium ${
                    productClass === null 
                      ? 'border-b-2 border-indigo-500 text-indigo-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  All Products
                </button>
                <button
                  onClick={() => setProductClass('PACKAGING')}
                  className={`py-2 px-1 text-sm font-medium ${
                    productClass === 'PACKAGING' 
                      ? 'border-b-2 border-indigo-500 text-indigo-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Packaging
                </button>
                <button
                  onClick={() => setProductClass('WIDE_FORMAT')}
                  className={`py-2 px-1 text-sm font-medium ${
                    productClass === 'WIDE_FORMAT' 
                      ? 'border-b-2 border-indigo-500 text-indigo-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Wide Format
                </button>
                <button
                  onClick={() => setProductClass('LEAFLETS')}
                  className={`py-2 px-1 text-sm font-medium ${
                    productClass === 'LEAFLETS' 
                      ? 'border-b-2 border-indigo-500 text-indigo-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Leaflets
                </button>
                <button
                  onClick={() => setProductClass('FINISHED')}
                  className={`py-2 px-1 text-sm font-medium ${
                    productClass === 'FINISHED' 
                      ? 'border-b-2 border-indigo-500 text-indigo-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Finished
                </button>
              </nav>
            </div>
            
            {/* Product search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search products..."
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            
            {/* Product list */}
            {productLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto mb-4">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No products found</p>
                  </div>
                ) : (
                  filteredProducts.map(product => (
                    <div 
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
                      className={`p-3 rounded-lg border ${
                        currentItem.productId === product.id 
                          ? 'border-indigo-500 bg-indigo-50' 
                          : 'border-gray-200'
                      } hover:bg-gray-50 cursor-pointer transition-colors`}
                    >
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5">
                          {product.productClass === 'PACKAGING' ? 'Packaging' : 
                           product.productClass === 'WIDE_FORMAT' ? 'Wide Format' :
                           product.productClass === 'LEAFLETS' ? 'Leaflets' : 'Finished'}
                        </span>
                        <span className="text-sm font-medium">£{product.basePrice.toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            
            {/* Selected product details */}
            {currentItem.productId && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Product Details</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Description</label>
                    <input
                      type="text"
                      value={currentItem.description}
                      onChange={(e) => setCurrentItem({...currentItem, description: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  {/* Wide format specific fields */}
                  {currentItem.product?.productClass === 'WIDE_FORMAT' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Length (m)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={currentItem.length || ''}
                          onChange={(e) => setCurrentItem({
                            ...currentItem, 
                            length: parseFloat(e.target.value) || undefined
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Width (m)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={currentItem.width || ''}
                          onChange={(e) => setCurrentItem({
                            ...currentItem, 
                            width: parseFloat(e.target.value) || undefined
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                      
                      {currentItem.length && currentItem.width && (
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-700">Area</label>
                          <div className="mt-1 text-sm">
                            {(currentItem.length * currentItem.width).toFixed(2)} m²
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={currentItem.quantity}
                        onChange={(e) => setCurrentItem({
                          ...currentItem, 
                          quantity: parseInt(e.target.value) || 1
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Unit Price</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={currentItem.unitPrice}
                        onChange={(e) => setCurrentItem({
                          ...currentItem, 
                          unitPrice: parseFloat(e.target.value) || 0
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Total Price</label>
                    <div className="mt-1 text-sm font-medium">
                      £{currentItem.totalPrice.toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <button
                      onClick={addItemToInvoice}
                      className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      {editingItemIndex !== null ? 'Update Item' : 'Add Item'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Step 3: Invoice Details - update for string dates */}
        {formStep === 3 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Invoice Details</h2>
            
            {/* Summary of items */}
            <div className="bg-gray-50 rounded-md p-3 mb-4">
              <h3 className="text-sm font-medium text-gray-800 mb-2">Order Summary</h3>
              <div className="space-y-1 mb-3 text-sm">
                <div className="flex justify-between">
                  <span>Items:</span>
                  <span>{formData.items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>£{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({formData.taxRate}%):</span>
                  <span>£{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>£{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Tax Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax Rate (%)
                </label>
                <select
                  value={formData.taxRate}
                  onChange={(e) => setFormData({
                    ...formData,
                    taxRate: parseFloat(e.target.value)
                  })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="0">0% (No Tax)</option>
                  <option value="5">5% (Reduced Rate)</option>
                  <option value="20">20% (Standard Rate)</option>
                </select>
              </div>
              
              {/* Dates - fix for string dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={handleIssueDateChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({
                      ...formData,
                      dueDate: e.target.value
                    })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
              
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({
                    ...formData,
                    status: e.target.value as 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
                  })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              
              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({
                    ...formData,
                    notes: e.target.value
                  })}
                  placeholder="Add any additional notes or payment instructions..."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Step 4: Review and Submit */}
        {formStep === 4 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Review Invoice</h2>
            
            {error && (
              <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p>{error}</p>
              </div>
            )}
            
            <div className="space-y-4">
              {/* Customer info */}
              <div className="bg-gray-50 rounded-md p-3">
                <h3 className="text-sm font-medium text-gray-800 mb-1">Customer</h3>
                {formData.customerId && (
                  <div className="text-sm">
                    {customers.find(c => c.id === formData.customerId)?.name}
                  </div>
                )}
              </div>
              
              {/* Items summary */}
              <div className="bg-gray-50 rounded-md p-3">
                <h3 className="text-sm font-medium text-gray-800 mb-2">Items</h3>
                <div className="space-y-2">
                  {formData.items.map((item, index) => (
                    <div key={index} className="text-sm">
                      <div className="font-medium">{item.description}</div>
                      <div className="text-gray-500">
                        {item.quantity} × £{item.unitPrice.toFixed(2)}
                        {item.area && ` (${item.area} m²)`}
                        <span className="float-right">£{item.totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Invoice details */}
              <div className="bg-gray-50 rounded-md p-3">
                <h3 className="text-sm font-medium text-gray-800 mb-2">Details</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>Issue Date:</div>
                  <div>{new Date(formData.issueDate).toLocaleDateString()}</div>
                  
                  <div>Due Date:</div>
                  <div>{new Date(formData.dueDate).toLocaleDateString()}</div>
                  
                  <div>Status:</div>
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      formData.status === 'PAID' ? 'bg-green-100 text-green-800' :
                      formData.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      formData.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {formData.status === 'PAID' ? 'Paid' :
                       formData.status === 'PENDING' ? 'Pending' :
                       formData.status === 'OVERDUE' ? 'Overdue' :
                       'Cancelled'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Financial summary */}
              <div className="bg-gray-50 rounded-md p-3">
                <h3 className="text-sm font-medium text-gray-800 mb-2">Summary</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>£{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({formData.taxRate}%):</span>
                    <span>£{taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>£{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {formData.notes && (
                <div className="bg-gray-50 rounded-md p-3">
                  <h3 className="text-sm font-medium text-gray-800 mb-1">Notes</h3>
                  <p className="text-sm whitespace-pre-line">{formData.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom action buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-between">
        {formStep > 1 ? (
          <button
            onClick={() => setFormStep(formStep - 1)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Back
          </button>
        ) : (
          <Link
            href="/admin/mobile-invoices"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </Link>
        )}
        
        <button
          onClick={() => {
            if (formStep < 4) {
              // Validation for each step
              if (formStep === 1 && !formData.customerId) {
                alert('Please select a customer');
                return;
              }
              
              if (formStep === 2 && formData.items.length === 0) {
                alert('Please add at least one product');
                return;
              }
              
              // Move to next step
              setFormStep(formStep + 1);
            } else {
              // Submit form in the last step
              handleSubmit();
            }
          }}
          disabled={isSubmitting}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
            isSubmitting 
              ? 'bg-indigo-400 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : formStep === 4 ? (
            'Create Invoice'
          ) : (
            'Next'
          )}
        </button>
      </div>
    </div>
  );
} 