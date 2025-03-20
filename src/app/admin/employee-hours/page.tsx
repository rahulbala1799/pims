'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

interface User {
  id: string;
  name: string;
  email: string;
}

interface HourLog {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string | null;
  hours: number | null;
  isActive: boolean;
  isPaid: boolean;
  notes: string | null;
  user: User;
  createdAt: string;
  updatedAt: string;
}

export default function AdminEmployeeHoursPage() {
  const router = useRouter();
  const [hourLogs, setHourLogs] = useState<HourLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('unpaid'); // 'all', 'unpaid', 'paid'
  const [selectedLogs, setSelectedLogs] = useState<string[]>([]); // Store IDs of selected logs
  const [isApproving, setIsApproving] = useState(false);

  // Fetch hour logs
  const fetchHourLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/hour-logs');
      
      if (!response.ok) {
        throw new Error('Failed to fetch hour logs');
      }
      
      const data = await response.json();
      setHourLogs(data);
      
      console.log(`Fetched ${data.length} hour logs`);
    } catch (err) {
      console.error('Error fetching hour logs:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchHourLogs();
  }, []);
  
  // Format date and time
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'EEE, MMM d, yyyy');
  };
  
  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };
  
  // Toggle selection of a log
  const toggleSelection = (logId: string) => {
    if (selectedLogs.includes(logId)) {
      setSelectedLogs(selectedLogs.filter(id => id !== logId));
    } else {
      setSelectedLogs([...selectedLogs, logId]);
    }
  };
  
  // Select all visible logs
  const selectAllVisible = () => {
    const visibleLogs = getFilteredLogs().map(log => log.id);
    setSelectedLogs(visibleLogs);
  };
  
  // Clear all selections
  const clearSelection = () => {
    setSelectedLogs([]);
  };
  
  // Approve selected logs
  const approveSelectedLogs = async () => {
    if (selectedLogs.length === 0) return;
    
    setIsApproving(true);
    setError(null);
    
    try {
      // Process each log one by one to be safe
      for (const logId of selectedLogs) {
        const response = await fetch(`/api/hour-logs/${logId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            isPaid: true,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to approve log ${logId}`);
        }
      }
      
      // Refresh the logs
      await fetchHourLogs();
      
      // Clear selection
      setSelectedLogs([]);
    } catch (err) {
      console.error('Error approving hour logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve logs');
    } finally {
      setIsApproving(false);
    }
  };
  
  // Filter logs based on current filter
  const getFilteredLogs = () => {
    return hourLogs.filter(log => {
      if (filter === 'unpaid') return !log.isPaid;
      if (filter === 'paid') return log.isPaid;
      return true; // 'all' filter
    });
  };
  
  // Calculate total hours for selected logs
  const calculateTotalHours = () => {
    return getFilteredLogs()
      .filter(log => selectedLogs.includes(log.id))
      .reduce((total, log) => total + (log.hours || 0), 0);
  };

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Employee Hours</h1>
          <p className="mt-1 text-sm text-gray-700">
            View and approve employee work hours.
          </p>
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
      
      {/* Filters and Actions */}
      <div className="mt-6 flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label htmlFor="filter" className="block text-sm font-medium text-gray-700">
              Show
            </label>
            <select
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="all">All Hours</option>
              <option value="unpaid">Unpaid Hours</option>
              <option value="paid">Paid Hours</option>
            </select>
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={selectAllVisible}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Clear
            </button>
          </div>
        </div>
        <div>
          <button
            type="button"
            onClick={approveSelectedLogs}
            disabled={selectedLogs.length === 0 || isApproving}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              selectedLogs.length === 0 || isApproving
                ? 'bg-indigo-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }`}
          >
            {isApproving ? 'Approving...' : `Approve Selected (${selectedLogs.length})`}
          </button>
        </div>
      </div>
      
      {/* Selection summary */}
      {selectedLogs.length > 0 && (
        <div className="mt-4 bg-indigo-50 p-4 rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-indigo-700">
                {selectedLogs.length} {selectedLogs.length === 1 ? 'entry' : 'entries'} selected
              </span>
              <span className="ml-2 text-sm text-indigo-500">
                ({calculateTotalHours().toFixed(2)} hours)
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading state */}
      {loading ? (
        <div className="mt-6 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          {/* Hour logs table */}
          <div className="mt-6 flex flex-col">
            <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  {getFilteredLogs().length === 0 ? (
                    <div className="bg-white px-6 py-4 text-center text-sm text-gray-500">
                      No hour logs found.
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              checked={getFilteredLogs().length > 0 && selectedLogs.length === getFilteredLogs().length}
                              onChange={() => {
                                if (selectedLogs.length === getFilteredLogs().length) {
                                  clearSelection();
                                } else {
                                  selectAllVisible();
                                }
                              }}
                            />
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Employee
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Date
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Start Time
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            End Time
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Hours
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Status
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {getFilteredLogs().map((log) => (
                          <tr 
                            key={log.id}
                            className={selectedLogs.includes(log.id) ? 'bg-indigo-50' : ''}
                          >
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                checked={selectedLogs.includes(log.id)}
                                onChange={() => toggleSelection(log.id)}
                              />
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                              {log.user.name}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                              {formatDate(log.date)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                              {formatDateTime(log.startTime)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                              {log.endTime ? formatDateTime(log.endTime) : 'In Progress'}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                              {log.hours ? log.hours.toFixed(2) : '-'}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                              <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                log.isPaid 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {log.isPaid ? 'Paid' : 'Unpaid'}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {log.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 