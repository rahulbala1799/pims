'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Customer {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  productClass: string;
}

interface JobProduct {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes: string | null;
  // For tracking progress
  completedQuantity?: number;
  // For tracking costs
  inkCostPerUnit?: number; // For packaging products
  inkUsageInMl?: number; // For wide format printing
  // For time tracking
  timeTaken?: number; // Time taken in minutes
}

interface Invoice {
  id: string;
  invoiceNumber: string;
}

interface Job {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  customer: Customer;
  customerId: string;
  assignedTo: User | null;
  assignedToId: string | null;
  createdBy: User;
  createdById: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  invoice: Invoice | null;
  invoiceId: string | null;
  jobProducts: JobProduct[];
}

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobProducts, setJobProducts] = useState<JobProduct[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/jobs/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch job details');
        }
        const data = await response.json();
        setJob(data);
        setJobProducts(data.jobProducts || []);
          setIsLoading(false);
      } catch (err) {
        console.error('Error fetching job:', err);
        setError('Failed to load job details');
        setIsLoading(false);
      }
    };

    fetchJob();
  }, [params.id]);

  const handleUpdateProgress = (productIndex: number, completedQuantity: number) => {
    const newJobProducts = [...jobProducts];
    newJobProducts[productIndex] = {
      ...newJobProducts[productIndex],
      completedQuantity: Math.min(completedQuantity, newJobProducts[productIndex].quantity)
    };
    setJobProducts(newJobProducts);
  };

  const handleUpdateInkCost = (productIndex: number, inkCostPerUnit: number) => {
    const newJobProducts = [...jobProducts];
    newJobProducts[productIndex] = {
      ...newJobProducts[productIndex],
      inkCostPerUnit
    };
    setJobProducts(newJobProducts);
  };

  const handleUpdateInkUsage = (productIndex: number, inkUsageInMl: number) => {
    const newJobProducts = [...jobProducts];
    newJobProducts[productIndex] = {
      ...newJobProducts[productIndex],
      inkUsageInMl
    };
    setJobProducts(newJobProducts);
  };

  const handleUpdateTimeTaken = (productIndex: number, timeTaken: number) => {
    const newJobProducts = [...jobProducts];
    newJobProducts[productIndex] = {
      ...newJobProducts[productIndex],
      timeTaken
    };
    setJobProducts(newJobProducts);
  };

  const saveProgress = async () => {
    if (!job) return;

    setIsSaving(true);
    try {
      // Filter out products that have partial completion and need to be split
      const productsToSplit = jobProducts.filter(product => 
        product.completedQuantity !== undefined && 
        product.completedQuantity > 0 && 
        product.completedQuantity < product.quantity
      );
      
      // Create new job products for the remaining quantities
      const remainingJobProducts = productsToSplit.map(product => ({
        productId: product.productId,
        quantity: product.quantity - (product.completedQuantity || 0),
        unitPrice: product.unitPrice,
        totalPrice: ((product.quantity - (product.completedQuantity || 0)) * product.unitPrice).toFixed(2),
        product: product.product,
        notes: `Remaining from task: ${product.notes || product.product.name}`
      }));
      
      // Update the original product quantities to match the completed quantities
      const updatedJobProducts = jobProducts.map(product => {
        if (product.completedQuantity !== undefined && 
            product.completedQuantity > 0 && 
            product.completedQuantity < product.quantity) {
          return {
            ...product,
            quantity: product.completedQuantity,
            totalPrice: (product.completedQuantity * product.unitPrice).toFixed(2)
          };
        }
        return product;
      });
      
      // Send the progress data to our API endpoint
      const response = await fetch(`/api/jobs/${job.id}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          jobProducts: updatedJobProducts,
          remainingJobProducts: remainingJobProducts.length > 0 ? remainingJobProducts : undefined
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save progress');
      }
      
      // Get the updated data
      const data = await response.json();
      
      // Update local state with new data including split tasks
      setJob(data.job);
      setJobProducts(data.jobProducts);
      
      alert('Progress saved successfully!');
    } catch (err) {
      console.error('Error saving progress:', err);
      alert('Failed to save progress');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateProgressPercentage = (product: JobProduct) => {
    if (!product.completedQuantity) return 0;
    return Math.min(100, Math.round((product.completedQuantity / product.quantity) * 100));
  };

  const handleDeleteJob = async () => {
    if (!job) return;
    
    // Show confirmation dialog
    if (!confirm(`Are you sure you want to delete the job "${job.title}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete job');
      }
      
      // Navigate back to jobs list
      router.push('/admin/jobs');
    } catch (err) {
      console.error('Error deleting job:', err);
      alert('Failed to delete job. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error || 'Job not found'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative pb-16 md:pb-6">
      {/* Fixed save button for mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-10">
        <button
          onClick={saveProgress}
          disabled={isSaving}
          className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : 'Save Progress'}
        </button>
      </div>

      {/* Basic Job Info Header */}
      <div className="mb-6 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex flex-col sm:flex-row justify-between sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{job.title}</h1>
            <p className="mt-1 text-sm text-gray-500">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(job.status)}`}>
                {job.status}
              </span>
              {job.dueDate && <span className="ml-3">Due: {formatDate(job.dueDate)}</span>}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-2">
            <button
              onClick={saveProgress}
              disabled={isSaving}
              className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : 'Save Progress'}
            </button>
            <button
              onClick={handleDeleteJob}
              className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete Job
            </button>
          </div>
        </div>
        <div className="border-t border-gray-200 px-4 py-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Customer */}
            <div>
              <h3 className="text-sm font-medium text-gray-500">Customer</h3>
              <p className="mt-1 text-sm text-gray-900">{job.customer.name}</p>
            </div>
            
            {/* Invoice */}
            <div>
              <h3 className="text-sm font-medium text-gray-500">Invoice</h3>
              <p className="mt-1 text-sm text-gray-900">
                {job.invoice ? (
                  <Link href={`/admin/invoices/${job.invoice.id}`} className="text-indigo-600 hover:text-indigo-900">
                    #{job.invoice.invoiceNumber}
                </Link>
                ) : job.invoiceId ? (
                  job.invoiceId
                ) : (
                  'No invoice'
                )}
              </p>
            </div>
            
            {/* Assigned To */}
            <div>
              <h3 className="text-sm font-medium text-gray-500">Assigned To</h3>
              <p className="mt-1 text-sm text-gray-900">
                {job.assignedTo ? job.assignedTo.name : 'Unassigned'}
              </p>
            </div>
            </div>
        </div>
      </div>

      {/* Tasks - Each invoice line item is a task */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Tasks</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Track progress and ink costs for each task in this job.
          </p>
        </div>
        
        <div className="border-t border-gray-200">
          {jobProducts.length > 0 ? (
            <>
              {/* Desktop view - Table layout */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                      <th scope="col" className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Quantity</th>
                      <th scope="col" className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                      <th scope="col" className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                      <th scope="col" className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Time Taken (mins)</th>
                      <th scope="col" className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ink Costs</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {jobProducts.map((product, index) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          <div>{product.product.name}</div>
                          <div className="text-sm text-gray-500">SKU: {product.product.sku}</div>
                          <div className="text-xs text-gray-500">Type: {product.product.productClass}</div>
                          {product.notes && (
                            <div className="text-sm text-gray-500 mt-1">{product.notes}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {product.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          <input
                            type="number"
                            min="0"
                            max={product.quantity}
                            value={product.completedQuantity || 0}
                            onChange={(e) => handleUpdateProgress(index, parseInt(e.target.value, 10) || 0)}
                            className="max-w-[80px] shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                              <div
                                className="bg-indigo-600 h-2.5 rounded-full"
                                style={{ width: `${calculateProgressPercentage(product)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs whitespace-nowrap">
                              {calculateProgressPercentage(product)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <input
                              type="number"
                              min="0"
                              value={product.timeTaken || 0}
                              onChange={(e) => handleUpdateTimeTaken(index, parseInt(e.target.value, 10) || 0)}
                              className="max-w-[80px] shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {product.product.productClass === 'PACKAGING' && (
                            <div className="flex items-center justify-end space-x-2">
                              <label className="text-xs">Ink Cost/Unit ($):</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={product.inkCostPerUnit || 0}
                                onChange={(e) => handleUpdateInkCost(index, parseFloat(e.target.value) || 0)}
                                className="max-w-[80px] shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                          )}
                          
                          {product.product.productClass === 'WIDE_FORMAT' && (
                            <div className="flex items-center justify-end space-x-2">
                              <label className="text-xs">Ink Usage (ml):</label>
                              <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={product.inkUsageInMl || 0}
                                onChange={(e) => handleUpdateInkUsage(index, parseFloat(e.target.value) || 0)}
                                className="max-w-[80px] shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            
              {/* Mobile view - Card layout */}
              <div className="md:hidden divide-y divide-gray-200">
                {jobProducts.map((product, index) => (
                  <div key={product.id} className="p-4 border-b border-gray-200 bg-white hover:bg-gray-50">
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900">{product.product.name}</h4>
                      <p className="text-sm text-gray-500">SKU: {product.product.sku}</p>
                      <p className="text-xs text-gray-500">Type: {product.product.productClass}</p>
                      {product.notes && <p className="text-sm text-gray-500 mt-1">{product.notes}</p>}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Total Quantity</p>
                        <p className="font-medium">{product.quantity}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Completed</p>
                        <input
                          type="number"
                          min="0"
                          max={product.quantity}
                          value={product.completedQuantity || 0}
                          onChange={(e) => handleUpdateProgress(index, parseInt(e.target.value, 10) || 0)}
                          className="w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Progress</p>
                      <div className="flex items-center">
                        <div className="flex-grow bg-gray-200 rounded-full h-2.5 mr-2">
                          <div
                            className="bg-indigo-600 h-2.5 rounded-full"
                            style={{ width: `${calculateProgressPercentage(product)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium whitespace-nowrap">
                          {calculateProgressPercentage(product)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Time Taken (mins)</p>
                      <input
                        type="number"
                        min="0"
                        value={product.timeTaken || 0}
                        onChange={(e) => handleUpdateTimeTaken(index, parseInt(e.target.value, 10) || 0)}
                        className="w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    
                    {product.product.productClass === 'PACKAGING' && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-gray-500 mb-1">Ink Cost/Unit ($)</p>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={product.inkCostPerUnit || 0}
                          onChange={(e) => handleUpdateInkCost(index, parseFloat(e.target.value) || 0)}
                          className="w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    )}
                    
                    {product.product.productClass === 'WIDE_FORMAT' && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-gray-500 mb-1">Ink Usage (ml)</p>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={product.inkUsageInMl || 0}
                          onChange={(e) => handleUpdateInkUsage(index, parseFloat(e.target.value) || 0)}
                          className="w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-6 text-center text-gray-500">
              No tasks found for this job.
          </div>
          )}
        </div>
      </div>

      {/* Overall Progress */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Overall Progress</h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          {jobProducts.length > 0 ? (
            <>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                <div
                  className="bg-indigo-600 h-4 rounded-full"
                  style={{ 
                    width: `${
                      jobProducts.reduce((acc, product) => acc + calculateProgressPercentage(product), 0) / 
                      jobProducts.length
                    }%` 
                  }}
                ></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Job Progress</span>
                <span className="text-sm font-medium text-gray-900">
                  {Math.round(
                    jobProducts.reduce((acc, product) => acc + calculateProgressPercentage(product), 0) / 
                    jobProducts.length
                  )}% Complete
                </span>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500">
              No tasks to track progress.
          </div>
          )}
        </div>
      </div>
      
      {/* Additional Details (Collapsed) */}
      <details className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <summary className="px-4 py-5 sm:px-6 cursor-pointer">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Additional Details</h3>
        </summary>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Created By</dt>
              <dd className="mt-1 text-sm text-gray-900">{job.createdBy.name}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(job.createdAt)}</dd>
            </div>
            {job.description && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900">{job.description}</dd>
              </div>
            )}
          </dl>
        </div>
      </details>
    </div>
  );
} 