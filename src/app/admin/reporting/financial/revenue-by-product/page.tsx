'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ProductRevenueData {
  productClass: string;
  totalRevenue: number;
  percentage: number;
  jobCount: number;
  invoiceCount: number;
}

interface ProductRevenueSummary {
  totalRevenue: number;
  totalProductClasses: number;
  topProductClass: string;
  topProductClassRevenue: number;
  topProductClassPercentage: number;
}

interface ApiResponse {
  data: ProductRevenueData[];
  summary: ProductRevenueSummary;
}

export default function RevenueByProductPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'12months' | '24months' | 'ytd'>('12months');
  const [productData, setProductData] = useState<ProductRevenueData[]>([]);
  const [summary, setSummary] = useState<ProductRevenueSummary>({
    totalRevenue: 0,
    totalProductClasses: 0,
    topProductClass: '',
    topProductClassRevenue: 0,
    topProductClassPercentage: 0
  });
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchProductRevenueData();
  }, [timeRange]);

  const fetchProductRevenueData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/metrics/revenue-by-product?timeRange=${timeRange}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch product revenue data: ${response.statusText}`);
      }
      
      const result: ApiResponse = await response.json();
      setProductData(result.data);
      setSummary(result.summary);
    } catch (err: any) {
      console.error('Error fetching product revenue data:', err);
      setError(err.message || 'Failed to fetch product revenue data');
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

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
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
            onClick={fetchProductRevenueData}
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
            <h1 className="text-3xl font-bold text-gray-900">Revenue by Product Class</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">Analyze revenue distribution across product categories.</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Total Revenue</h3>
              <p className="text-3xl font-bold text-indigo-600 mt-2">{formatCurrency(summary.totalRevenue)}</p>
              <p className="text-sm text-gray-500 mt-1">Across {summary.totalProductClasses} product classes</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Top Product Class</h3>
              <p className="text-3xl font-bold text-indigo-600 mt-2">{summary.topProductClass}</p>
              <p className="text-sm text-gray-500 mt-1">
                {formatCurrency(summary.topProductClassRevenue)} ({formatPercent(summary.topProductClassPercentage)})
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Time Range</h3>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="mt-2 block w-full bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="12months">Last 12 Months</option>
                <option value="24months">Last 2 Years</option>
                <option value="ytd">Year to Date</option>
              </select>
            </div>
          </div>
          
          {/* Chart visualization placeholder */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Revenue Distribution by Product Class</h2>
              
              <div className="h-80 bg-gray-50 rounded border border-gray-200 flex items-center justify-center">
                <div className="text-center p-6">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                  <p className="mt-4 text-sm text-gray-500">Revenue Distribution Chart</p>
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
              <h3 className="text-lg font-medium text-gray-900">Revenue by Product Class</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Class
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Count
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice Count
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {productData.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.productClass}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(item.totalRevenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center">
                          <span className="mr-2">{formatPercent(item.percentage)}</span>
                          <div className="w-24 bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-indigo-600 h-2.5 rounded-full" 
                              style={{ width: `${item.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.jobCount}
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