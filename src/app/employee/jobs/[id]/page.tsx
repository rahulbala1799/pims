'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, isAfter, parseISO } from 'date-fns';
import { 
  BriefcaseIcon, 
  CheckCircleIcon, 
  ArrowPathIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

// Define interfaces
interface Customer {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
}

interface JobProduct {
  id: string;
  product: Product;
  quantity: number;
  completedQuantity: number;
  unitPrice: number;
  totalPrice: number;
  inkCostPerUnit?: number;
  inkUsageInMl?: number;
  timeTaken?: number;
}

interface ProgressUpdate {
  id: string;
  content: string;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
}

interface Job {
  id: string;
  title: string;
  description: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  customer: Customer;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  jobProducts: JobProduct[];
  progressUpdates: ProgressUpdate[];
  assignedTo: User | null;
  assignedToId: string | null;
  createdBy: User;
  invoice: Invoice | null;
}

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  
  // New progress update
  const [newProgressUpdate, setNewProgressUpdate] = useState('');
  const [isAddingUpdate, setIsAddingUpdate] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  
  // Update product quantity
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [completedQuantity, setCompletedQuantity] = useState<number>(0);
  const [timeTaken, setTimeTaken] = useState<number>(0);
  const [inkUsage, setInkUsage] = useState<number>(0);
  const [isUpdatingQuantity, setIsUpdatingQuantity] = useState(false);
  const [showQuantityForm, setShowQuantityForm] = useState(false);
  
  // Get user data from localStorage
  useEffect(() => {
    const storedUserData = localStorage.getItem('employeeUser');
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }
  }, []);
  
  // Fetch job on component mount
  useEffect(() => {
    if (!id || !userData?.id) return;
    
    const fetchJob = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/jobs/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch job details');
        }
        
        const data = await response.json();
        setJob(data);
      } catch (error) {
        console.error('Error fetching job:', error);
        setError('An error occurred while fetching the job details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchJob();
  }, [id, userData]);
  
  // Handle status change
  const handleStatusChange = async (status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') => {
    if (!job) return;
    
    try {
      const response = await fetch(`/api/jobs/${job.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update job status');
      }
      
      // Update the job in the local state
      setJob({ ...job, status });
    } catch (error) {
      console.error('Error updating job status:', error);
      setError('An error occurred while updating the job status.');
    }
  };
  
  // Add progress update
  const handleAddProgressUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!job || !newProgressUpdate.trim() || isAddingUpdate) return;
    
    setIsAddingUpdate(true);
    
    try {
      const response = await fetch(`/api/jobs/${job.id}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newProgressUpdate }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add progress update');
      }
      
      const newUpdate = await response.json();
      
      // Update the job in the local state
      setJob({
        ...job,
        progressUpdates: [newUpdate, ...job.progressUpdates]
      });
      
      // Reset form
      setNewProgressUpdate('');
      setShowUpdateForm(false);
    } catch (error) {
      console.error('Error adding progress update:', error);
      setError('An error occurred while adding the progress update.');
    } finally {
      setIsAddingUpdate(false);
    }
  };
  
  // Update product completion quantity
  const handleUpdateProductQuantity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!job || !selectedProduct || isUpdatingQuantity) return;
    
    setIsUpdatingQuantity(true);
    
    try {
      const response = await fetch(`/api/jobs/${job.id}/products/${selectedProduct}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          completedQuantity,
          timeTaken,
          inkUsageInMl: inkUsage > 0 ? inkUsage : undefined
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update product quantity');
      }
      
      const updatedProduct = await response.json();
      
      // Update the job in the local state
      setJob({
        ...job,
        jobProducts: job.jobProducts.map(product => 
          product.id === selectedProduct ? {
            ...product, 
            completedQuantity,
            timeTaken: timeTaken > 0 ? timeTaken : product.timeTaken,
            inkUsageInMl: inkUsage > 0 ? inkUsage : product.inkUsageInMl
          } : product
        )
      });
      
      // Reset form
      setSelectedProduct(null);
      setCompletedQuantity(0);
      setTimeTaken(0);
      setInkUsage(0);
      setShowQuantityForm(false);
    } catch (error) {
      console.error('Error updating product quantity:', error);
      setError('An error occurred while updating the product quantity.');
    } finally {
      setIsUpdatingQuantity(false);
    }
  };
  
  // Function to get class for job priority
  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };
  
  // Function to get class for job status
  const getStatusClass = (status: string) => {
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
  
  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date set';
    return format(parseISO(dateString), 'EEE, MMM d, yyyy');
  };
  
  // Format date and time for progress updates
  const formatDateTime = (dateString: string) => {
    return format(parseISO(dateString), 'MMM d, h:mm a');
  };
  
  // Calculate completion percentage
  const calculateCompletion = (job: Job) => {
    if (!job.jobProducts || job.jobProducts.length === 0) return 0;
    
    const totalQuantity = job.jobProducts.reduce((sum, product) => sum + product.quantity, 0);
    const completedQuantity = job.jobProducts.reduce((sum, product) => sum + product.completedQuantity, 0);
    
    if (totalQuantity === 0) return 0;
    return Math.round((completedQuantity / totalQuantity) * 100);
  };
  
  // Check if job is overdue
  const isJobOverdue = (job: Job) => {
    if (!job.dueDate) return false;
    if (job.status === 'COMPLETED') return false;
    
    const dueDate = parseISO(job.dueDate);
    const today = new Date();
    return isAfter(today, dueDate);
  };
  
  // Calculate total time spent on job
  const getTotalTime = (job: Job) => {
    if (!job.jobProducts || job.jobProducts.length === 0) return 0;
    
    return job.jobProducts.reduce((sum, product) => sum + (product.timeTaken || 0), 0);
  };
  
  // Format time in hours and minutes
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `${mins} min`;
    return `${hours}h ${mins}m`;
  };
  
  // Is job assigned to current user
  const isAssignedToMe = (job: Job) => {
    return job.assignedToId === userData?.id;
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">Job Details</h1>
          <Link 
            href="/employee/jobs" 
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 flex items-center"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Back
          </Link>
        </div>
        
        <div className="mb-4 sm:mb-6 rounded-lg bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error || 'Job not found'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 sm:px-6 lg:px-8">
      <div className="mb-4 sm:mb-6 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-900 truncate max-w-[200px] sm:max-w-md">
          {job.title}
        </h1>
        <Link 
          href="/employee/jobs" 
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 flex items-center"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-1" />
          Back
        </Link>
      </div>
      
      {error && (
        <div className="mb-4 sm:mb-6 rounded-lg bg-red-50 p-4">
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
      
      {/* Job Overview Card */}
      <div className="bg-white shadow overflow-hidden rounded-lg mb-4 sm:mb-6">
        <div className="px-4 py-4 sm:px-6 flex justify-between items-center border-b border-gray-200">
          <div className="flex items-center">
            <BriefcaseIcon className="h-6 w-6 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Overview</h2>
          </div>
          <div className="flex space-x-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityClass(job.priority)}`}>
              {job.priority}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(job.status)}`}>
              {job.status.replace('_', ' ')}
            </span>
          </div>
        </div>
        
        <div className="px-4 py-4 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <UserIcon className="h-5 w-5 mr-1 text-gray-400" />
                Customer
              </dt>
              <dd className="mt-1 text-base text-gray-900">{job.customer.name}</dd>
            </div>
            
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <CalendarIcon className="h-5 w-5 mr-1 text-gray-400" />
                Due Date
              </dt>
              <dd className={`mt-1 text-base ${isJobOverdue(job) ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                {formatDate(job.dueDate)}
              </dd>
            </div>
            
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <UserIcon className="h-5 w-5 mr-1 text-gray-400" />
                Assigned To
              </dt>
              <dd className="mt-1 text-base text-gray-900">
                {job.assignedTo ? (
                  <span className={isAssignedToMe(job) ? 'font-medium text-indigo-600' : ''}>
                    {job.assignedTo.name}
                  </span>
                ) : (
                  <span className="text-gray-500">Unassigned</span>
                )}
              </dd>
            </div>
            
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <ClockIcon className="h-5 w-5 mr-1 text-gray-400" />
                Time Spent
              </dt>
              <dd className="mt-1 text-base text-gray-900">
                {getTotalTime(job) > 0 ? formatTime(getTotalTime(job)) : 'None recorded'}
              </dd>
            </div>
            
            {job.invoice && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-1 text-gray-400" />
                  Invoice
                </dt>
                <dd className="mt-1 text-base text-gray-900">
                  Invoice #{job.invoice.invoiceNumber}
                </dd>
              </div>
            )}
            
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-1 text-gray-400" />
                Description
              </dt>
              <dd className="mt-1 text-base text-gray-900 whitespace-pre-wrap">
                {job.description || "No description provided"}
              </dd>
            </div>
            
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <ClipboardDocumentListIcon className="h-5 w-5 mr-1 text-gray-400" />
                Overall Progress
              </dt>
              <dd className="mt-1 text-base text-gray-900">
                <div className="flex items-center mb-1">
                  <div className="w-full bg-gray-200 rounded-full h-3 mr-2">
                    <div 
                      className="bg-indigo-600 h-3 rounded-full" 
                      style={{ width: `${calculateCompletion(job)}%` }}
                    ></div>
                  </div>
                  <span>{calculateCompletion(job)}%</span>
                </div>
              </dd>
            </div>
          </dl>
          
          <div className="mt-5 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            {job.status !== 'IN_PROGRESS' && job.status !== 'COMPLETED' && (
              <button
                onClick={() => handleStatusChange('IN_PROGRESS')}
                className="inline-flex justify-center items-center rounded-lg bg-blue-50 px-4 py-3 text-base font-medium text-blue-700"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Start Working
              </button>
            )}
            
            {job.status !== 'COMPLETED' && (
              <button
                onClick={() => handleStatusChange('COMPLETED')}
                className="inline-flex justify-center items-center rounded-lg bg-green-50 px-4 py-3 text-base font-medium text-green-700"
              >
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Mark Complete
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Products Card */}
      <div className="bg-white shadow overflow-hidden rounded-lg mb-4 sm:mb-6">
        <div className="px-4 py-4 sm:px-6 flex justify-between items-center border-b border-gray-200">
          <div className="flex items-center">
            <ClipboardDocumentListIcon className="h-6 w-6 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Products</h2>
          </div>
          <button
            onClick={() => setShowQuantityForm(!showQuantityForm)}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              showQuantityForm 
                ? "bg-gray-200 text-gray-800 hover:bg-gray-300" 
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {showQuantityForm ? 'Cancel' : 'Update Quantities'}
          </button>
        </div>
        
        {showQuantityForm ? (
          <div className="px-4 py-4 sm:px-6">
            <form onSubmit={handleUpdateProductQuantity} className="space-y-4">
              <div>
                <label htmlFor="product" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Product
                </label>
                <select
                  id="product"
                  value={selectedProduct || ''}
                  onChange={(e) => {
                    setSelectedProduct(e.target.value);
                    const product = job.jobProducts.find(p => p.id === e.target.value);
                    if (product) {
                      setCompletedQuantity(product.completedQuantity);
                      setTimeTaken(product.timeTaken || 0);
                      setInkUsage(product.inkUsageInMl || 0);
                    }
                  }}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 h-12 sm:h-10 text-base"
                  required
                >
                  <option value="">Select a product</option>
                  {job.jobProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.product.name} ({product.completedQuantity}/{product.quantity})
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedProduct && (
                <>
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                      Completed Quantity
                    </label>
                    <input
                      type="number"
                      id="quantity"
                      value={completedQuantity}
                      onChange={(e) => setCompletedQuantity(parseInt(e.target.value, 10))}
                      min="0"
                      max={job.jobProducts.find(p => p.id === selectedProduct)?.quantity || 0}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 h-12 sm:h-10 text-base"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="timeTaken" className="block text-sm font-medium text-gray-700 mb-1">
                      Time Taken (minutes)
                    </label>
                    <input
                      type="number"
                      id="timeTaken"
                      value={timeTaken}
                      onChange={(e) => setTimeTaken(parseInt(e.target.value, 10))}
                      min="0"
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 h-12 sm:h-10 text-base"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="inkUsage" className="block text-sm font-medium text-gray-700 mb-1">
                      Ink Usage (ml)
                    </label>
                    <input
                      type="number"
                      id="inkUsage"
                      value={inkUsage}
                      onChange={(e) => setInkUsage(parseInt(e.target.value, 10))}
                      min="0"
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 h-12 sm:h-10 text-base"
                    />
                  </div>
                </>
              )}
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingQuantity || !selectedProduct}
                  className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75"
                >
                  {isUpdatingQuantity ? 'Saving...' : 'Save Quantity'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="px-4 py-4 sm:px-6">
            <ul className="divide-y divide-gray-200">
              {job.jobProducts.map((product) => (
                <li key={product.id} className="py-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-base font-medium text-gray-900">
                      {product.product.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {product.completedQuantity} of {product.quantity} completed
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                    <div 
                      className="bg-indigo-600 h-2.5 rounded-full" 
                      style={{ width: `${(product.completedQuantity / product.quantity) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex flex-wrap justify-between text-xs text-gray-500 gap-y-1">
                    <span>Unit price: ${typeof product.unitPrice === 'number' ? product.unitPrice.toFixed(2) : 'N/A'}</span>
                    <span>Total: ${typeof product.totalPrice === 'number' ? product.totalPrice.toFixed(2) : 'N/A'}</span>
                    {product.inkCostPerUnit !== null && product.inkCostPerUnit !== undefined && 
                      <span>Ink cost per unit: ${typeof product.inkCostPerUnit === 'number' ? product.inkCostPerUnit.toFixed(2) : 'N/A'}</span>
                    }
                    {product.inkUsageInMl && <span>Ink usage: {product.inkUsageInMl}ml</span>}
                    {product.timeTaken && <span>Time spent: {formatTime(product.timeTaken)}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Progress Updates Card */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="px-4 py-4 sm:px-6 flex justify-between items-center border-b border-gray-200">
          <div className="flex items-center">
            <ClockIcon className="h-6 w-6 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Progress Updates</h2>
          </div>
          <button
            onClick={() => setShowUpdateForm(!showUpdateForm)}
            className={`rounded-lg px-3 py-2 text-sm font-medium flex items-center ${
              showUpdateForm 
                ? "bg-gray-200 text-gray-800 hover:bg-gray-300" 
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {showUpdateForm ? (
              'Cancel'
            ) : (
              <>
                <PlusIcon className="h-5 w-5 mr-1" />
                Add Update
              </>
            )}
          </button>
        </div>
        
        {showUpdateForm && (
          <div className="px-4 py-4 sm:px-6 border-b border-gray-200">
            <form onSubmit={handleAddProgressUpdate} className="space-y-4">
              <div>
                <label htmlFor="update" className="block text-sm font-medium text-gray-700 mb-1">
                  Progress Update
                </label>
                <textarea
                  id="update"
                  value={newProgressUpdate}
                  onChange={(e) => setNewProgressUpdate(e.target.value)}
                  rows={3}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base py-3 px-4"
                  placeholder="Describe the progress you've made..."
                  required
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isAddingUpdate || !newProgressUpdate.trim()}
                  className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75"
                >
                  {isAddingUpdate ? 'Adding...' : 'Add Update'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        <div className="px-4 py-4 sm:px-6">
          {job.progressUpdates.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">No progress updates yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {job.progressUpdates.map((update) => (
                <li key={update.id} className="py-4">
                  <div className="flex space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <ClockIcon className="h-6 w-6 text-indigo-600" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900">Progress Update</h3>
                        <p className="text-sm text-gray-500">{formatDateTime(update.createdAt)}</p>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{update.content}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
} 