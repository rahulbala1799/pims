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

export default function EditMobileInvoicePage() {
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
            isEditing: false,
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

  // Toggle item editing mode
  const toggleItemEdit = (index: number) => {
    const newItems = [...items];
    newItems[index].isEditing = !newItems[index].isEditing;
    setItems(newItems);
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
      }
    } else {
      // For description field
      if (field === 'description') {
        newItems[index].description = value as string;
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
      router.push(`/admin/mobile-invoices/${invoice.id}`);
      
    } catch (err) {
      console.error('Error updating invoice:', err);
      setError(err instanceof Error ? err.message : 'Failed to update invoice');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm max-w-lg mx-auto mt-8">
        <div className="mb-4 text-red-600 font-medium">{error}</div>
        <button 
          onClick={() => router.push('/admin/mobile-invoices')}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Back to Invoices
        </button>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm max-w-lg mx-auto mt-8">
        <div className="mb-4 font-medium">Invoice not found</div>
        <button 
          onClick={() => router.push('/admin/mobile-invoices')}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Back to Invoices
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-indigo-600 text-white shadow-md">
        <div className="px-4 py-3 flex items-center">
          <Link href={`/admin/mobile-invoices/${invoice.id}`} className="text-white mr-3">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path>
            </svg>
          </Link>
          <h1 className="text-lg font-bold">Edit Invoice #{invoice.invoiceNumber}</h1>
        </div>
      </div>

      <div className="mt-16 px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-3 text-gray-800">Customer</h2>
            <div className="rounded-md p-3 bg-gray-50">
              <div className="font-medium text-gray-900">{invoice.customer?.name || 'Unknown customer'}</div>
              <div className="text-sm text-gray-600 mt-1">{invoice.customer?.email || ''}</div>
            </div>
          </div>
          
          {/* Invoice Details */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-3 text-gray-800">Invoice Details</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                <input
                  type="date"
                  id="issueDate"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  id="dueDate"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
              <input
                type="number"
                id="taxRate"
                min="0"
                max="100"
                step="0.1"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Add any additional notes here..."
              />
            </div>
          </div>
          
          {/* Line Items (editable) */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-3 text-gray-800">Line Items</h2>
            
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                  {!item.isEditing ? (
                    // View mode
                    <div className="p-4">
                      <div className="flex justify-between mb-2">
                        <div className="font-medium text-gray-900">{item.description}</div>
                        <button 
                          type="button" 
                          onClick={() => toggleItemEdit(index)}
                          className="text-indigo-600 text-sm font-medium"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {item.quantity} × £{formatNumber(item.unitPrice)}
                        {item.area && ` (${formatNumber(item.area)} m²)`}
                      </div>
                      
                      {(item.length || item.width) && (
                        <div className="text-xs text-gray-500 mb-2">
                          Dimensions: {item.length ? `${formatNumber(item.length)}m` : '--'} × {item.width ? `${formatNumber(item.width)}m` : '--'}
                        </div>
                      )}
                      
                      <div className="flex justify-end">
                        <span className="font-medium text-gray-900">£{formatNumber(item.totalPrice)}</span>
                      </div>
                    </div>
                  ) : (
                    // Edit mode
                    <div className="p-4 bg-gray-50">
                      <div className="flex justify-between mb-3">
                        <div className="font-medium text-gray-900">Edit Item</div>
                        <button 
                          type="button" 
                          onClick={() => toggleItemEdit(index)}
                          className="text-indigo-600 text-sm font-medium"
                        >
                          Done
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItemField(index, 'description', e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={item.quantity}
                              onChange={(e) => updateItemField(index, 'quantity', e.target.value)}
                              className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (£)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateItemField(index, 'unitPrice', e.target.value)}
                              className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                        </div>
                        
                        {/* Dimensions for wide format products */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Length (m)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.length || ''}
                              onChange={(e) => updateItemField(index, 'length', e.target.value)}
                              className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Width (m)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.width || ''}
                              onChange={(e) => updateItemField(index, 'width', e.target.value)}
                              className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                        </div>
                        
                        {item.length && item.width && (
                          <div className="p-3 bg-indigo-50 rounded-lg">
                            <div className="text-sm font-medium text-indigo-800">
                              Area: {formatNumber(item.area || (item.length * item.width))} m²
                            </div>
                          </div>
                        )}
                        
                        <div className="p-3 bg-gray-100 rounded-lg">
                          <div className="flex justify-between text-sm font-medium">
                            <span>Total:</span>
                            <span>£{formatNumber(item.totalPrice)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-6 bg-indigo-50 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>£{formatNumber(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax ({formatNumber(taxRate, 0)}%):</span>
                  <span>£{formatNumber(taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-indigo-100">
                  <span>Total:</span>
                  <span>£{formatNumber(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Fixed bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-between shadow-lg">
        <Link 
          href={`/admin/mobile-invoices/${invoice.id}`}
          className="w-5/12 py-2.5 border border-gray-300 text-gray-700 bg-white font-medium rounded-lg text-center hover:bg-gray-50 transition-colors"
        >
          Cancel
        </Link>
        
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-6/12 py-2.5 bg-indigo-600 text-white font-medium rounded-lg text-center hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
} 