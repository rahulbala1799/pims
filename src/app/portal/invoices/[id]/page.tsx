'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { FiArrowLeft, FiDownload, FiFileText, FiDollarSign, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

// Invoice type definition
interface InvoiceItem {
  id: string;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  notes: string | null;
  invoiceItems: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  
  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <FiCheckCircle className="mr-1 h-3 w-3" /> Paid
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <FiDollarSign className="mr-1 h-3 w-3" /> Outstanding
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <FiAlertCircle className="mr-1 h-3 w-3" /> Overdue
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };
  
  // Fetch invoice data
  useEffect(() => {
    const fetchInvoice = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('portalToken');
        if (!token) {
          throw new Error('Authentication required');
        }
        
        const response = await fetch(`/api/portal/invoices/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch invoice');
        }
        
        const data = await response.json();
        setInvoice(data);
      } catch (err: any) {
        console.error('Error fetching invoice:', err);
        setError(err.message || 'Failed to load invoice');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInvoice();
  }, [params.id]);

  // Handle PDF download
  const handleDownloadPDF = () => {
    // Implementation will be added when PDF generation is set up
    alert('PDF download functionality will be implemented soon');
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiAlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <div className="mt-4">
              <Link 
                href="/portal/invoices"
                className="text-sm font-medium text-red-700 hover:text-red-600"
              >
                <span aria-hidden="true">&larr;</span> Back to Invoices
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!invoice) {
    return (
      <div className="text-center py-12">
        <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Invoice not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The invoice you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <div className="mt-6">
          <Link
            href="/portal/invoices"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }
  
  // Extract order number from notes if available
  const orderNumber = invoice.notes 
    ? invoice.notes.split('\n')[0].includes('Order:') 
      ? invoice.notes.split('\n')[0].split('Order:')[1].trim()
      : null
    : null;
  
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link 
            href="/portal/invoices" 
            className="mr-4 text-gray-500 hover:text-gray-700"
          >
            <FiArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Invoice #{invoice.invoiceNumber}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {formatDate(invoice.issueDate)}
            </p>
          </div>
        </div>
        <div>
          <StatusBadge status={invoice.status} />
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Invoice Details</h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Invoice Number</dt>
              <dd className="mt-1 text-sm text-gray-900">{invoice.invoiceNumber}</dd>
            </div>
            
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <StatusBadge status={invoice.status} />
              </dd>
            </div>
            
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Issue Date</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(invoice.issueDate)}</dd>
            </div>
            
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Due Date</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(invoice.dueDate)}</dd>
            </div>
            
            {orderNumber && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Related Order</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <Link 
                    href={`/portal/orders/${orderNumber}`}
                    className="text-indigo-600 hover:text-indigo-500"
                  >
                    Order #{orderNumber}
                  </Link>
                </dd>
              </div>
            )}
            
            {invoice.notes && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Notes</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                  {invoice.notes}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Invoice Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoice.invoiceItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {formatCurrency(item.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <th scope="row" colSpan={3} className="px-6 py-3 text-sm font-normal text-gray-500 text-right">
                  Subtotal
                </th>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                  {formatCurrency(invoice.subtotal)}
                </td>
              </tr>
              <tr>
                <th scope="row" colSpan={3} className="px-6 py-3 text-sm font-normal text-gray-500 text-right">
                  VAT ({(invoice.taxRate * 100).toFixed(0)}%)
                </th>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                  {formatCurrency(invoice.taxAmount)}
                </td>
              </tr>
              <tr>
                <th scope="row" colSpan={3} className="px-6 py-3 text-sm font-medium text-gray-900 text-right">
                  Total
                </th>
                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-indigo-600 text-right">
                  {formatCurrency(invoice.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      
      <div className="flex justify-end mt-8">
        <button
          type="button"
          onClick={handleDownloadPDF}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <FiDownload className="mr-2 h-4 w-4" /> Download PDF
        </button>
      </div>
    </div>
  );
} 