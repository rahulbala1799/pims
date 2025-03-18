'use client';

import { useState, useEffect } from 'react';
import { Decimal } from 'decimal.js';

interface JobMetrics {
  id: string;
  jobId: string;
  job: {
    id: string;
    title: string;
    status: string;
    customer: {
      id: string;
      name: string;
    };
  };
  revenue: string; // Will be converted to Decimal
  materialCost: string;
  inkCost: string;
  laborCost: string;
  overheadCost: string;
  totalCost: string;
  grossProfit: string;
  profitMargin: string;
  totalQuantity: number;
  totalTime: number;
  lastUpdated: string;
}

interface SummaryMetrics {
  totalRevenue: Decimal;
  totalCost: Decimal;
  totalProfit: Decimal;
  totalMargin: Decimal;
  jobCount: number;
}

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<JobMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalRevenue: new Decimal(0),
    totalCost: new Decimal(0),
    totalProfit: new Decimal(0),
    averageMargin: new Decimal(0),
    jobCount: 0
  });

  // Fetch metrics data
  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      try {
        // Use the new API endpoint we'll create
        const response = await fetch('/api/metrics/jobs');
        
        if (!response.ok) {
          throw new Error('Failed to fetch metrics data');
        }
        
        const data = await response.json();
        setMetrics(data);
        
        // Calculate summary metrics
        if (data.length > 0) {
          const totals = data.reduce((acc: SummaryMetrics, metric: JobMetrics) => {
            const revenue = new Decimal(metric.revenue || 0);
            const cost = new Decimal(metric.totalCost || 0);
            const profit = new Decimal(metric.grossProfit || 0);
            const margin = new Decimal(metric.profitMargin || 0);
            
            return {
              totalRevenue: acc.totalRevenue.plus(revenue),
              totalCost: acc.totalCost.plus(cost),
              totalProfit: acc.totalProfit.plus(profit),
              totalMargin: acc.totalMargin.plus(margin),
              jobCount: acc.jobCount + 1
            };
          }, {
            totalRevenue: new Decimal(0),
            totalCost: new Decimal(0),
            totalProfit: new Decimal(0),
            totalMargin: new Decimal(0),
            jobCount: 0
          });
          
          setSummaryMetrics({
            totalRevenue: totals.totalRevenue,
            totalCost: totals.totalCost,
            totalProfit: totals.totalProfit,
            averageMargin: totals.jobCount > 0 
              ? totals.totalMargin.dividedBy(totals.jobCount) 
              : new Decimal(0),
            jobCount: totals.jobCount
          });
        }
      } catch (err) {
        console.error('Error fetching metrics:', err);
        setError('Failed to load metrics data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMetrics();
  }, []);

  // Generate some demo data if no metrics exist
  const generateDemoData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/metrics/generate', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate demo metrics');
      }
      
      // Reload the page to show new data
      window.location.reload();
    } catch (err) {
      console.error('Error generating demo data:', err);
      setError('Failed to generate demo data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format currency
  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(Number(value));
  };
  
  // Format percentage
  const formatPercentage = (value: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(Number(value) / 100);
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
      <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Job Profitability Metrics</h1>
        {metrics.length === 0 && (
          <button
            onClick={generateDemoData}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Generate Demo Data
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="text-lg font-semibold text-gray-900">{formatCurrency(summaryMetrics.totalRevenue.toString())}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4M20 12a8 8 0 11-16 0 8 8 0 0116 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Costs</dt>
                  <dd className="text-lg font-semibold text-gray-900">{formatCurrency(summaryMetrics.totalCost.toString())}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Gross Profit</dt>
                  <dd className="text-lg font-semibold text-gray-900">{formatCurrency(summaryMetrics.totalProfit.toString())}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Average Margin</dt>
                  <dd className="text-lg font-semibold text-gray-900">{formatPercentage(summaryMetrics.averageMargin.toString())}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Table */}
      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              {metrics.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Costs
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Profit
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Margin
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {metrics.map((metric) => (
                      <tr key={metric.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-indigo-600">{metric.job.title}</div>
                          <div className="text-sm text-gray-500">{metric.job.status}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{metric.job.customer.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {formatCurrency(metric.revenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {formatCurrency(metric.totalCost)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className={`text-sm font-medium ${Number(metric.grossProfit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(metric.grossProfit)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className={`text-sm font-medium ${Number(metric.profitMargin) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(metric.profitMargin)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No metrics available</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Generate demo data to see example metrics.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 