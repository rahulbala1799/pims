'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { generateInvoicePDF } from '@/components/InvoicePDF';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  length?: number;
  width?: number;
  area?: number;
  product: {
    name: string;
    sku: string;
    productClass: string;
  };
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
  };
  invoiceItems: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  totalAmount: number;
  issueDate: string;
  dueDate: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [existingJobId, setExistingJobId] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/invoices/${params.id}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch invoice: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Process the data to ensure proper structure
        const processedInvoice = {
          ...data,
          // Ensure subtotal is properly handled
          subtotal: data.subtotal,
          // Make sure we handle both items and invoiceItems
          invoiceItems: data.invoiceItems || data.items || [],
        };
        
        setInvoice(processedInvoice);
        
        // Check if a job exists for this invoice
        const jobResponse = await fetch(`/api/jobs?invoiceId=${data.id}`);
        if (jobResponse.ok) {
          const jobData = await jobResponse.json();
          if (jobData && jobData.length > 0) {
            setExistingJobId(jobData[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    if (params.id) {
      fetchInvoice();
    }
  }, [params.id]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
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
      
      router.push('/admin/invoices');
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

  // Handle generating a job from this invoice
  const handleGenerateJob = async () => {
    if (!invoice) return;
    
    try {
      setIsCreatingJob(true);
      
      // We'll let the server find a valid user ID
      const response = await fetch('/api/jobs/createFromInvoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId: invoice.id,
          title: `Job for Invoice #${invoice.invoiceNumber}`,
          description: `Job created from Invoice #${invoice.invoiceNumber} for ${invoice.customer.name}`
          // Not sending createdById - the API will find a valid user
        }),
      });
      
      // Get the response as text first to help with debugging
      const responseText = await response.text();
      
      // Try to parse the response as JSON
      let jsonResponse;
      try {
        jsonResponse = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error(`Server returned invalid JSON: ${responseText}`);
      }
      
      // Check for conflict (job already exists)
      if (response.status === 409 && jsonResponse.jobId) {
        alert('A job already exists for this invoice. Redirecting to the existing job.');
        router.push(`/admin/jobs/${jsonResponse.jobId}`);
        return;
      }
      
      if (!response.ok) {
        let errorMessage = 'Failed to create job';
        errorMessage = jsonResponse.error || errorMessage;
        throw new Error(errorMessage);
      }
      
      // Redirect to the new job page
      router.push(`/admin/jobs/${jsonResponse.id}`);
    } catch (err) {
      console.error('Error creating job:', err);
      alert(err instanceof Error ? err.message : 'Failed to create job from invoice');
    } finally {
      setIsCreatingJob(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
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
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with actions */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Invoice #{invoice.invoiceNumber}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Issued on {formatDate(invoice.issueDate)}
          </p>
        </div>
        <div className="mt-4 flex flex-shrink-0 md:mt-0 md:ml-4 space-x-2">
          {existingJobId ? (
            <Link
              href={`/admin/jobs/${existingJobId}`}
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              View Existing Job
            </Link>
          ) : (
            <button
              onClick={handleGenerateJob}
              disabled={isCreatingJob}
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isCreatingJob ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Job...
                </>
              ) : 'Generate Job'}
            </button>
          )}
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <svg 
              className="h-4 w-4 mr-1.5" 
              fill="none" 
              stroke="currentColor"
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download PDF
          </button>
          <Link
            href={`/admin/invoices/${params.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={handleDeleteInvoice}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="grid grid-cols-1 lg:grid-cols-3">
          {/* Left panel - Invoice details */}
          <div className="col-span-2 px-6 py-5 border-b border-gray-200 lg:border-r">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer info */}
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">Customer</h3>
                <div className="mt-2 text-sm text-gray-500">
                  <p className="text-base font-medium text-gray-900">{invoice.customer.name}</p>
                  <p>{invoice.customer.email}</p>
                  {invoice.customer.phone && <p>{invoice.customer.phone}</p>}
                  {invoice.customer.address && <p>{invoice.customer.address}</p>}
                </div>
              </div>

              {/* Invoice details */}
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">Invoice Details</h3>
                <div className="mt-2 text-sm text-gray-500">
                  <div className="grid grid-cols-2 gap-2">
                    <p className="text-gray-500">Status:</p>
                    <p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </p>
                    
                    <p className="text-gray-500">Issue Date:</p>
                    <p className="text-gray-900">{formatDate(invoice.issueDate)}</p>
                    
                    <p className="text-gray-500">Due Date:</p>
                    <p className="text-gray-900">{formatDate(invoice.dueDate)}</p>
                    
                    <p className="text-gray-500">Tax Rate:</p>
                    <p className="text-gray-900">{(invoice.taxRate * 100).toFixed(0)}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice items */}
            <div className="mt-8">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Invoice Items</h3>
              <div className="mt-4 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Qty
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invoice.invoiceItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-normal text-sm font-medium text-gray-900">
                            <div className="text-gray-900">{item.description}</div>
                            <div className="text-xs text-gray-500">
                              SKU: {item.product?.sku || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                            {item.length && item.width ? (
                              <span>
                                {item.length.toFixed(2)}m × {item.width.toFixed(2)}m
                                <br />
                                = {item.area?.toFixed(2)}m²
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                            {formatCurrency(item.totalPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {/* Notes */}
            {invoice.notes && (
              <div className="mt-8 border-t border-gray-200 pt-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Notes</h3>
                <div className="mt-2 text-sm text-gray-500">
                  <p>{invoice.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right panel - Summary */}
          <div className="col-span-1 px-6 py-5 bg-gray-50">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Summary</h3>
            <div className="mt-4 space-y-4">
              <div className="flex justify-between">
                <p className="text-sm text-gray-500">Subtotal</p>
                <p className="text-sm font-medium text-gray-900">{formatCurrency(invoice.subtotal)}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-sm text-gray-500">Tax ({(invoice.taxRate * 100).toFixed(0)}%)</p>
                <p className="text-sm font-medium text-gray-900">{formatCurrency(invoice.taxAmount)}</p>
              </div>
              <div className="border-t border-gray-200 pt-4 flex justify-between">
                <p className="text-base font-medium text-gray-900">Total</p>
                <p className="text-base font-bold text-gray-900">{formatCurrency(invoice.totalAmount)}</p>
              </div>
              
              <div className="mt-8 border-t border-gray-200 pt-4">
                <div className="flex flex-col space-y-4">
                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <svg 
                      className="h-4 w-4 mr-1.5" 
                      fill="none" 
                      stroke="currentColor"
                      viewBox="0 0 24 24" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2" 
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Download Invoice PDF
                  </button>
                  
                  <Link
                    href={`/admin/invoices/${params.id}/edit`}
                    className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg 
                      className="h-4 w-4 mr-1.5" 
                      fill="none" 
                      stroke="currentColor"
                      viewBox="0 0 24 24" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2" 
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit Invoice
                  </Link>
                  
                  <button
                    type="button"
                    onClick={handleDeleteInvoice}
                    className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <svg 
                      className="h-4 w-4 mr-1.5" 
                      fill="none" 
                      stroke="currentColor"
                      viewBox="0 0 24 24" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2" 
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete Invoice
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 