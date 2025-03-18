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
}

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJob = async () => {
      setIsLoading(true);
      try {
        // This will need to be replaced with actual API call when implemented
        // For now, creating a placeholder job object
        const mockJob: Job = {
          id: params.id,
          title: 'Sample Job',
          description: 'This is a sample job description',
          status: 'PENDING',
          priority: 'MEDIUM',
          customer: {
            id: 'cust1',
            name: 'ABC Company'
          },
          customerId: 'cust1',
          assignedTo: {
            id: 'user1',
            name: 'John Doe'
          },
          assignedToId: 'user1',
          createdBy: {
            id: 'admin1',
            name: 'Admin User'
          },
          createdById: 'admin1',
          dueDate: '2023-12-31',
          createdAt: '2023-11-15T10:00:00Z',
          updatedAt: '2023-11-15T10:00:00Z'
        };

        // Simulate API call delay
        setTimeout(() => {
          setJob(mockJob);
          setIsLoading(false);
        }, 1000);

        // Real implementation would be like:
        // const response = await fetch(`/api/jobs/${params.id}`);
        // if (!response.ok) {
        //   throw new Error('Failed to fetch job details');
        // }
        // const data = await response.json();
        // setJob(data);
        // setIsLoading(false);
      } catch (err) {
        console.error('Error fetching job:', err);
        setError('Failed to load job details');
        setIsLoading(false);
      }
    };

    fetchJob();
  }, [params.id]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error || 'Job not found'}
              </p>
            </div>
          </div>
        </div>
        <Link
          href="/admin/jobs"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Back to Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex justify-between items-center">
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