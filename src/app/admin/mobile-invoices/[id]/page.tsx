'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { generateInvoicePDF } from '@/components/InvoicePDF';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
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

export default function MobileInvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError(err instanceof Error ? err.message : 'Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [params.id]);

  // Function to get status badge classes
  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  // Safely format a number
  const formatNumber = (value: any, decimals = 2) => {
    const num = typeof value === 'number' ? value : Number(value);
    return isNaN(num) ? '0.00' : num.toFixed(decimals);
  };

  const handleDeleteInvoice = async () => {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/invoices/${params.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete invoice: ${response.statusText}`);
      }
      
      router.push('/admin/mobile-invoices');
    } catch (err) {
      console.error('Error deleting invoice:', err);
      alert(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  // Handle PDF generation
  const handleDownloadPDF = () => {
    if (invoice) {
      const fileName = `invoice-${invoice.invoiceNumber}.pdf`;
      generateInvoicePDF(invoice, invoice.customer, fileName);
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
          <Link href="/admin/mobile-invoices" className="text-indigo-600 mr-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path>
            </svg>
          </Link>
          <h1 className="text-lg font-bold">Invoice {invoice.invoiceNumber}</h1>
          <div className="ml-auto">
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusClasses(invoice.status)}`}>
              {invoice.status}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-16 px-4 py-6">
        <div className="space-y-6">
          {/* Invoice header */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{invoice.invoiceNumber}</h2>
                <div className="text-sm text-gray-500">Created: {formatDate(invoice.createdAt)}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Issue Date</div>
                <div className="font-medium">{formatDate(invoice.issueDate)}</div>
              </div>
              <div>
                <div className="text-gray-500">Due Date</div>
                <div className="font-medium">{formatDate(invoice.dueDate)}</div>
              </div>
            </div>
          </div>

          {/* Customer info */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Customer</h2>
            <div className="bg-white border border-gray-200 rounded-md p-4">
              <div className="font-medium">{invoice.customer?.name || 'Unknown customer'}</div>
              <div className="text-sm text-gray-500">{invoice.customer?.email || ''}</div>
              {invoice.customer?.phone && (
                <div className="text-sm text-gray-500">{invoice.customer?.phone}</div>
              )}
            </div>
          </div>

          {/* Items */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Items</h2>
            <div className="space-y-3">
              {invoice.invoiceItems.map((item, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-md p-4">
                  <div className="font-medium mb-1">{item.description}</div>
                  <div className="text-sm text-gray-500 mb-2">
                    {item.quantity} × £{formatNumber(item.unitPrice)}
                    {item.area && ` (${formatNumber(item.area)} m²)`}
                  </div>
                  
                  {/* Show dimensions if available */}
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
          </div>

          {/* Summary */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Summary</h2>
            <div className="bg-white border border-gray-200 rounded-md p-4">
              <div className="space-y-2 mb-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>£{formatNumber(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({formatNumber(invoice.taxRate * 100, 0)}%):</span>
                  <span>£{formatNumber(invoice.taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total:</span>
                  <span>£{formatNumber(invoice.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Notes</h2>
              <div className="bg-white border border-gray-200 rounded-md p-4">
                <p className="text-sm whitespace-pre-line">{invoice.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-between space-x-2">
        <button
          type="button"
          onClick={handleDeleteInvoice}
          className="w-1/2 inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-gray-50"
        >
          Delete
        </button>
        <button
          type="button"
          onClick={handleDownloadPDF}
          className="w-1/2 inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
        >
          Download PDF
        </button>
      </div>
    </div>
  );
} 