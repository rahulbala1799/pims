'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface MarginData {
  jobType: string;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  jobCount: number;
}

interface MarginSummary {
  overallMargin: number;
  highestMarginType: string;
  highestMargin: number;
  lowestMarginType: string;
  lowestMargin: number;
  totalRevenue: number;
  totalProfit: number;
}

interface ApiResponse {
  data: MarginData[];
  summary: MarginSummary;
}

export default function ProfitMarginsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'12months' | '24months' | 'ytd'>('12months');
  const [marginData, setMarginData] = useState<MarginData[]>([]);
  const [summary, setSummary] = useState<MarginSummary>({
    overallMargin: 0,
    highestMarginType: '',
    highestMargin: 0,
    lowestMarginType: '',
    lowestMargin: 0,
    totalRevenue: 0,
    totalProfit: 0
  });
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchMarginData();
  }, [timeRange]);

  const fetchMarginData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/metrics/profit-margins?timeRange=${timeRange}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch profit margin data: ${response.statusText}`);
      }
      
      const result: ApiResponse = await response.json();
      setMarginData(result.data);
      setSummary(result.summary);
    } catch (err: any) {
      console.error('Error fetching profit margin data:', err);
      setError(err.message || 'Failed to fetch profit margin data');
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
    return `${(value * 100).toFixed(1)}%`;
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
            onClick={fetchMarginData}
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
            <h1 className="text-3xl font-bold text-gray-900">Profit Margins by Job Type</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">Analyze profitability across different types of jobs and services.</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Overall Margin</h3>
              <p className="text-3xl font-bold text-indigo-600 mt-2">{formatPercent(summary.overallMargin)}</p>
              <p className="text-sm text-gray-500 mt-1">Average profit margin across all job types</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Best Performing</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">{formatPercent(summary.highestMargin)}</p>
              <p className="text-sm text-gray-500 mt-1">{summary.highestMarginType}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Lowest Performing</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">{formatPercent(summary.lowestMargin)}</p>
              <p className="text-sm text-gray-500 mt-1">{summary.lowestMarginType}</p>
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
          
          {/* Summary Stats */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Financial Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalRevenue)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Profit</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalProfit)}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Chart visualization placeholder */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Profit Margin by Job Type</h2>
              
              <div className="h-80 bg-gray-50 rounded border border-gray-200 flex items-center justify-center">
                <div className="text-center p-6">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                  <p className="mt-4 text-sm text-gray-500">Profit Margin Chart</p>
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
              <h3 className="text-lg font-medium text-gray-900">Profit Margin by Job Type</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profit
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Margin
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Count
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {marginData.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.jobType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(item.revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(item.cost)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(item.profit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.margin >= summary.overallMargin ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {formatPercent(item.margin)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.jobCount}
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