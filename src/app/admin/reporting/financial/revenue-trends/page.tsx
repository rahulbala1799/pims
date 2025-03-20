'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface RevenueData {
  month?: string;
  quarter?: string;
  [year: number]: number;
  change: number;
}

interface RevenueSummary {
  totalRevenue: number;
  averageRevenue: number;
  yearOverYearGrowth: number;
}

interface ApiResponse {
  data: RevenueData[];
  summary: RevenueSummary;
}

export default function RevenueTrendsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [viewType, setViewType] = useState<'monthly' | 'quarterly'>('monthly');
  const [monthlyData, setMonthlyData] = useState<RevenueData[]>([]);
  const [quarterlyData, setQuarterlyData] = useState<RevenueData[]>([]);
  const [timeRange, setTimeRange] = useState<'1year' | '2years' | 'ytd'>('1year');
  const [summary, setSummary] = useState<RevenueSummary>({
    totalRevenue: 0,
    averageRevenue: 0,
    yearOverYearGrowth: 0
  });
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchRevenueData();
  }, [viewType, timeRange]);

  const fetchRevenueData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch monthly data if viewing monthly or if no quarterly data exists yet
      if (viewType === 'monthly' || quarterlyData.length === 0) {
        const monthlyResponse = await fetch(`/api/metrics/revenue?groupBy=month&timeRange=${timeRange}`);
        
        if (!monthlyResponse.ok) {
          throw new Error(`Failed to fetch monthly data: ${monthlyResponse.statusText}`);
        }
        
        const monthlyResult: ApiResponse = await monthlyResponse.json();
        setMonthlyData(monthlyResult.data);
        
        if (viewType === 'monthly') {
          setSummary(monthlyResult.summary);
        }
      }
      
      // Fetch quarterly data if viewing quarterly or if no quarterly data exists yet
      if (viewType === 'quarterly' || monthlyData.length === 0) {
        const quarterlyResponse = await fetch(`/api/metrics/revenue?groupBy=quarter&timeRange=${timeRange}`);
        
        if (!quarterlyResponse.ok) {
          throw new Error(`Failed to fetch quarterly data: ${quarterlyResponse.statusText}`);
        }
        
        const quarterlyResult: ApiResponse = await quarterlyResponse.json();
        setQuarterlyData(quarterlyResult.data);
        
        if (viewType === 'quarterly') {
          setSummary(quarterlyResult.summary);
        }
      }
    } catch (err: any) {
      console.error('Error fetching revenue data:', err);
      setError(err.message || 'Failed to fetch revenue data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GBP',
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
            onClick={fetchRevenueData}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const prevYear = currentYear - 1;
  const currentData = viewType === 'monthly' ? monthlyData : quarterlyData;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <div className="flex items-center">
              <Link href="/admin/reporting" className="text-indigo-600 hover:text-indigo-900 mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Revenue Trends</h1>
            </div>
            <p className="mt-1 text-sm text-gray-500">Track revenue patterns over time to identify seasonal trends and growth</p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => setViewType('monthly')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                viewType === 'monthly'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setViewType('quarterly')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                viewType === 'quarterly'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Quarterly
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Total Revenue</h3>
              <p className="text-3xl font-bold text-indigo-600 mt-2">{formatCurrency(summary.totalRevenue)}</p>
              <p className="text-sm text-gray-500 mt-1">Current year to date</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Average {viewType === 'monthly' ? 'Monthly' : 'Quarterly'} Revenue</h3>
              <p className="text-3xl font-bold text-indigo-600 mt-2">{formatCurrency(summary.averageRevenue)}</p>
              <p className="text-sm text-gray-500 mt-1">Current year</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Year-over-Year Growth</h3>
              <p className={`text-3xl font-bold mt-2 ${summary.yearOverYearGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary.yearOverYearGrowth >= 0 ? '+' : ''}{summary.yearOverYearGrowth.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500 mt-1">Compared to previous year</p>
            </div>
          </div>
          
          {/* Chart Section */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {viewType === 'monthly' ? 'Monthly' : 'Quarterly'} Revenue Trend
              </h2>
              
              <div className="flex justify-end mb-4">
                <div className="relative inline-block text-left">
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as any)}
                    className="block w-full bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="1year">Last 12 Months</option>
                    <option value="2years">Last 2 Years</option>
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
                  <p className="mt-4 text-sm text-gray-500">
                    {viewType === 'monthly' ? 'Monthly' : 'Quarterly'} Revenue Chart
                  </p>
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
              <h3 className="text-lg font-medium text-gray-900">
                {viewType === 'monthly' ? 'Monthly' : 'Quarterly'} Revenue Data
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {viewType === 'monthly' ? 'Month' : 'Quarter'}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Year Revenue
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Previous Year Revenue
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Change %
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentData.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.month || item.quarter}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(item[currentYear])}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(item[prevYear])}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.change >= 0 ? '+' : ''}{item.change}%
                        </span>
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