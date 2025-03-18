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
  grossProfit: string;
  profitMargin: string;
  totalQuantity: number;
  totalTime: number;
  lastUpdated: string;
}

interface SummaryMetrics {
  totalRevenue: Decimal;
  totalMaterialCost: Decimal;
  totalInkCost: Decimal;
  totalProfit: Decimal;
  totalMargin: Decimal;
  jobCount: number;
}

interface BreakdownModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  data: {
    label: string;
    value: string;
    color?: string;
    percentage?: number;
  }[];
  totalLabel?: string;
  totalValue?: string;
}

// Breakdown Modal Component
const BreakdownModal = ({ title, isOpen, onClose, data, totalLabel, totalValue }: BreakdownModalProps) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-4 py-5 sm:p-6 overflow-y-auto max-h-[60vh]">
          <ul className="divide-y divide-gray-200">
            {data.map((item, index) => (
              <li key={index} className="py-3 flex justify-between items-center">
                <div className="flex items-center">
                  {item.color && (
                    <div className={`w-3 h-3 rounded-full mr-2 bg-${item.color}-500`}></div>
                  )}
                  <span className="text-sm text-gray-900">{item.label}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900 mr-2">{item.value}</span>
                  {item.percentage !== undefined && (
                    <span className="text-xs text-gray-500">({item.percentage}%)</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
          
          {totalLabel && totalValue && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
              <span className="font-medium text-gray-900">{totalLabel}</span>
              <span className="font-bold text-gray-900">{totalValue}</span>
            </div>
          )}
        </div>
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
          <button
            onClick={onClose}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<JobMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalRevenue: new Decimal(0),
    totalMaterialCost: new Decimal(0),
    totalInkCost: new Decimal(0),
    totalProfit: new Decimal(0),
    averageMargin: new Decimal(0),
    jobCount: 0
  });
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{
    title: string;
    data: { label: string; value: string; color?: string; percentage?: number }[];
    totalLabel?: string;
    totalValue?: string;
  }>({
    title: '',
    data: [],
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
            const materialCost = new Decimal(metric.materialCost || 0);
            const inkCost = new Decimal(metric.inkCost || 0);
            const profit = new Decimal(metric.grossProfit || 0);
            const margin = new Decimal(metric.profitMargin || 0);
            
            return {
              totalRevenue: acc.totalRevenue.plus(revenue),
              totalMaterialCost: acc.totalMaterialCost.plus(materialCost),
              totalInkCost: acc.totalInkCost.plus(inkCost),
              totalProfit: acc.totalProfit.plus(profit),
              totalMargin: acc.totalMargin.plus(margin),
              jobCount: acc.jobCount + 1
            };
          }, {
            totalRevenue: new Decimal(0),
            totalMaterialCost: new Decimal(0),
            totalInkCost: new Decimal(0),
            totalProfit: new Decimal(0),
            totalMargin: new Decimal(0),
            jobCount: 0
          });
          
          setSummaryMetrics({
            totalRevenue: totals.totalRevenue,
            totalMaterialCost: totals.totalMaterialCost,
            totalInkCost: totals.totalInkCost,
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
    
    // Initial fetch
    fetchMetrics();
    
    // Set up periodic refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      fetchMetrics();
    }, 30000); // 30 seconds
    
    // Clean up interval when component unmounts
    return () => clearInterval(refreshInterval);
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
  
  // Show revenue breakdown
  const showRevenueBreakdown = () => {
    // Group revenue by job
    const revenueByJob = metrics.map(metric => ({
      label: metric.job.title,
      value: formatCurrency(metric.revenue),
      percentage: Number(new Decimal(metric.revenue).dividedBy(summaryMetrics.totalRevenue).times(100).toFixed(1))
    })).sort((a, b) => b.percentage - a.percentage);
    
    setModalData({
      title: 'Revenue Breakdown',
      data: revenueByJob,
      totalLabel: 'Total Revenue',
      totalValue: formatCurrency(summaryMetrics.totalRevenue.toString())
    });
    setModalOpen(true);
  };
  
  // Show cost breakdown
  const showCostBreakdown = () => {
    // Only material and ink costs
    const totalCosts = summaryMetrics.totalMaterialCost.plus(summaryMetrics.totalInkCost);
    
    const costBreakdown = [
      {
        label: 'Material Costs',
        value: formatCurrency(summaryMetrics.totalMaterialCost.toString()),
        color: 'blue',
        percentage: Number(summaryMetrics.totalMaterialCost.dividedBy(totalCosts).times(100).toFixed(1))
      },
      {
        label: 'Ink Costs',
        value: formatCurrency(summaryMetrics.totalInkCost.toString()),
        color: 'purple',
        percentage: Number(summaryMetrics.totalInkCost.dividedBy(totalCosts).times(100).toFixed(1))
      }
    ].sort((a, b) => b.percentage - a.percentage);
    
    setModalData({
      title: 'Cost Breakdown',
      data: costBreakdown,
      totalLabel: 'Total Material & Ink Costs',
      totalValue: formatCurrency(totalCosts.toString())
    });
    setModalOpen(true);
  };
  
  // Show profit breakdown
  const showProfitBreakdown = () => {
    // Profit by job
    const profitByJob = metrics.map(metric => ({
      label: metric.job.title,
      value: formatCurrency(metric.grossProfit),
      percentage: Number(new Decimal(metric.grossProfit).dividedBy(summaryMetrics.totalProfit).times(100).toFixed(1))
    })).sort((a, b) => b.percentage - a.percentage);
    
    setModalData({
      title: 'Profit Breakdown',
      data: profitByJob,
      totalLabel: 'Total Profit',
      totalValue: formatCurrency(summaryMetrics.totalProfit.toString())
    });
    setModalOpen(true);
  };
  
  // Show margin breakdown
  const showMarginBreakdown = () => {
    // Margin by job
    const marginByJob = metrics.map(metric => ({
      label: metric.job.title,
      value: formatPercentage(metric.profitMargin),
      percentage: Number(metric.profitMargin)
    })).sort((a, b) => b.percentage - a.percentage);
    
    setModalData({
      title: 'Margin Breakdown',
      data: marginByJob,
      totalLabel: 'Average Margin',
      totalValue: formatPercentage(summaryMetrics.averageMargin.toString())
    });
    setModalOpen(true);
  };

  // Function to recalculate metrics
  const recalculateMetrics = async () => {
    setIsLoading(true);
    try {
      // Use the dedicated recalculate endpoint to clear all metrics and recalculate from scratch
      const recalculateResponse = await fetch('/api/metrics/recalculate', {
        method: 'POST'
      });
      
      if (!recalculateResponse.ok) {
        throw new Error('Failed to recalculate metrics');
      }
      
      // After recalculation, fetch the fresh metrics
      const response = await fetch('/api/metrics/jobs');
      
      if (!response.ok) {
        throw new Error('Failed to fetch updated metrics');
      }
      
      const data = await response.json();
      setMetrics(data);
      
      // Calculate summary metrics
      if (data.length > 0) {
        const totals = data.reduce((acc: SummaryMetrics, metric: JobMetrics) => {
          const revenue = new Decimal(metric.revenue || 0);
          const materialCost = new Decimal(metric.materialCost || 0);
          const inkCost = new Decimal(metric.inkCost || 0);
          const profit = new Decimal(metric.grossProfit || 0);
          const margin = new Decimal(metric.profitMargin || 0);
          
          return {
            totalRevenue: acc.totalRevenue.plus(revenue),
            totalMaterialCost: acc.totalMaterialCost.plus(materialCost),
            totalInkCost: acc.totalInkCost.plus(inkCost),
            totalProfit: acc.totalProfit.plus(profit),
            totalMargin: acc.totalMargin.plus(margin),
            jobCount: acc.jobCount + 1
          };
        }, {
          totalRevenue: new Decimal(0),
          totalMaterialCost: new Decimal(0),
          totalInkCost: new Decimal(0),
          totalProfit: new Decimal(0),
          totalMargin: new Decimal(0),
          jobCount: 0
        });
        
        setSummaryMetrics({
          totalRevenue: totals.totalRevenue,
          totalMaterialCost: totals.totalMaterialCost,
          totalInkCost: totals.totalInkCost,
          totalProfit: totals.totalProfit,
          averageMargin: totals.jobCount > 0 
            ? totals.totalMargin.dividedBy(totals.jobCount) 
            : new Decimal(0),
          jobCount: totals.jobCount
        });
      }
      setIsLoading(false);
    } catch (err) {
      console.error('Error recalculating metrics:', err);
      setError('Failed to recalculate metrics');
      setIsLoading(false);
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
        <div className="flex space-x-4">
          {metrics.length === 0 && (
            <button
              onClick={generateDemoData}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Generate Demo Data
            </button>
          )}
          <button
            onClick={recalculateMetrics}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Recalculate Metrics
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div 
          className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200"
          onClick={showRevenueBreakdown}
        >
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
            <div className="mt-2 text-xs text-gray-500 text-right">Click for breakdown</div>
          </div>
        </div>

        <div 
          className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200"
          onClick={showCostBreakdown}
        >
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4M20 12a8 8 0 11-16 0 8 8 0 0116 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Material & Ink Costs</dt>
                  <dd className="text-lg font-semibold text-gray-900">{formatCurrency(summaryMetrics.totalMaterialCost.plus(summaryMetrics.totalInkCost).toString())}</dd>
                </dl>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500 text-right">Click for breakdown</div>
          </div>
        </div>

        <div 
          className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200"
          onClick={showProfitBreakdown}
        >
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
            <div className="mt-2 text-xs text-gray-500 text-right">Click for breakdown</div>
          </div>
        </div>

        <div 
          className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200"
          onClick={showMarginBreakdown}
        >
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
            <div className="mt-2 text-xs text-gray-500 text-right">Click for breakdown</div>
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
                        Material Cost
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ink Cost
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
                      <tr key={metric.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => {
                        // Show detailed breakdown for this job - with only material and ink costs
                        setModalData({
                          title: `Metrics for ${metric.job.title}`,
                          data: [
                            { label: 'Revenue', value: formatCurrency(metric.revenue) },
                            { label: 'Material Cost', value: formatCurrency(metric.materialCost), color: 'blue' },
                            { label: 'Ink Cost', value: formatCurrency(metric.inkCost), color: 'purple' },
                          ],
                          totalLabel: 'Gross Profit',
                          totalValue: `${formatCurrency(metric.grossProfit)} (${formatPercentage(metric.profitMargin)})`
                        });
                        setModalOpen(true);
                      }}>
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
                          {formatCurrency(metric.materialCost)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {formatCurrency(metric.inkCost)}
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
      
      {/* Breakdown Modal */}
      <BreakdownModal 
        title={modalData.title}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        data={modalData.data}
        totalLabel={modalData.totalLabel}
        totalValue={modalData.totalValue}
      />
    </div>
  );
} 