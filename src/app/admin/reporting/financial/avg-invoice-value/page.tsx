'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface InvoiceValueData {
  month: string;
  averageValue: number;
  totalValue: number;
  invoiceCount: number;
}

interface InvoiceSummary {
  totalInvoices: number;
  totalValue: number;
  averageValue: number;
  medianValue: number;
  minValue: number;
  maxValue: number;
}

interface ApiResponse {
  data: InvoiceValueData[];
  summary: InvoiceSummary;
}

export default function AvgInvoiceValuePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'12months' | '24months' | 'ytd'>('12months');
  const [invoiceData, setInvoiceData] = useState<InvoiceValueData[]>([]);
  const [summary, setSummary] = useState<InvoiceSummary>({
    totalInvoices: 0,
    totalValue: 0,
    averageValue: 0,
    medianValue: 0,
    minValue: 0,
    maxValue: 0
  });
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchInvoiceData();
  }, [timeRange]);

  const fetchInvoiceData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/metrics/avg-invoice-value?timeRange=${timeRange}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch invoice value data: ${response.statusText}`);
      }
      
      const result: ApiResponse = await response.json();
      setInvoiceData(result.data);
      setSummary(result.summary);
    } catch (err: any) {
      console.error('Error fetching invoice value data:', err);
      setError(err.message || 'Failed to fetch invoice value data');
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
            <h1 className="text-3xl font-bold text-gray-900">Average Invoice Value</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">Monitor the average value of invoices to track sales performance.</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Average Invoice Value</h3>
              <p className="text-3xl font-bold text-indigo-600 mt-2">{formatCurrency(summary.averageValue)}</p>
              <p className="text-sm text-gray-500 mt-1">Based on {summary.totalInvoices} invoices</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Median Invoice Value</h3>
              <p className="text-3xl font-bold text-indigo-600 mt-2">{formatCurrency(summary.medianValue)}</p>
              <p className="text-sm text-gray-500 mt-1">Middle value in the data set</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Range</h3>
              <p className="text-3xl font-bold text-indigo-600 mt-2">
                {formatCurrency(summary.minValue)} - {formatCurrency(summary.maxValue)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Min - Max invoice value</p>
            </div>
          </div>
          
          {/* Chart Section */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Monthly Average Invoice Values</h2>
                
                <div className="relative inline-block text-left">
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as any)}
                    className="block w-full bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="12months">Last 12 Months</option>
                    <option value="24months">Last 2 Years</option>
                    <option value="ytd">Year to Date</option>
                  </select>
                </div>
              </div>
              
              {/* Chart visualization placeholder */}
              <div className="h-80 bg-gray-50 rounded border border-gray-200 flex items-center justify-center">
                <div className="text-center p-6">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="mt-4 text-sm text-gray-500">Average Invoice Value Trend Chart</p>
                  <p className="text-xs text-gray-400 mt-2">
                    In a production environment, this would display an interactive chart
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Data Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Monthly Invoice Data</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Month
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Average Invoice Value
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Value
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice Count
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoiceData.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.month}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(item.averageValue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(item.totalValue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.invoiceCount}
                      </td>
                    </tr>
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