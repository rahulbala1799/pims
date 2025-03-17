'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Customer {
  id: string;
  name: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
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
  invoiceItems: InvoiceItem[];
  createdAt: string;
}

export default function MobileInvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/invoices');
        
        if (!response.ok) {
          throw new Error('Failed to fetch invoices');
        }
        
        const data = await response.json();
        console.log('Invoices loaded:', data);
        
        // Process invoices to ensure all numeric values are numbers
        const processedInvoices = data.map((invoice: any) => ({
          ...invoice,
          subtotal: typeof invoice.subtotal === 'number' ? invoice.subtotal : Number(invoice.subtotal),
          taxRate: typeof invoice.taxRate === 'number' ? invoice.taxRate : Number(invoice.taxRate),
          taxAmount: typeof invoice.taxAmount === 'number' ? invoice.taxAmount : Number(invoice.taxAmount),
          totalAmount: typeof invoice.totalAmount === 'number' ? invoice.totalAmount : Number(invoice.totalAmount),
          invoiceItems: invoice.invoiceItems ? invoice.invoiceItems.map((item: any) => ({
            ...item,
            quantity: typeof item.quantity === 'number' ? item.quantity : Number(item.quantity),
            unitPrice: typeof item.unitPrice === 'number' ? item.unitPrice : Number(item.unitPrice),
            totalPrice: typeof item.totalPrice === 'number' ? item.totalPrice : Number(item.totalPrice)
          })) : []
        }));
        
        setInvoices(processedInvoices);
      } catch (err) {
        console.error('Error fetching invoices:', err);
        setError(err instanceof Error ? err.message : 'Failed to load invoices');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  // Safely format a number
  const formatNumber = (value: any, decimals = 2) => {
    const num = typeof value === 'number' ? value : Number(value);
    return isNaN(num) ? '0.00' : num.toFixed(decimals);
  };

  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="px-4 py-8">
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Mobile Invoices</h1>
          <p className="mt-2 text-sm text-gray-700">
            Create and manage invoices on the go.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/admin/mobile-invoices/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            Create Invoice
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => router.refresh()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-lg font-medium text-gray-900">No invoices yet</h2>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new invoice.</p>
          <button
            onClick={() => router.push('/admin/mobile-invoices/new')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
            New Invoice
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <Link 
              key={invoice.id} 
              href={`/admin/mobile-invoices/${invoice.id}`}
              className="block"
            >
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">{invoice.invoiceNumber}</h2>
                    <p className="text-sm text-gray-500">{invoice.customer?.name || 'Unknown customer'}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusClasses(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </div>
                <div className="flex justify-between mt-2">
                  <div className="text-sm text-gray-500">
                    {formatDate(invoice.issueDate)} - {formatDate(invoice.dueDate)}
                  </div>
                  <div className="text-lg font-bold">
                    £{formatNumber(invoice.totalAmount)}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 