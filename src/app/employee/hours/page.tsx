'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

interface HourLog {
  id: string;
  startTime: string;
  endTime: string | null;
  hours: number | null;
  date: string;
  isActive: boolean;
  autoStopped: boolean;
  notes: string | null;
}

export default function HourLogsList() {
  const router = useRouter();
  const [hourLogs, setHourLogs] = useState<HourLog[]>([]);
  const [activeLog, setActiveLog] = useState<HourLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStartingLog, setIsStartingLog] = useState(false);
  const [notes, setNotes] = useState<string>('');
  const [userData, setUserData] = useState<any>(null);
  const [dateFilter, setDateFilter] = useState<string>('week'); // 'week', 'month', 'all'

  // Get user data from localStorage
  useEffect(() => {
    const storedUserData = localStorage.getItem('employeeUser');
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }
  }, []);

  // Fetch hour logs
  const fetchHourLogs = async () => {
    if (!userData || !userData.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let url = `/api/hour-logs?userId=${userData.id}`;
      
      // Apply date filters
      if (dateFilter === 'week') {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        url += `&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
      } else if (dateFilter === 'month') {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        url += `&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch hour logs');
      }
      
      // Sort logs by date (newest first)
      const sortedLogs = data.sort((a: HourLog, b: HourLog) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
      
      setHourLogs(sortedLogs);
      
      // Check if there's an active log
      const active = sortedLogs.find((log: HourLog) => log.isActive);
      setActiveLog(active || null);
    } catch (err) {
      console.error('Error fetching hour logs:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch logs on component mount and when userId or dateFilter changes
  useEffect(() => {
    if (userData && userData.id) {
      fetchHourLogs();
    }
  }, [userData, dateFilter]);
  
  // Start a new hour log
  const handleStartLog = async () => {
    if (!userData || !userData.id || isStartingLog) return;
    
    setIsStartingLog(true);
    setError(null);
    
    try {
      const response = await fetch('/api/hour-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: userData.id,
          notes: notes.trim() || null
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start hour log');
      }
      
      setActiveLog(data);
      setNotes('');
      fetchHourLogs(); // Refresh the list
      
      // Redirect to the detail page for the new log
      router.push(`/employee/hours/${data.id}`);
    } catch (err) {
      console.error('Error starting hour log:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsStartingLog(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'EEE, MMM d, yyyy');
  };
  
  // Format time for display
  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a');
  };

  if (isLoading && !userData) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-indigo-500"></div>
      </div>
    );
  }
  
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Hour Logs</h1>
          <p className="mt-2 text-sm text-gray-700">
            View and manage your work hour logs.
          </p>
        </div>
        <div className="flex space-x-3">
          <Link 
            href="/employee/dashboard" 
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Back to Dashboard
          </Link>
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
      
      {/* Start new log form */}
      <div className="bg-white shadow sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Start a new log</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Record your work hours. Active logs will appear in the list below.</p>
          </div>
          <div className="mt-5 flex items-end gap-4">
            <div className="w-full max-w-lg">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes (optional)
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="notes"
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What are you working on?"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleStartLog}
              disabled={isStartingLog || !!activeLog}
              className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isStartingLog ? 'Starting...' : activeLog ? 'Log In Progress' : 'Start New Log'}
            </button>
          </div>
          {activeLog && (
            <div className="mt-3 text-sm text-indigo-600">
              <Link href={`/employee/hours/${activeLog.id}`} className="font-medium underline">
                View your active log
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white shadow sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Filter hour logs</h3>
            <div className="flex items-center gap-2">
              <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700">
                Date range:
              </label>
              <select
                id="date-filter"
                name="date-filter"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              >
                <option value="week">Last 7 days</option>
                <option value="month">Last 30 days</option>
                <option value="all">All time</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hour logs list */}
      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                    </div>
                  </td>
                </tr>
              ) : hourLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No hour logs found
                  </td>
                </tr>
              ) : (
                hourLogs.map((log) => (
                  <tr key={log.id} className={log.isActive ? 'bg-indigo-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(log.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTime(log.startTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.endTime ? formatTime(log.endTime) : 'In progress'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.hours ? `${log.hours.toFixed(2)} hours` : 'In progress'}
                      {log.autoStopped && ' (Auto-stopped)'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/employee/hours/${log.id}`}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        View
                      </Link>
                      {log.isActive && (
                        <Link
                          href={`/employee/hours/${log.id}`}
                          className="text-red-600 hover:text-red-900"
                        >
                          Stop
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 