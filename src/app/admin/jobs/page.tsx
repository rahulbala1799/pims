'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface JobProduct {
  id: string;
  productId: string;
  quantity: number;
  completedQuantity?: number;
  timeTaken?: number;
}

interface Job {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  customer: {
    id: string;
    name: string;
  };
  assignedTo: {
    id: string;
    name: string;
  } | null;
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  jobProducts: JobProduct[];
  invoiceId?: string;
  invoice?: {
    id: string;
    invoiceNumber: string;
  };
}

interface JobMetrics {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  cancelled: number;
  overdue: number;
  unassigned: number;
  highPriority: number;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<JobMetrics>({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    cancelled: 0,
    overdue: 0,
    unassigned: 0,
    highPriority: 0
  });
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [customers, setCustomers] = useState<{id: string, name: string}[]>([]);
  const [customerFilter, setCustomerFilter] = useState<string>("ALL");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [jobsPerPage] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/jobs');
        if (!response.ok) {
          throw new Error('Failed to fetch jobs');
        }
        const data = await response.json();
        setJobs(data);
        setFilteredJobs(data);
        calculateMetrics(data);
        
        // Extract unique customers for the filter
        const customerMap = new Map<string, {id: string, name: string}>();
        data.forEach((job: Job) => {
          if (job.customer && job.customer.id) {
            customerMap.set(job.customer.id, {
              id: job.customer.id,
              name: job.customer.name
            });
          }
        });
        setCustomers(Array.from(customerMap.values()));
        
