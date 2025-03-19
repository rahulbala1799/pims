'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, isAfter } from 'date-fns';
import { 
  BriefcaseIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  ArrowPathIcon,
  UserIcon,
  CalendarIcon,
  TagIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

// Hard-coded user ID for demo purposes
// In a real app, this would come from authentication
const EMPLOYEE_ID = "employee123";

// Define job interfaces
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
}

interface ProgressUpdate {
  id: string;
  content: string;
  createdAt: string;
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
}

export default function EmployeeJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'inProgress' | 'pending'>('all');
  
  // Get user data from localStorage
  useEffect(() => {
    const storedUserData = localStorage.getItem('employeeUser');
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }
  }, []);
  
  // Fetch jobs on component mount
  useEffect(() => {
    if (!userData || !userData.id) return;
    
    const fetchJobs = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/employee/jobs?userId=${userData.id}&status=active`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch jobs');
        }
        
        const data = await response.json();
        setJobs(data);
      } catch (error) {
        console.error('Error fetching jobs:', error);
        setError('An error occurred while fetching jobs. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchJobs();
  }, [userData]);
  
  // Get filtered jobs based on current filter
  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true;
    if (filter === 'inProgress') return job.status === 'IN_PROGRESS';
    if (filter === 'pending') return job.status === 'PENDING';
    return true;
  });
  
  // Handle status change
  const handleStatusChange = async (jobId: string, status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/status`, {
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
      setJobs(jobs.map(job => 
        job.id === jobId ? { ...job, status } : job
      ));
    } catch (error) {
      console.error('Error updating job status:', error);
      setError('An error occurred while updating the job status.');
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
    const date = new Date(dateString);
    return format(date, 'EEE, MMM d');
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
    
    const dueDate = new Date(job.dueDate);
    const today = new Date();
    return isAfter(today, dueDate);
  };

  if (isLoading && !userData) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 sm:px-6 lg:px-8">
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Jobs</h1>
          <p className="mt-1 text-sm text-gray-700">
            View and manage your assigned jobs
          </p>
        </div>
        <Link 
          href="/employee/dashboard" 
          className="w-full sm:w-auto rounded-lg border border-gray-300 bg-white px-4 py-3 sm:py-2 text-base sm:text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 flex items-center justify-center"
        >
          Back to Dashboard
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
      
      {/* Filter controls */}
      <div className="mb-4 sm:mb-6">
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-base font-medium leading-6 text-gray-900">Filter Jobs</h3>
          </div>
          <div className="px-4 py-4">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`py-3 px-4 text-center text-base font-medium rounded-lg ${
                  filter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('inProgress')}
                className={`py-3 px-4 text-center text-base font-medium rounded-lg ${
                  filter === 'inProgress'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                In Progress
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`py-3 px-4 text-center text-base font-medium rounded-lg ${
                  filter === 'pending'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Pending
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Jobs list */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-indigo-500"></div>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <div className="flex flex-col items-center justify-center">
            <BriefcaseIcon className="h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-base font-medium text-gray-900">No jobs found</h3>
            <p className="mt-1 text-sm text-gray-500">You don't have any {filter !== 'all' ? filter : ''} jobs assigned.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <div key={job.id} className="bg-white shadow overflow-hidden rounded-lg">
              <div className="px-4 py-4 sm:px-6 flex justify-between items-center border-b border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BriefcaseIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-3 flex-grow">
                    <h3 className="text-base font-medium text-gray-900 line-clamp-1">{job.title}</h3>
                  </div>
                </div>
                <div className="flex flex-shrink-0 space-x-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityClass(job.priority)}`}>
                    {job.priority}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(job.status)}`}>
                    {job.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              
              <div className="px-4 py-4 sm:px-6">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="col-span-2">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <UserIcon className="h-4 w-4 mr-1 text-gray-400" />
                      Customer
                    </dt>
                    <dd className="mt-1 text-base text-gray-900">{job.customer.name}</dd>
                  </div>
                  
                  <div className="col-span-1">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                      Due Date
                    </dt>
                    <dd className={`mt-1 text-base ${isJobOverdue(job) ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                      {formatDate(job.dueDate)}
                    </dd>
                  </div>
                  
                  <div className="col-span-1">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <TagIcon className="h-4 w-4 mr-1 text-gray-400" />
                      Completion
                    </dt>
                    <dd className="mt-1 text-base text-gray-900">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                          <div 
                            className="bg-indigo-600 h-2.5 rounded-full" 
                            style={{ width: `${calculateCompletion(job)}%` }}
                          ></div>
                        </div>
                        <span>{calculateCompletion(job)}%</span>
                      </div>
                    </dd>
                  </div>
                </dl>
                
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Products</h4>
                  <ul className="space-y-2">
                    {job.jobProducts.map((product) => (
                      <li key={product.id} className="text-sm text-gray-900 flex justify-between items-center bg-gray-50 rounded-lg p-2">
                        <span className="font-medium">{product.product.name}</span>
                        <span>
                          {product.completedQuantity} of {product.quantity} completed
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      {job.status !== 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleStatusChange(job.id, 'IN_PROGRESS')}
                          className="inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-2 text-sm font-medium text-blue-700"
                        >
                          <ArrowPathIcon className="h-4 w-4 mr-1" />
                          Start
                        </button>
                      )}
                      
                      {job.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleStatusChange(job.id, 'COMPLETED')}
                          className="inline-flex items-center rounded-lg bg-green-50 px-2.5 py-2 text-sm font-medium text-green-700"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Complete
                        </button>
                      )}
                    </div>
                    
                    <Link
                      href={`/employee/jobs/${job.id}`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Details
                      <ChevronRightIcon className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 