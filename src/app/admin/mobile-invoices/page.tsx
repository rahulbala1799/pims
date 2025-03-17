'use client';

import { useState, useEffect } from 'react';
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
  taxAmount: number;
  totalAmount: number;
  invoiceItems: InvoiceItem[];
  createdAt: string;
}

export default function MobileInvoicesPage() {
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
        console.log('Invoices loaded:', data.length);
        setInvoices(data);
      } catch (err) {
        console.error('Error fetching invoices:', err);
        setError(err instanceof Error ? err.message : 'Failed to load invoices');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  // Function to get status badge classes
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

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="px-4 py-6">
      {/* Simplified breadcrumb for mobile */}
      <div className="flex items-center mb-4">
        <Link href="/admin/dashboard" className="text-indigo-600">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path>
          </svg>
        </Link>
        <h1 className="text-lg font-bold ml-2">Mobile Invoices</h1>
      </div>
      
      <p className="text-sm text-gray-600 mb-6">
        Create and manage invoices on mobile devices.
      </p>
      
      <div className="mb-6">
        <Link
          href="/admin/mobile-invoices/new"
          className="w-full flex justify-center items-center py-3 px-4 rounded-md bg-indigo-600 text-white font-medium shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <svg
            className="mr-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Create Invoice
        </Link>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">
          <p>{error}</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices yet</h3>
          <p className="mt-1 text-sm text-gray-500">Create your first mobile invoice</p>
          <div className="mt-4">
            <Link
              href="/admin/mobile-invoices/new"
              className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              Create Now
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map(invoice => (
            <Link href={`/admin/mobile-invoices/${invoice.id}`} key={invoice.id}>
              <div className="block border rounded-lg overflow-hidden hover:bg-gray-50 transition">
                <div className="bg-gray-50 p-3 border-b">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">{invoice.invoiceNumber}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusClasses(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Customer:</span> {invoice.customer.name}
                  </div>
                  <div className="flex justify-between text-sm">
                    <div>
                      <div><span className="text-gray-500">Date:</span> {formatDate(invoice.issueDate)}</div>
                      <div><span className="text-gray-500">Due:</span> {formatDate(invoice.dueDate)}</div>
                    </div>
                    <div className="text-right">
                      <div><span className="text-gray-500">Items:</span> {invoice.invoiceItems.length}</div>
                      <div className="font-medium">£{invoice.totalAmount.toFixed(2)}</div>
                    </div>
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