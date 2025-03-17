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
    <div className="pb-24">
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-indigo-600 text-white shadow-md">
        <div className="px-4 py-3 flex items-center">
          <Link href="/admin" className="text-white mr-3">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path>
            </svg>
          </Link>
          <h1 className="text-lg font-bold">Mobile Invoices</h1>
          
          {/* New add button */}
          <Link 
            href="/admin/mobile-invoices/new" 
            className="ml-auto inline-flex items-center bg-white bg-opacity-20 rounded-full p-1.5 text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
          </Link>
        </div>
      </div>

      <div className="mt-16 px-4 py-4">
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
      
      {/* Fixed bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 flex justify-around shadow-lg">
        <Link href="/admin" className="flex flex-col items-center p-2 text-indigo-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
          </svg>
          <span className="text-xs mt-1">Dashboard</span>
        </Link>
        
        <Link href="/admin/customers" className="flex flex-col items-center p-2 text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
          </svg>
          <span className="text-xs mt-1">Customers</span>
        </Link>
        
        <Link href="/admin/mobile-invoices" className="flex flex-col items-center p-2 text-indigo-600 font-medium">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <span className="text-xs mt-1">Invoices</span>
        </Link>
        
        <Link href="/admin/invoices" className="flex flex-col items-center p-2 text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"></path>
          </svg>
          <span className="text-xs mt-1">Desktop</span>
        </Link>
      </div>
    </div>
  );
} 