        setTotalPages(Math.ceil(data.length / jobsPerPage));
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [jobsPerPage]);
  
  // Apply filters when they change
  useEffect(() => {
    let result = [...jobs];
    
    // Filter by status
    if (statusFilter !== "ALL") {
      result = result.filter(job => job.status === statusFilter);
    }
    
    // Filter by priority
    if (priorityFilter !== "ALL") {
      result = result.filter(job => job.priority === priorityFilter);
    }
    
    // Filter by customer
    if (customerFilter !== "ALL") {
      result = result.filter(job => job.customer.id === customerFilter);
    }
    
    // Filter by search query (job title)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(job => 
        job.title.toLowerCase().includes(query) ||
        (job.customer?.name && job.customer.name.toLowerCase().includes(query))
      );
    }
    
    setFilteredJobs(result);
    setTotalPages(Math.ceil(result.length / jobsPerPage));
    setCurrentPage(1); // Reset to first page when filters change
  }, [jobs, statusFilter, priorityFilter, customerFilter, searchQuery, jobsPerPage]);

  const calculateMetrics = (jobsData: Job[]) => {
    const metrics: JobMetrics = {
      total: jobsData.length,
      completed: 0,
      inProgress: 0,
      pending: 0,
      cancelled: 0,
      overdue: 0,
      unassigned: 0,
      highPriority: 0
    };

    jobsData.forEach(job => {
      // Count by status
      switch (job.status) {
        case 'COMPLETED':
          metrics.completed++;
          break;
        case 'IN_PROGRESS':
          metrics.inProgress++;
          break;
        case 'PENDING':
          metrics.pending++;
          break;
        case 'CANCELLED':
          metrics.cancelled++;
          break;
      }

      // Count overdue jobs
      if (isDueDateOverdue(job.dueDate) && job.status !== 'COMPLETED' && job.status !== 'CANCELLED') {
        metrics.overdue++;
      }

      // Count unassigned jobs
      if (!job.assignedTo && job.status !== 'COMPLETED' && job.status !== 'CANCELLED') {
        metrics.unassigned++;
      }

      // Count high priority jobs
      if (job.priority === 'HIGH' || job.priority === 'URGENT') {
        metrics.highPriority++;
      }
    });

    setMetrics(metrics);
  };

  const getStatusColor = (status: string) => {
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

  const getPriorityColor = (priority: string) => {
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateProgress = (job: Job) => {
    if (!job.jobProducts || job.jobProducts.length === 0) return 0;
    
    const totalCompleted = job.jobProducts.reduce((sum, product) => 
      sum + (product.completedQuantity || 0), 0);
    
    const totalQuantity = job.jobProducts.reduce((sum, product) => 
      sum + product.quantity, 0);
    
    return totalQuantity > 0 ? Math.round((totalCompleted / totalQuantity) * 100) : 0;
  };

  const getEstimatedTime = (job: Job) => {
    if (!job.jobProducts || job.jobProducts.length === 0) return 'N/A';
    
    const totalTime = job.jobProducts.reduce((sum, product) => 
      sum + (product.timeTaken || 0), 0);
    
    if (totalTime === 0) return 'N/A';
    
    if (totalTime < 60) {
      return `${totalTime} min`;
    } else {
      const hours = Math.floor(totalTime / 60);
      const minutes = totalTime % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  };

  const isDueDateOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    return due < today;
  };

  const handleDeleteJob = async (jobId: string, jobTitle: string) => {
    if (!confirm(`Are you sure you want to delete the job "${jobTitle}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete job');
      }
      
      const updatedJobs = jobs.filter(job => job.id !== jobId);
      setJobs(updatedJobs);
      calculateMetrics(updatedJobs);
      
      alert('Job deleted successfully');
    } catch (err) {
      console.error('Error deleting job:', err);
      alert('Failed to delete job. Please try again.');
    }
  };
  
  // Pagination controls
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Jobs</h1>
        <Link
          href="/admin/jobs/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create New Job
        </Link>
      </div>

      {/* Metrics Dashboard */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="bg-white shadow rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{metrics.total}</div>
          <div className="text-sm text-gray-500">Total Jobs</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{metrics.completed}</div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{metrics.inProgress}</div>
          <div className="text-sm text-gray-500">In Progress</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-600">{metrics.pending}</div>
          <div className="text-sm text-gray-500">Not Started</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{metrics.overdue}</div>
          <div className="text-sm text-gray-500">Overdue</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{metrics.highPriority}</div>
          <div className="text-sm text-gray-500">High Priority</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{metrics.unassigned}</div>
          <div className="text-sm text-gray-500">Unassigned</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{metrics.cancelled}</div>
          <div className="text-sm text-gray-500">Cancelled</div>
        </div>
      </div>

      {/* Job Completion Chart - Visual representation of job statuses */}
      <div className="mb-6 bg-white shadow rounded-lg p-4">
        <h2 className="text-lg font-medium text-gray-900 mb-3">Job Status Overview</h2>
        <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden">
          {metrics.total > 0 && (
            <>
              <div 
                className="h-6 bg-green-500 float-left"
                style={{ width: `${(metrics.completed / metrics.total) * 100}%` }}
                title={`Completed: ${metrics.completed} (${Math.round((metrics.completed / metrics.total) * 100)}%)`}
              ></div>
              <div 
                className="h-6 bg-blue-500 float-left"
                style={{ width: `${(metrics.inProgress / metrics.total) * 100}%` }}
                title={`In Progress: ${metrics.inProgress} (${Math.round((metrics.inProgress / metrics.total) * 100)}%)`}
              ></div>
              <div 
                className="h-6 bg-gray-400 float-left"
                style={{ width: `${(metrics.pending / metrics.total) * 100}%` }}
                title={`Not Started: ${metrics.pending} (${Math.round((metrics.pending / metrics.total) * 100)}%)`}
              ></div>
              <div 
                className="h-6 bg-red-500 float-left"
                style={{ width: `${(metrics.cancelled / metrics.total) * 100}%` }}
                title={`Cancelled: ${metrics.cancelled} (${Math.round((metrics.cancelled / metrics.total) * 100)}%)`}
              ></div>
            </>
          )}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-400 rounded-full mr-1"></div>
            <span>Not Started</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
            <span>Cancelled</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white shadow rounded-lg p-4">
        <h2 className="text-lg font-medium text-gray-900 mb-3">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jobs..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              id="priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
            <select
              id="customer"
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="ALL">All Customers</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setStatusFilter("ALL");
              setPriorityFilter("ALL");
              setCustomerFilter("ALL");
              setSearchQuery("");
            }}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {filteredJobs.length > 0 ? (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/admin/jobs/${job.id}`} className="text-indigo-600 hover:text-indigo-900 font-medium">
                        {job.title}
                      </Link>
                      {job.invoice && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Invoice #{job.invoice.invoiceNumber}
                        </span>
                      )}
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(job.priority)}`}>
                        {job.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{job.customer.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                          <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${calculateProgress(job)}%` }}></div>
                        </div>
                        <span className="text-sm text-gray-500">{calculateProgress(job)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${isDueDateOverdue(job.dueDate) && job.status !== 'COMPLETED' ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {formatDate(job.dueDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{job.assignedTo ? job.assignedTo.name : 'Unassigned'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      <div className="flex justify-center space-x-2">
                        <Link 
                          href={`/admin/jobs/${job.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDeleteJob(job.id, job.title)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{indexOfFirstJob + 1}</span> to <span className="font-medium">
                      {Math.min(indexOfLastJob, filteredJobs.length)}
                    </span> of <span className="font-medium">{filteredJobs.length}</span> jobs
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={prevPage}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === 1 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const pageNum = currentPage <= 3 
                        ? i + 1 
                        : currentPage >= totalPages - 2 
                          ? totalPages - 4 + i 
                          : currentPage - 2 + i;
                      
                      if (pageNum <= 0 || pageNum > totalPages) return null;
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => paginate(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === totalPages 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {jobs.length === 0 
                ? "Get started by creating a new job." 
                : "Try adjusting your filters to find what you're looking for."}
            </p>
            <div className="mt-6">
              {jobs.length === 0 ? (
                <Link
                  href="/admin/jobs/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  New Job
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setStatusFilter("ALL");
                    setPriorityFilter("ALL");
                    setCustomerFilter("ALL");
                    setSearchQuery("");
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 