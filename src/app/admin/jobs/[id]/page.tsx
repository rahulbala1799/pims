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

  const saveProgress = async () => {
    if (!job) return;

    setIsSaving(true);
    try {
      // Send the progress data to our API endpoint
      const response = await fetch(`/api/jobs/${job.id}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobProducts }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save progress');
      }
      
      // Get the updated data
      const data = await response.json();
      
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateProgressPercentage = (product: JobProduct) => {
    if (!product.completedQuantity) return 0;
    return Math.min(100, Math.round((product.completedQuantity / product.quantity) * 100));
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
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">{job.title}</h1>
        <div className="flex space-x-2">
          <button
            onClick={saveProgress}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Job Details</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Details about this print job.</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Customer</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{job.customer.name}</dd>
            </div>
            
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(job.status)}`}>
                  {job.status.replace('_', ' ')}
                </span>
              </dd>
            </div>
            
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Priority</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadgeColor(job.priority)}`}>
                  {job.priority}
                </span>
              </dd>
            </div>
            
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{job.assignedTo?.name || 'Unassigned'}</dd>
            </div>
            
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Due Date</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(job.dueDate)}</dd>
            </div>
            
            {job.invoice && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">From Invoice</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <Link 
                    href={`/admin/invoices/${job.invoice.id}`}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    #{job.invoice.invoiceNumber}
                  </Link>
                </dd>
              </div>
            )}
            
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDateTime(job.createdAt)}</dd>
            </div>
            
            {job.description && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{job.description}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
      
      {/* Job Products & Progress Tracking */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Job Items & Progress</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Track progress and costs for each item in this job.</p>
        </div>
        
        <div className="border-t border-gray-200">
          {jobProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th scope="col" className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th scope="col" className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                    <th scope="col" className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                    <th scope="col" className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Tracking</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jobProducts.map((product, index) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div>{product.product.name}</div>
                        <div className="text-sm text-gray-500">SKU: {product.product.sku}</div>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-indigo-600 h-2.5 rounded-full"
                            style={{ width: `${calculateProgressPercentage(product)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs mt-1 inline-block">
                          {calculateProgressPercentage(product)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {product.product.productClass === 'PACKAGING' && (
                          <div className="flex items-center justify-end space-x-2">
                            <label className="text-xs">Ink Cost/Unit:</label>
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
          ) : (
            <div className="text-center py-6 text-gray-500">No products found for this job.</div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{job.title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Job ID: {job.id}
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/admin/jobs/${job.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Edit
          </Link>
          <Link
            href="/admin/jobs"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Jobs
          </Link>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Job Details</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Details and information about the job.
            </p>
          </div>
          <div className="flex space-x-2">
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(job.status)}`}>
              {job.status.replace('_', ' ')}
            </span>
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadgeColor(job.priority)}`}>
              {job.priority} Priority
            </span>
          </div>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Customer</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <Link href={`/admin/customers/${job.customer.id}`} className="text-indigo-600 hover:text-indigo-900">
                  {job.customer.name}
                </Link>
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {job.assignedTo ? job.assignedTo.name : 'Unassigned'}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Created By</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {job.createdBy.name}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Due Date</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatDate(job.dueDate)}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatDateTime(job.createdAt)}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatDateTime(job.updatedAt)}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {job.description || 'No description provided.'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Job Products Section - Placeholder for future implementation */}
      <div className="mt-6 bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Job Products</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Products associated with this job.
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <div className="py-5 sm:px-6 text-center text-gray-500 italic">
            Products will be shown here when implemented.
          </div>
        </div>
      </div>

      {/* Progress Updates Section - Placeholder for future implementation */}
      <div className="mt-6 bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Progress Updates</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            History of progress updates for this job.
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <div className="py-5 sm:px-6 text-center text-gray-500 italic">
            Progress updates will be shown here when implemented.
          </div>
        </div>
      </div>
    </div>
  );
} 