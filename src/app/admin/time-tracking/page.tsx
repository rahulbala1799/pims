'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';

// Define our interfaces
interface Product {
  id: string;
  name: string;
  productClass: string;
}

interface JobProduct {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  completedQuantity: number;
  timeTaken: number; // Time in minutes
}

interface Job {
  id: string;
  title: string;
  status: string;
  jobProducts: JobProduct[];
}

interface ProductTimeMetric {
  productId: string;
  productName: string;
  productClass: string;
  totalTime: number; // Total time in minutes
  totalQuantity: number;
  averageTimePerUnit: number; // Average time per unit in minutes
  laborCost: number; // Labor cost in EUR (€12/hour)
  laborCostPerUnit: number; // Labor cost per unit
}

const LABOR_COST_PER_HOUR = 12; // €12 per hour

export default function TimeTrackingPage() {
  const [metrics, setMetrics] = useState<ProductTimeMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30'); // Default to last 30 days
  
  useEffect(() => {
    fetchTimeMetrics();
  }, [timeRange]);
  
  const fetchTimeMetrics = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch all completed jobs with their products
      const response = await fetch(`/api/jobs?status=COMPLETED&days=${timeRange}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch job data');
      }
      
      const jobs = await response.json();
      
      // Process the data to calculate time metrics
      const productTimeMap = new Map<string, ProductTimeMetric>();
      
      jobs.forEach((job: Job) => {
        job.jobProducts.forEach((jobProduct) => {
          // Skip if no time data or no completed quantity
          if (!jobProduct.timeTaken || !jobProduct.completedQuantity) {
            return;
          }
          
          const productId = jobProduct.product.id;
          
          if (!productTimeMap.has(productId)) {
            productTimeMap.set(productId, {
              productId,
              productName: jobProduct.product.name,
              productClass: jobProduct.product.productClass,
              totalTime: 0,
              totalQuantity: 0,
              averageTimePerUnit: 0,
              laborCost: 0,
              laborCostPerUnit: 0
            });
          }
          
          const metric = productTimeMap.get(productId)!;
          metric.totalTime += jobProduct.timeTaken;
          metric.totalQuantity += jobProduct.completedQuantity;
        });
      });
      
      // Calculate averages and labor costs
      const productMetrics = Array.from(productTimeMap.values()).map(metric => {
        const averageTimePerUnit = metric.totalQuantity > 0 
          ? metric.totalTime / metric.totalQuantity 
          : 0;
          
        const laborCost = (metric.totalTime / 60) * LABOR_COST_PER_HOUR;
        const laborCostPerUnit = metric.totalQuantity > 0 
          ? laborCost / metric.totalQuantity 
          : 0;
          
        return {
          ...metric,
          averageTimePerUnit,
          laborCost,
          laborCostPerUnit
        };
      });
      
      // Sort by total time (descending)
      productMetrics.sort((a, b) => b.totalTime - a.totalTime);
      
      setMetrics(productMetrics);
    } catch (err) {
      console.error('Error fetching time metrics:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format time in hours and minutes
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `${mins} min`;
    return `${hours}h ${mins}m`;
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(value);
  };
  
  // Calculate totals for summary
  const calculateSummary = () => {
    return metrics.reduce((acc, metric) => {
      return {
        totalTime: acc.totalTime + metric.totalTime,
        totalQuantity: acc.totalQuantity + metric.totalQuantity,
        totalLaborCost: acc.totalLaborCost + metric.laborCost
      };
    }, { totalTime: 0, totalQuantity: 0, totalLaborCost: 0 });
  };

  const summary = calculateSummary();
  
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Time Tracking Metrics</h1>
          <p className="mt-2 text-sm text-gray-700">
            View average time taken per product and labor costs calculated at €{LABOR_COST_PER_HOUR}/hour.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <div className="flex items-center space-x-2">
            <label htmlFor="timeRange" className="block text-sm font-medium text-gray-700">
              Time Range:
            </label>
            <select
              id="timeRange"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mt-6 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Summary Cards */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="truncate text-sm font-medium text-gray-500">Total Time Spent</dt>
                <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{formatTime(summary.totalTime)}</dd>
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="truncate text-sm font-medium text-gray-500">Total Products Completed</dt>
                <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{summary.totalQuantity}</dd>
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="truncate text-sm font-medium text-gray-500">Total Labor Cost</dt>
                <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                  {formatCurrency(summary.totalLaborCost)}
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              {isLoading ? (
                <div className="flex h-48 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-indigo-500"></div>
                </div>
              ) : metrics.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Product
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Class
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Quantity
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Total Time
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Avg Time/Unit
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Labor Cost
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Cost/Unit
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {metrics.map((metric) => (
                      <tr key={metric.productId}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {metric.productName}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {metric.productClass}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {metric.totalQuantity}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatTime(metric.totalTime)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatTime(metric.averageTimePerUnit)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatCurrency(metric.laborCost)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatCurrency(metric.laborCostPerUnit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-gray-500">No time tracking data available</p>
                  <p className="mt-2 text-sm text-gray-500">
                    Complete jobs and update time taken in job details to see metrics.
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