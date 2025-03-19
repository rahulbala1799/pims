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
  ChevronRightIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  DocumentTextIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

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

export default function EmployeeJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  
  // Tab navigation
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');
  
  // Advanced filters
  const [filter, setFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'inProgress' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'urgent' | 'high' | 'medium' | 'low'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
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
        // Fetch all jobs, not just those assigned to the user
        const response = await fetch('/api/jobs');
        
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
  
  // Get filtered jobs based on current filters and active tab
  const filteredJobs = jobs.filter(job => {
    // First filter by tab
    if (activeTab === 'active' && job.status === 'COMPLETED') return false;
    if (activeTab === 'completed' && job.status !== 'COMPLETED') return false;
    
    // Filter by assignment
    if (filter === 'assigned' && job.assignedToId !== userData?.id) return false;
    if (filter === 'unassigned' && job.assignedToId !== null) return false;
    
    // Filter by status
    if (statusFilter === 'pending' && job.status !== 'PENDING') return false;
    if (statusFilter === 'inProgress' && job.status !== 'IN_PROGRESS') return false;
    if (statusFilter === 'completed' && job.status !== 'COMPLETED') return false;
    
    // Filter by priority
    if (priorityFilter === 'urgent' && job.priority !== 'URGENT') return false;
    if (priorityFilter === 'high' && job.priority !== 'HIGH') return false;
    if (priorityFilter === 'medium' && job.priority !== 'MEDIUM') return false;
    if (priorityFilter === 'low' && job.priority !== 'LOW') return false;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const titleMatch = job.title.toLowerCase().includes(query);
      const customerMatch = job.customer.name.toLowerCase().includes(query);
      const descriptionMatch = job.description ? job.description.toLowerCase().includes(query) : false;
      
      if (!titleMatch && !customerMatch && !descriptionMatch) return false;
    }
    
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
      
      // Refresh jobs from the API to ensure proper syncing
      const refreshResponse = await fetch('/api/jobs');
      if (refreshResponse.ok) {
        const refreshedData = await refreshResponse.json();
        setJobs(refreshedData);
      } else {
        // If refresh fails, just update the local state
        setJobs(jobs.map(job => 
          job.id === jobId ? { ...job, status } : job
        ));
      }
    } catch (error) {
      console.error('Error updating job status:', error);
      setError('An error occurred while updating the job status.');
    }
  };
  
  // Calculate total count based on filters for showing counts
  const getFilteredCounts = () => {
    const total = jobs.length;
    const active = jobs.filter(job => job.status !== 'COMPLETED').length;
    const completed = jobs.filter(job => job.status === 'COMPLETED').length;
    const assigned = jobs.filter(job => job.assignedToId === userData?.id).length;
    const unassigned = jobs.filter(job => job.assignedToId === null).length;
    const pending = jobs.filter(job => job.status === 'PENDING').length;
    const inProgress = jobs.filter(job => job.status === 'IN_PROGRESS').length;
    const urgent = jobs.filter(job => job.priority === 'URGENT').length;
    const high = jobs.filter(job => job.priority === 'HIGH').length;
    
    return {
      total,
      active,
      completed,
      assigned,
      unassigned,
      pending,
      inProgress,
      urgent,
      high
    };
  };
  
  // Reset all filters
  const resetFilters = () => {
    setFilter('all');
    setStatusFilter('all');
    setPriorityFilter('all');
    setSearchQuery('');
    setFilterOpen(false);
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
  
  const counts = getFilteredCounts();

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
          <h1 className="text-2xl font-semibold text-gray-900">Jobs</h1>
          <p className="mt-1 text-sm text-gray-700">
            View and manage all printing jobs
          </p>
        </div>
        <Link 
          href="/employee/dashboard" 
          className="w-full sm:w-auto rounded-lg border border-gray-300 bg-white px-4 py-3 sm:py-2 text-base sm:text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 flex items-center justify-center"
        >
          Back to Dashboard
        </Link>
      </div>
      
      {/* Tab Navigation */}
      <div className="mb-4 sm:mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('all')}
            className={`${
              activeTab === 'all'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap border-b-2 py-4 px-1 text-base font-medium`}
          >
            All Jobs
            <span className="ml-2 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
              {counts.total}
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('active')}
            className={`${
              activeTab === 'active'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap border-b-2 py-4 px-1 text-base font-medium`}
          >
            Active
            <span className="ml-2 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
              {counts.active}
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('completed')}
            className={`${
              activeTab === 'completed'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap border-b-2 py-4 px-1 text-base font-medium`}
          >
            Completed
            <span className="ml-2 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
              {counts.completed}
            </span>
          </button>
        </nav>
      </div>
      
      {error && (
        <div className="mb-4 sm:mb-6 rounded-lg bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
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
      
      {/* Stats overview */}
      <div className="mb-4 sm:mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
              <BriefcaseIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm text-gray-500">
                {activeTab === 'completed' ? 'Completed Jobs' : 'Total Jobs'}
              </div>
              <div className="text-xl font-semibold">
                {activeTab === 'completed' ? counts.completed : counts.total}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm text-gray-500">
                {activeTab === 'completed' ? 'Your Completed' : 'My Jobs'}
              </div>
              <div className="text-xl font-semibold">
                {activeTab === 'completed' 
                  ? jobs.filter(j => j.status === 'COMPLETED' && j.assignedToId === userData?.id).length 
                  : counts.assigned}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
              {activeTab === 'completed' 
                ? <ClockIcon className="h-6 w-6 text-blue-600" />
                : <ArrowPathIcon className="h-6 w-6 text-blue-600" />
              }
            </div>
            <div className="ml-4">
              <div className="text-sm text-gray-500">
                {activeTab === 'completed' ? 'This Month' : 'In Progress'}
              </div>
              <div className="text-xl font-semibold">
                {activeTab === 'completed' 
                  ? jobs.filter(j => {
                      if (j.status !== 'COMPLETED') return false;
                      const date = new Date(j.updatedAt);
                      const now = new Date();
                      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                    }).length
                  : counts.inProgress}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
              {activeTab === 'completed' 
                ? <CalendarIcon className="h-6 w-6 text-red-600" />
                : <ExclamationCircleIcon className="h-6 w-6 text-red-600" />
              }
            </div>
            <div className="ml-4">
              <div className="text-sm text-gray-500">
                {activeTab === 'completed' ? 'Last Month' : 'Urgent'}
              </div>
              <div className="text-xl font-semibold">
                {activeTab === 'completed' 
                  ? jobs.filter(j => {
                      if (j.status !== 'COMPLETED') return false;
                      const date = new Date(j.updatedAt);
                      const now = new Date();
                      const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
                      const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
                      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
                    }).length
                  : counts.urgent + counts.high}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Search and filter */}
      <div className="mb-4 sm:mb-6 bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="relative rounded-md shadow-sm flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full rounded-md border-0 py-3 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder={`Search ${activeTab === 'completed' ? 'completed' : ''} jobs by title, customer or description`}
              />
            </div>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-3 sm:py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              <FunnelIcon className="-ml-0.5 h-5 w-5 text-gray-400" />
              Filters
              {(filter !== 'all' || statusFilter !== 'all' || priorityFilter !== 'all') && 
                <span className="ml-1 rounded-full bg-indigo-600 px-1.5 py-0.5 text-xs font-medium text-white">
                  Active
                </span>
              }
            </button>
          </div>
          
          {filterOpen && (
            <div className="mt-4 border-t border-gray-200 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="assignment-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Assignment
                  </label>
                  <select
                    id="assignment-filter"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="block w-full rounded-md border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                  >
                    <option value="all">All Jobs</option>
                    <option value="assigned">Assigned to Me ({activeTab === 'completed' 
                      ? jobs.filter(j => j.status === 'COMPLETED' && j.assignedToId === userData?.id).length 
                      : counts.assigned})</option>
                    {activeTab !== 'completed' && (
                      <option value="unassigned">Unassigned ({counts.unassigned})</option>
                    )}
                  </select>
                </div>
                
                {activeTab !== 'completed' && (
                  <div>
                    <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      id="status-filter"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="block w-full rounded-md border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Not Started ({counts.pending})</option>
                      <option value="inProgress">In Progress ({counts.inProgress})</option>
                    </select>
                  </div>
                )}
                
                <div>
                  <label htmlFor="priority-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    id="priority-filter"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value as any)}
                    className="block w-full rounded-md border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                  >
                    <option value="all">All Priorities</option>
                    <option value="urgent">Urgent ({counts.urgent})</option>
                    <option value="high">High ({counts.high})</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  <XMarkIcon className="-ml-0.5 h-5 w-5 text-gray-400" />
                  Clear Filters
                </button>
              </div>
            </div>
          )}
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
            <p className="mt-1 text-sm text-gray-500">No jobs match your current filter criteria.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <div 
              key={job.id} 
              className={`bg-white shadow overflow-hidden rounded-lg ${isAssignedToMe(job) ? 'ring-2 ring-indigo-500' : ''}`}
            >
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
                      <UserIcon className="h-4 w-4 mr-1 text-gray-400" />
                      Assigned To
                    </dt>
                    <dd className="mt-1 text-base text-gray-900">
                      {job.assignedTo ? (
                        <span className={job.assignedToId === userData?.id ? 'font-medium text-indigo-600' : ''}>
                          {job.assignedTo.name}
                        </span>
                      ) : (
                        <span className="text-gray-500">Unassigned</span>
                      )}
                    </dd>
                  </div>
                  
                  <div className="col-span-1">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
                      Time Spent
                    </dt>
                    <dd className="mt-1 text-base text-gray-900">
                      {getTotalTime(job) > 0 ? formatTime(getTotalTime(job)) : 'Not started'}
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
                  <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                    <DocumentTextIcon className="h-4 w-4 mr-1 text-gray-400" />
                    Products ({job.jobProducts.length})
                  </h4>
                  <div className="overflow-hidden">
                    <ul className="space-y-2 max-h-36 overflow-y-auto">
                      {job.jobProducts.map((product) => (
                        <li key={product.id} className="text-sm text-gray-900 flex justify-between items-center bg-gray-50 rounded-lg p-2">
                          <span className="font-medium">{product.product.name}</span>
                          <span>
                            {product.completedQuantity} of {product.quantity} completed
                          </span>
                        </li>
                      )).slice(0, 3)}
                      {job.jobProducts.length > 3 && (
                        <li className="text-xs text-center text-gray-500 italic">
                          + {job.jobProducts.length - 3} more products
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      {isAssignedToMe(job) && job.status !== 'COMPLETED' && (
                        <>
                          {job.status !== 'IN_PROGRESS' && (
                            <button
                              onClick={() => handleStatusChange(job.id, 'IN_PROGRESS')}
                              className="inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-2 text-sm font-medium text-blue-700"
                            >
                              <ArrowPathIcon className="h-4 w-4 mr-1" />
                              Start
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleStatusChange(job.id, 'COMPLETED')}
                            className="inline-flex items-center rounded-lg bg-green-50 px-2.5 py-2 text-sm font-medium text-green-700"
                          >
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Complete
                          </button>
                        </>
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