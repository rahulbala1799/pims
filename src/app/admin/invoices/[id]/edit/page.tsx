'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Customer {
  id: string;
  name: string;
  email: string;
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
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  length?: number;
  width?: number;
  area?: number;
  productId?: string;
  isEditing?: boolean;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer: Customer;
  issueDate: string;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  invoiceItems: InvoiceItem[];
  createdAt: string;
}

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [status, setStatus] = useState<string>('');
  const [taxRate, setTaxRate] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [subtotal, setSubtotal] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  
  // Product state for adding new products in the edit view
  const [products, setProducts] = useState<Product[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!params.id) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/invoices/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Invoice not found');
          }
          throw new Error('Failed to fetch invoice');
        }
        
        const data = await response.json();
        console.log('Invoice loaded:', data);
        
        // Ensure all numeric fields are actually numbers
        const processedInvoice = {
          ...data,
          subtotal: typeof data.subtotal === 'number' ? data.subtotal : Number(data.subtotal),
          taxRate: typeof data.taxRate === 'number' ? data.taxRate : Number(data.taxRate),
          taxAmount: typeof data.taxAmount === 'number' ? data.taxAmount : Number(data.taxAmount),
          totalAmount: typeof data.totalAmount === 'number' ? data.totalAmount : Number(data.totalAmount),
          invoiceItems: data.invoiceItems.map((item: any) => ({
            ...item,
            quantity: typeof item.quantity === 'number' ? item.quantity : Number(item.quantity),
            unitPrice: typeof item.unitPrice === 'number' ? item.unitPrice : Number(item.unitPrice),
            totalPrice: typeof item.totalPrice === 'number' ? item.totalPrice : Number(item.totalPrice),
            ...(item.length !== undefined ? { length: typeof item.length === 'number' ? item.length : Number(item.length) } : {}),
            ...(item.width !== undefined ? { width: typeof item.width === 'number' ? item.width : Number(item.width) } : {}),
            ...(item.area !== undefined ? { area: typeof item.area === 'number' ? item.area : Number(item.area) } : {}),
          }))
        };
        
        setInvoice(processedInvoice);
        setItems(processedInvoice.invoiceItems);
        setSubtotal(processedInvoice.subtotal);
        setTaxAmount(processedInvoice.taxAmount);
        setTotalAmount(processedInvoice.totalAmount);
        
        // Initialize form state with invoice data
        setStatus(processedInvoice.status);
        setTaxRate(processedInvoice.taxRate * 100); // Convert to percentage for display
        setNotes(processedInvoice.notes || '');
        
        // Format dates for input fields (YYYY-MM-DD)
        setIssueDate(formatDateForInput(processedInvoice.issueDate));
        setDueDate(formatDateForInput(processedInvoice.dueDate));
        
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError(err instanceof Error ? err.message : 'Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [params.id]);

  // Fetch products when needed
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductLoading(true);
        const response = await fetch('/api/products');
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setProductLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Format a date string to YYYY-MM-DD for input fields
  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };
  
  // Format a number for display
  const formatNumber = (value: any, decimals = 2) => {
    const num = typeof value === 'number' ? value : Number(value);
    return isNaN(num) ? '0.00' : num.toFixed(decimals);
  };

  // Update item field
  const updateItemField = (index: number, field: string, value: any) => {
    const newItems = [...items];
    
    // Handle numeric conversions
    if (field === 'quantity' || field === 'unitPrice' || field === 'length' || field === 'width') {
      const numValue = Number(value);
      // Type safe way to update fields
      if (field === 'quantity') {
        newItems[index].quantity = numValue;
      } else if (field === 'unitPrice') {
        newItems[index].unitPrice = numValue;
      } else if (field === 'length') {
        newItems[index].length = numValue;
      } else if (field === 'width') {
        newItems[index].width = numValue;
      }
      
      // Recalculate totalPrice
      if (field === 'quantity' || field === 'unitPrice') {
        newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice;
      }
      
      // Recalculate area if both length and width exist
      if ((field === 'length' || field === 'width') && newItems[index].length && newItems[index].width) {
        newItems[index].area = Number((newItems[index].length! * newItems[index].width!).toFixed(2));
        // For wide format products, update totalPrice based on area
        if (newItems[index].area) {
          newItems[index].totalPrice = newItems[index].area * newItems[index].unitPrice * newItems[index].quantity;
        }
      }
    } else {
      // For description field
      if (field === 'description') {
        newItems[index].description = value as string;
      } else if (field === 'productId') {
        newItems[index].productId = value as string;
        // If we changed product, we might need to get new details
        const selectedProduct = products.find(p => p.id === value);
        if (selectedProduct) {
          newItems[index].description = `${selectedProduct.name} - ${selectedProduct.sku}`;
          newItems[index].unitPrice = selectedProduct.basePrice;
          
          // If wide format, set dimensions
          if (selectedProduct.productClass === 'WIDE_FORMAT') {
            newItems[index].length = selectedProduct.defaultLength || 0;
            newItems[index].width = selectedProduct.defaultWidth || 0;
            if (newItems[index].length && newItems[index].width) {
              newItems[index].area = Number((newItems[index].length * newItems[index].width).toFixed(2));
              // Update totalPrice based on area
              newItems[index].totalPrice = newItems[index].area * newItems[index].unitPrice * newItems[index].quantity;
            }
          } else {
            // Regular product, calculate based on quantity
            newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice;
          }
        }
      }
    }
    
    setItems(newItems);
    recalculateTotals(newItems);
  };
  
  // Recalculate invoice totals
  const recalculateTotals = (invoiceItems: InvoiceItem[]) => {
    const calculatedSubtotal = invoiceItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const calculatedTaxAmount = calculatedSubtotal * (Number(taxRate) / 100);
    const calculatedTotalAmount = calculatedSubtotal + calculatedTaxAmount;
    
    setSubtotal(calculatedSubtotal);
    setTaxAmount(calculatedTaxAmount);
    setTotalAmount(calculatedTotalAmount);
  };
  
  // Effect to recalculate totals when tax rate changes
  useEffect(() => {
    if (items.length > 0) {
      recalculateTotals(items);
    }
  }, [taxRate, items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invoice) return;
    
    try {
      setSaving(true);
      
      const updatedInvoice = {
        status,
        taxRate: Number(taxRate) / 100, // Convert percentage back to decimal
        notes,
        issueDate,
        dueDate,
        subtotal, // Include the calculated subtotal
        taxAmount, // Include the calculated tax amount
        totalAmount, // Include the calculated total amount
        invoiceItems: items.map(item => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          length: item.length,
          width: item.width,
          area: item.area,
          productId: item.productId
        }))
      };
      
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedInvoice),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update invoice');
      }
      
      // Navigate back to invoice details page
      router.push(`/admin/invoices/${invoice.id}`);
      
    } catch (err) {
      console.error('Error updating invoice:', err);
      setError(err instanceof Error ? err.message : 'Failed to update invoice');
    } finally {
      setSaving(false);
    }
  };

  // Used for cancelling the form
  const handleCancel = () => {
    router.push(`/admin/invoices/${params.id}`);
  };

  // To handle item deletion
  const handleDeleteItem = (index: number) => {
    if (confirm('Are you sure you want to remove this item?')) {
      const newItems = [...items];
      newItems.splice(index, 1);
      setItems(newItems);
      recalculateTotals(newItems);
    }
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 my-6">
          <h3 className="text-lg font-medium text-red-800">Error</h3>
          <p className="mt-2 text-sm text-red-700">{error || 'Invoice not found'}</p>
          <div className="mt-4">
            <Link 
              href="/admin/invoices"
              className="text-sm font-medium text-red-600 hover:text-red-500"
            >
              ← Back to invoices
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Edit Invoice #{invoice.invoiceNumber}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Make changes to this invoice and save to update.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Invoice Information</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Basic details for this invoice.</p>
          </div>

          <div className="px-4 py-5 sm:p-6">
            {/* Form Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Customer Info - Static */}
              <div className="col-span-1 sm:col-span-2 lg:col-span-1">
                <h4 className="text-sm font-medium text-gray-900">Customer Information</h4>
                <div className="mt-2 text-sm text-gray-500">
                  <p className="font-medium text-gray-800">{invoice.customer.name}</p>
                  <p>{invoice.customer.email}</p>
                </div>
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {/* Tax Rate */}
              <div>
                <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  name="taxRate"
                  id="taxRate"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  min="0"
                  max="100"
                  step="0.1"
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              {/* Issue Date */}
              <div>
                <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700">
                  Issue Date
                </label>
                <input
                  type="date"
                  name="issueDate"
                  id="issueDate"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  required
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              {/* Due Date */}
              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                  Due Date
                </label>
                <input
                  type="date"
                  name="dueDate"
                  id="dueDate"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              {/* Notes */}
              <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="px-4 py-5 sm:px-6 border-t border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Invoice Items</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Edit quantities, prices, and dimensions as needed.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dimensions
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item, index) => (
                  <tr key={item.id} className={editingItemIndex === index ? 'bg-blue-50' : ''}>
                    <td className="px-6 py-4 whitespace-normal text-sm">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItemField(index, 'description', e.target.value)}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      {products.length > 0 && (
                        <div className="mt-1">
                          <select
                            value={item.productId || ''}
                            onChange={(e) => updateItemField(index, 'productId', e.target.value)}
                            className="block w-full text-xs border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="">Select a product</option>
                            {products.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name} - {product.sku}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItemField(index, 'quantity', e.target.value)}
                        min="1"
                        step="1"
                        className="block w-20 mx-auto border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {item.length !== undefined || item.width !== undefined ? (
                        <div className="flex flex-col space-y-2">
                          <div className="flex space-x-2 items-center justify-center">
                            <input
                              type="number"
                              value={item.length || 0}
                              onChange={(e) => updateItemField(index, 'length', e.target.value)}
                              min="0"
                              step="0.01"
                              className="block w-20 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center"
                            />
                            <span>m ×</span>
                            <input
                              type="number"
                              value={item.width || 0}
                              onChange={(e) => updateItemField(index, 'width', e.target.value)}
                              min="0"
                              step="0.01"
                              className="block w-20 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center"
                            />
                            <span>m</span>
                          </div>
                          {item.area !== undefined && (
                            <div className="text-xs text-gray-500 text-center">
                              = {formatNumber(item.area)}m²
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <div className="flex items-center justify-end">
                        <span className="mr-1">£</span>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateItemField(index, 'unitPrice', e.target.value)}
                          min="0"
                          step="0.01"
                          className="block w-24 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-right"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      £{formatNumber(item.totalPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Invoice Summary */}
          <div className="px-4 py-5 sm:px-6 border-t border-gray-200">
            <div className="flex flex-col items-end">
              <div className="w-64 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-500">Subtotal:</span>
                  <span className="font-medium text-gray-900">£{formatNumber(subtotal)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-500">Tax ({taxRate}%):</span>
                  <span className="font-medium text-gray-900">£{formatNumber(taxAmount)}</span>
                </div>
                <div className="flex justify-between py-2 font-bold">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">£{formatNumber(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="px-4 py-4 sm:px-6 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 