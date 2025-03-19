'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

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
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('all');
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state for new log
  const [showNewLogForm, setShowNewLogForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedStartTime, setSelectedStartTime] = useState('09:00');
  const [selectedEndTime, setSelectedEndTime] = useState('17:00');
  const [logNotes, setLogNotes] = useState('');

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
      // Build the query URL based on filter
      let queryUrl = `/api/hour-logs?userId=${userData.id}`;
      
      if (filter === 'week') {
        const startDate = format(startOfDay(subDays(new Date(), 7)), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
        const endDate = format(endOfDay(new Date()), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
        queryUrl += `&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
      } else if (filter === 'month') {
        const startDate = format(startOfDay(subDays(new Date(), 30)), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
        const endDate = format(endOfDay(new Date()), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
        queryUrl += `&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
      }
      
      const response = await fetch(queryUrl);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch hour logs');
      }
      
      // Sort logs by date (newest first)
      const sortedLogs = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
  
  // Fetch logs on component mount and when userData or filter changes
  useEffect(() => {
    if (userData) {
      fetchHourLogs();
    }
  }, [userData, filter]);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'EEEE, MMMM d, yyyy');
  };

  // Format time for display
  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'h:mm a');
  };
  
  // Generate time options in 15-minute intervals
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        options.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    return options;
  };
  
  // Create a new hour log with start and end time
  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userData || isCreating) return;
    
    setIsCreating(true);
    setError(null);
    
    try {
      // Construct datetime strings with selected date and times
      const startDateTime = `${selectedDate}T${selectedStartTime}:00`;
      const endDateTime = `${selectedDate}T${selectedEndTime}:00`;
      
      // Calculate hours between start and end time
      const startMs = new Date(startDateTime).getTime();
      const endMs = new Date(endDateTime).getTime();
      const diffMs = endMs - startMs;
      
      // Don't allow negative hours
      if (diffMs <= 0) {
        throw new Error('End time must be after start time');
      }
      
      const hours = diffMs / (1000 * 60 * 60);
      
      const response = await fetch('/api/hour-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData.id,
          startTime: startDateTime,
          endTime: endDateTime,
          hours: hours,
          date: selectedDate,
          isActive: false, // Not active since we provide end time
          notes: logNotes,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create hour log');
      }
      
      // Reset form
      setShowNewLogForm(false);
      setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
      setSelectedStartTime('09:00');
      setSelectedEndTime('17:00');
      setLogNotes('');
      
      // Refresh logs
      fetchHourLogs();
      
    } catch (err) {
      console.error('Error creating hour log:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsCreating(false);
    }
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
            View and manage your working hours.
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
      
      {/* New Log Form */}
      {showNewLogForm && (
        <div className="mb-8 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Log Hours</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Enter your working hours for a specific day.
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <form onSubmit={handleCreateLog} className="space-y-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                    Date
                  </label>
                  <div className="mt-1">
                    <input
                      type="date"
                      name="date"
                      id="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>

                <div className="sm:col-span-3"></div>

                <div className="sm:col-span-3">
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                    Start Time
                  </label>
                  <div className="mt-1">
                    <select
                      id="startTime"
                      name="startTime"
                      value={selectedStartTime}
                      onChange={(e) => setSelectedStartTime(e.target.value)}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      required
                    >
                      {generateTimeOptions().map((time) => (
                        <option key={`start-${time}`} value={time}>
                          {format(new Date(`2000-01-01T${time}:00`), 'h:mm a')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                    End Time
                  </label>
                  <div className="mt-1">
                    <select
                      id="endTime"
                      name="endTime"
                      value={selectedEndTime}
                      onChange={(e) => setSelectedEndTime(e.target.value)}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      required
                    >
                      {generateTimeOptions().map((time) => (
                        <option key={`end-${time}`} value={time}>
                          {format(new Date(`2000-01-01T${time}:00`), 'h:mm a')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      value={logNotes}
                      onChange={(e) => setLogNotes(e.target.value)}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowNewLogForm(false)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75"
                >
                  {isCreating ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Filter controls */}
      <div className="mb-6 flex items-center space-x-4">
        <span className="text-sm text-gray-700">View:</span>
        <div className="flex rounded-md shadow-sm" role="group">
          <button
            onClick={() => setFilter('all')}
            className={`py-2 px-4 text-sm font-medium rounded-l-md ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('week')}
            className={`py-2 px-4 text-sm font-medium border-t border-b ${
              filter === 'week'
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Last Week
          </button>
          <button
            onClick={() => setFilter('month')}
            className={`py-2 px-4 text-sm font-medium rounded-r-md ${
              filter === 'month'
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Last Month
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
            <p className="text-sm text-gray-500">No hour logs found.</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Date</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Start Time</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">End Time</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Hours</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Notes</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">View</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {hourLogs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {formatDate(log.date)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {formatTime(log.startTime)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {log.endTime ? formatTime(log.endTime) : 'In progress'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {log.hours ? `${log.hours.toFixed(2)}` : '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {log.notes ? log.notes.substring(0, 30) + (log.notes.length > 30 ? '...' : '') : '-'}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <Link
                      href={`/employee/hours/${log.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View
                    </Link>
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