'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  customer: string;
  amount: number;
  issueDate: string | Date;
  dueDate: string | Date;
  daysOverdue: number;
}

interface AgeBucketData {
  ageBucket: string;
  count: number;
  total: number;
  invoices: InvoiceItem[];
}

interface OutstandingSummary {
  totalOutstanding: number;
  invoiceCount: number;
  averageAge: number;
  oldestInvoice: number;
}

interface ApiResponse {
  data: AgeBucketData[];
  summary: OutstandingSummary;
}

export default function OutstandingInvoicesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [invoiceData, setInvoiceData] = useState<AgeBucketData[]>([]);
  const [summary, setSummary] = useState<OutstandingSummary>({
    totalOutstanding: 0,
    invoiceCount: 0,
    averageAge: 0,
    oldestInvoice: 0
  });
  const [expandedBucket, setExpandedBucket] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchInvoiceData();
  }, []);

  const fetchInvoiceData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/metrics/outstanding-invoices');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch outstanding invoice data: ${response.statusText}`);
      }
      
      const result: ApiResponse = await response.json();
      setInvoiceData(result.data);
      setSummary(result.summary);
    } catch (err: any) {
      console.error('Error fetching outstanding invoice data:', err);
      setError(err.message || 'Failed to fetch outstanding invoice data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const toggleBucket = (bucket: string) => {
    if (expandedBucket === bucket) {
      setExpandedBucket(null);
    } else {
      setExpandedBucket(bucket);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-6 rounded-lg shadow-md max-w-lg">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Data</h2>
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchInvoiceData}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <Link href="/admin/reporting" className="text-indigo-600 hover:text-indigo-900 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Outstanding Invoices</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">Track unpaid invoices to manage cash flow and receivables.</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Total Outstanding</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">{formatCurrency(summary.totalOutstanding)}</p>
              <p className="text-sm text-gray-500 mt-1">From {summary.invoiceCount} unpaid invoices</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Average Age</h3>
              <p className="text-3xl font-bold text-indigo-600 mt-2">{summary.averageAge} days</p>
              <p className="text-sm text-gray-500 mt-1">Average days overdue</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Oldest Invoice</h3>
              <p className="text-3xl font-bold text-indigo-600 mt-2">{summary.oldestInvoice} days</p>
              <p className="text-sm text-gray-500 mt-1">Maximum days overdue</p>
            </div>
          </div>
          
          {/* Chart visualization placeholder */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Outstanding Invoices by Age</h2>
              
              <div className="h-80 bg-gray-50 rounded border border-gray-200 flex items-center justify-center">
                <div className="text-center p-6">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                  <p className="mt-4 text-sm text-gray-500">Outstanding Invoices Distribution</p>
                  <p className="text-xs text-gray-400 mt-2">
                    In a production environment, this would display an interactive chart
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Age Buckets */}
          <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Aging Analysis</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Age
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice Count
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % of Total
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Expand</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoiceData.map((bucket, index) => (
                    <>
                      <tr key={bucket.ageBucket} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {bucket.ageBucket}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {bucket.count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(bucket.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {(bucket.total / summary.totalOutstanding * 100).toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => toggleBucket(bucket.ageBucket)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            {expandedBucket === bucket.ageBucket ? 'Hide' : 'Details'}
                          </button>
                        </td>
                      </tr>
                      
                      {/* Expanded view with individual invoices */}
                      {expandedBucket === bucket.ageBucket && bucket.invoices.map(invoice => (
                        <tr key={invoice.id} className="bg-indigo-50">
                          <td className="px-6 py-3 text-sm text-gray-500 pl-10">
                            {invoice.invoiceNumber}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-500">
                            {invoice.customer}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-500">
                            {formatCurrency(invoice.amount)}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-500">
                            Due: {formatDate(invoice.dueDate)}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-500 text-right">
                            {invoice.daysOverdue} days overdue
                          </td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 