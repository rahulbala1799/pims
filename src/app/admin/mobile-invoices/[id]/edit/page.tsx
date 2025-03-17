'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Customer {
  id: string;
  name: string;
  email: string;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invoice) return;
    
    try {
      setSaving(true);
      
      const updatedInvoice = {
        status,
        taxRate: taxRate / 100, // Convert percentage back to decimal
        notes,
        issueDate,
        dueDate
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-12 text-center">
        <div className="mb-4 text-red-500">{error}</div>
        <button 
          onClick={() => router.push('/admin/mobile-invoices')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Back to Invoices
        </button>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="px-4 py-12 text-center">
        <div className="mb-4">Invoice not found</div>
        <button 
          onClick={() => router.push('/admin/mobile-invoices')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Back to Invoices
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-white border-b border-gray-200">
        <div className="px-4 py-2 flex items-center">
          <Link href={`/admin/mobile-invoices/${invoice.id}`} className="text-indigo-600 mr-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path>
            </svg>
          </Link>
          <h1 className="text-lg font-bold">Edit Invoice {invoice.invoiceNumber}</h1>
        </div>
      </div>

      <div className="mt-16 px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invoice Details */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Invoice Details</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700">Issue Date</label>
                <input
                  type="date"
                  id="issueDate"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
                <input
                  type="date"
                  id="dueDate"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700">Tax Rate (%)</label>
                <input
                  type="number"
                  id="taxRate"
                  min="0"
                  max="100"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  id="notes"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Add any additional notes here..."
                />
              </div>
            </div>
          </div>
          
          {/* Customer and Line Items (read-only) */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Customer</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4">
              <div className="font-medium">{invoice.customer?.name || 'Unknown customer'}</div>
              <div className="text-sm text-gray-500">{invoice.customer?.email || ''}</div>
            </div>
            
            <h2 className="text-lg font-semibold mb-2">Line Items</h2>
            <div className="space-y-3 mb-4">
              {invoice.invoiceItems.map((item, index) => (
                <div key={index} className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <div className="font-medium mb-1">{item.description}</div>
                  <div className="text-sm text-gray-500 mb-2">
                    {item.quantity} × £{formatNumber(item.unitPrice)}
                    {item.area && ` (${formatNumber(item.area)} m²)`}
                  </div>
                  
                  {(item.length || item.width) && (
                    <div className="text-xs text-gray-500 mb-2">
                      Dimensions: {item.length ? `${formatNumber(item.length)}m` : '--'} × {item.width ? `${formatNumber(item.width)}m` : '--'}
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    <span className="font-medium">£{formatNumber(item.totalPrice)}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>£{formatNumber(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Tax ({formatNumber(invoice.taxRate * 100, 0)}%):</span>
                  <span>£{formatNumber(invoice.taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Current Total:</span>
                  <span>£{formatNumber(invoice.totalAmount)}</span>
                </div>
              </div>
              <div className="mt-4 text-xs text-gray-500">
                Note: Subtotal, tax amount, and total will be recalculated when you save changes to the tax rate.
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Fixed bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-between">
        <Link 
          href={`/admin/mobile-invoices/${invoice.id}`}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </Link>
        
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
} 