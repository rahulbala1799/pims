'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, subDays, startOfDay, endOfDay, parseISO } from 'date-fns';

interface User {
  id: string;
  name: string;
  email: string;
}

interface HourLog {
  id: string;
  userId: string;
  startTime: string;
  endTime: string | null;
  hours: number | null;
  date: string;
  isActive: boolean;
  isPaid: boolean;
  notes: string | null;
  user: User;
}

export default function AdminHoursPage() {
  const router = useRouter();
  const [hourLogs, setHourLogs] = useState<HourLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('unpaid');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [employees, setEmployees] = useState<User[]>([]);
  const [dateRange, setDateRange] = useState<'all' | 'week' | 'month'>('month');
  const [selectedHours, setSelectedHours] = useState<{[key: string]: boolean}>({});
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Fetch employees
  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch employees');
      }
      
      setEmployees(data);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };
  
  // Fetch hour logs with filtering
  const fetchHourLogs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Build the query URL based on filters
      let queryUrl = '/api/hour-logs?';
      
      // Employee filter
      if (selectedEmployee !== 'all') {
        queryUrl += `userId=${selectedEmployee}&`;
      }
      
      // Payment status filter
      if (filter !== 'all') {
        queryUrl += `isPaid=${filter === 'paid'}&`;
      }
      
      // Date range filter
      if (dateRange !== 'all') {
        const endDate = format(endOfDay(new Date()), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
        let startDate;
        
        if (dateRange === 'week') {
          startDate = format(startOfDay(subDays(new Date(), 7)), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
        } else if (dateRange === 'month') {
          startDate = format(startOfDay(subDays(new Date(), 30)), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
        }
        
        queryUrl += `startDate=${encodeURIComponent(startDate!)}&endDate=${encodeURIComponent(endDate)}`;
      }
      
      const response = await fetch(queryUrl);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch hour logs');
      }
      
      // Sort logs by date (newest first) and employee name
      const sortedLogs = [...data].sort((a, b) => {
        // First sort by date (newest first)
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        
        if (dateB !== dateA) {
          return dateB - dateA;
        }
        
        // Then sort by employee name
        return a.user.name.localeCompare(b.user.name);
      });
      
      setHourLogs(sortedLogs);
      
      // Reset selected hours
      setSelectedHours({});
    } catch (err) {
      console.error('Error fetching hour logs:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchEmployees();
  }, []);
  
  useEffect(() => {
    if (employees.length > 0) {
      fetchHourLogs();
    }
  }, [employees, filter, selectedEmployee, dateRange]);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'MMM d, yyyy');
  };
  
  // Format time for display
  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'Not completed';
    return format(parseISO(dateString), 'h:mm a');
  };
  
  // Toggle selection of all hour logs
  const toggleSelectAll = () => {
    if (Object.keys(selectedHours).length === hourLogs.length) {
      // If all are selected, unselect all
      setSelectedHours({});
    } else {
      // Otherwise, select all
      const newSelected: {[key: string]: boolean} = {};
      hourLogs.forEach(log => {
        newSelected[log.id] = true;
      });
      setSelectedHours(newSelected);
    }
  };
  
  // Toggle selection of a single hour log
  const toggleSelect = (id: string) => {
    setSelectedHours(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // Mark selected logs as paid/unpaid
  const updatePaymentStatus = async (setPaid: boolean) => {
    const selectedIds = Object.keys(selectedHours).filter(id => selectedHours[id]);
    
    if (selectedIds.length === 0) {
      setError('No hour logs selected');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Update each selected log
      const updates = selectedIds.map(id => 
        fetch('/api/hour-logs', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            id,
            isPaid: setPaid
          }),
        })
      );
      
      await Promise.all(updates);
      
      // Refetch the hour logs
      await fetchHourLogs();
      
      // Clear selection
      setSelectedHours({});
    } catch (err) {
      console.error('Error updating payment status:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Employee Hours</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage and track employee working hours.
          </p>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
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
      
      {/* Filters */}
      <div className="mb-6 bg-white p-4 shadow sm:rounded-lg">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="employee" className="block text-sm font-medium text-gray-700">
              Employee
            </label>
            <select
              id="employee"
              name="employee"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="all">All Employees</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700">
              Payment Status
            </label>
            <select
              id="paymentStatus"
              name="paymentStatus"
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'unpaid' | 'paid')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="all">All</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700">
              Date Range
            </label>
            <select
              id="dateRange"
              name="dateRange"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as 'all' | 'week' | 'month')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="all">All Time</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="selectAll"
            name="selectAll"
            type="checkbox"
            checked={Object.keys(selectedHours).length > 0 && Object.keys(selectedHours).length === hourLogs.length}
            onChange={toggleSelectAll}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="selectAll" className="ml-2 text-sm text-gray-700">
            Select All
          </label>
        </div>
        
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => updatePaymentStatus(true)}
            disabled={isProcessing || Object.keys(selectedHours).filter(id => selectedHours[id]).length === 0}
            className="inline-flex items-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Mark as Paid'}
          </button>
          
          <button
            type="button"
            onClick={() => updatePaymentStatus(false)}
            disabled={isProcessing || Object.keys(selectedHours).filter(id => selectedHours[id]).length === 0}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Mark as Unpaid'}
          </button>
        </div>
      </div>
      
      {/* Hour logs table */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-indigo-500"></div>
        </div>
      ) : hourLogs.length === 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6 text-center">
            <p className="text-sm text-gray-500">No hour logs found matching the filters.</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                <th scope="col" className="relative px-3 py-3.5">
                  <span className="sr-only">Select</span>
                </th>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Employee</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Start Time</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">End Time</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Hours</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Notes</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {hourLogs.map((log) => (
                <tr key={log.id} className={selectedHours[log.id] ? 'bg-indigo-50' : undefined}>
                  <td className="relative px-3 py-4">
                    <input
                      type="checkbox"
                      checked={!!selectedHours[log.id]}
                      onChange={() => toggleSelect(log.id)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {log.user.name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {formatDate(log.date)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {formatTime(log.startTime)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {log.endTime ? formatTime(log.endTime) : 'Not completed'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {log.hours ? `${log.hours.toFixed(2)}` : '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    {log.isPaid ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Paid
                      </span>
                    ) : !log.endTime ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Incomplete
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Unpaid
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {log.notes ? (log.notes.length > 30 ? `${log.notes.substring(0, 30)}...` : log.notes) : '-'}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <button
                      onClick={() => {
                        const newStatus = !log.isPaid;
                        updatePaymentStatus(newStatus);
                      }}
                      className={`text-sm ${log.isPaid ? 'text-gray-600 hover:text-gray-900' : 'text-indigo-600 hover:text-indigo-900'}`}
                    >
                      {log.isPaid ? 'Mark Unpaid' : 'Mark Paid'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 