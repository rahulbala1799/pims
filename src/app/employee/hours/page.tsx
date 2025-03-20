'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ClockIcon, PlusIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

interface HourLog {
  id: string;
  startTime: string;
  endTime: string | null;
  hours: number | null;
  date: string;
  isActive: boolean;
  isPaid: boolean;
  notes: string | null;
}

export default function HourLogsList() {
  const router = useRouter();
  const [hourLogs, setHourLogs] = useState<HourLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('week');
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state for new log
  const [showNewLogForm, setShowNewLogForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedStartTime, setSelectedStartTime] = useState('09:00');
  const [selectedEndTime, setSelectedEndTime] = useState('');
  const [includeEndTime, setIncludeEndTime] = useState(false);
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
      
      // Use current date for all calculations
      const currentDate = new Date();
      
      if (filter === 'week') {
        // Last 7 days from now
        const startDate = format(startOfDay(subDays(currentDate, 7)), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
        const endDate = format(endOfDay(currentDate), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
        queryUrl += `&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
        console.log('Fetching week logs with date range:', { startDate, endDate });
      } else if (filter === 'month') {
        // Last 30 days from now
        const startDate = format(startOfDay(subDays(currentDate, 30)), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
        const endDate = format(endOfDay(currentDate), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
        queryUrl += `&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
        console.log('Fetching month logs with date range:', { startDate, endDate });
      }
      
      console.log('Fetching logs with URL:', queryUrl);
      const response = await fetch(queryUrl);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error response:', errorData);
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Sort logs by date (newest first)
      const sortedLogs = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setHourLogs(sortedLogs);
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
    return format(new Date(dateString), 'EEE, MMM d');
  };

  // Format time for display
  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'Pending';
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
  
  // Create a new hour log with start and optional end time
  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userData || isCreating) return;
    
    setIsCreating(true);
    setError(null);
    
    try {
      // Construct datetime strings with selected date and times
      // Parse the date and time properly to ensure correct timezone handling
      const startDate = new Date(`${selectedDate}T${selectedStartTime}:00`);
      let endDate = null;
      let hours = null;
      
      console.log('Starting to create hour log with date:', selectedDate, 'and start time:', selectedStartTime);
      
      // Only calculate hours if end time is included
      if (includeEndTime && selectedEndTime) {
        endDate = new Date(`${selectedDate}T${selectedEndTime}:00`);
        
        // Calculate hours between start and end time
        const startMs = startDate.getTime();
        const endMs = endDate.getTime();
        const diffMs = endMs - startMs;
        
        // Don't allow negative hours
        if (diffMs <= 0) {
          throw new Error('End time must be after start time');
        }
        
        hours = diffMs / (1000 * 60 * 60);
      }
      
      // Create payload with proper ISO strings
      const payload = {
        userId: userData.id,
        startTime: startDate.toISOString(),
        endTime: endDate ? endDate.toISOString() : null,
        hours: hours,
        date: selectedDate, // This is just the date part
        isActive: !includeEndTime, // If no end time, it's an active log
        notes: logNotes,
      };
      
      console.log('Sending payload to API:', payload);
      
      const response = await fetch('/api/hour-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const data = await response.json();
        console.error('API error response:', data);
        throw new Error(data.error || 'Failed to create hour log');
      }
      
      const data = await response.json();
      console.log('Successfully created hour log:', data);
      
      // Reset form
      setShowNewLogForm(false);
      setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
      setSelectedStartTime('09:00');
      setSelectedEndTime('');
      setIncludeEndTime(false);
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

  // Toggle showing the new log form
  const toggleNewLogForm = () => {
    setShowNewLogForm(!showNewLogForm);
    // Set default values
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
    setSelectedStartTime('09:00');
    setSelectedEndTime('17:00');
    setIncludeEndTime(false);
    setLogNotes('');
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
          <h1 className="text-2xl font-semibold text-gray-900">Hour Logs</h1>
          <p className="mt-1 text-sm text-gray-700">
            View and manage your working hours.
          </p>
        </div>
        <div className="w-full sm:w-auto flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={toggleNewLogForm}
            className={`w-full sm:w-auto rounded-lg px-4 py-3 sm:py-2 text-base sm:text-sm font-medium shadow-sm flex items-center justify-center ${
              showNewLogForm 
                ? "bg-gray-200 text-gray-800 hover:bg-gray-300" 
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {showNewLogForm ? (
              'Cancel'
            ) : (
              <>
                <PlusIcon className="h-5 w-5 mr-1" />
                <span>Log Hours</span>
              </>
            )}
          </button>
          <Link 
            href="/employee/dashboard" 
            className="w-full sm:w-auto rounded-lg border border-gray-300 bg-white px-4 py-3 sm:py-2 text-base sm:text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 flex items-center justify-center"
          >
            Back to Dashboard
          </Link>
        </div>
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
      
      {/* New Log Form */}
      {showNewLogForm && (
        <div className="mb-6 bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex items-center">
              <ClockIcon className="h-6 w-6 text-indigo-500 mr-2" />
              <h3 className="text-lg leading-6 font-medium text-gray-900">Log Hours</h3>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Enter your working hours for a specific day.
            </p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleCreateLog} className="space-y-6">
              <div className="space-y-6">
                <div>
                  <label htmlFor="date" className="block text-base font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      name="date"
                      id="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-12 sm:h-10 text-base"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="startTime" className="block text-base font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <select
                    id="startTime"
                    name="startTime"
                    value={selectedStartTime}
                    onChange={(e) => setSelectedStartTime(e.target.value)}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-12 sm:h-10 text-base"
                    required
                  >
                    {generateTimeOptions().map((time) => (
                      <option key={`start-${time}`} value={time} className="py-2">
                        {format(new Date(`2000-01-01T${time}:00`), 'h:mm a')}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center h-12">
                  <input
                    id="includeEndTime"
                    name="includeEndTime"
                    type="checkbox"
                    checked={includeEndTime}
                    onChange={(e) => setIncludeEndTime(e.target.checked)}
                    className="focus:ring-indigo-500 h-6 w-6 text-indigo-600 border-gray-300 rounded"
                  />
                  <label htmlFor="includeEndTime" className="ml-3 block text-base font-medium text-gray-700">
                    Include end time (Complete entry)
                  </label>
                </div>

                {includeEndTime && (
                  <div>
                    <label htmlFor="endTime" className="block text-base font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <select
                      id="endTime"
                      name="endTime"
                      value={selectedEndTime}
                      onChange={(e) => setSelectedEndTime(e.target.value)}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-12 sm:h-10 text-base"
                      required={includeEndTime}
                    >
                      <option value="">Select end time</option>
                      {generateTimeOptions().map((time) => (
                        <option key={`end-${time}`} value={time} className="py-2">
                          {format(new Date(`2000-01-01T${time}:00`), 'h:mm a')}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label htmlFor="notes" className="block text-base font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    value={logNotes}
                    onChange={(e) => setLogNotes(e.target.value)}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-base py-3 px-4"
                    placeholder="What did you work on?"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full sm:w-auto inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75"
                >
                  {isCreating ? 'Saving...' : 'Save Hours'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Filter controls */}
      <div className="mb-4 sm:mb-6">
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-base font-medium leading-6 text-gray-900">View Period</h3>
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
                onClick={() => setFilter('week')}
                className={`py-3 px-4 text-center text-base font-medium rounded-lg ${
                  filter === 'week'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setFilter('month')}
                className={`py-3 px-4 text-center text-base font-medium rounded-lg ${
                  filter === 'month'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Month
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hour logs list */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-indigo-500"></div>
        </div>
      ) : hourLogs.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <div className="flex flex-col items-center justify-center">
            <ClockIcon className="h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-base font-medium text-gray-900">No hour logs found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by logging your hours.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {hourLogs.map((log) => (
            <div key={log.id} className="bg-white shadow overflow-hidden rounded-lg">
              <div className="px-4 py-4 sm:px-6 flex justify-between items-center border-b border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CalendarDaysIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-base font-medium text-gray-900">{formatDate(log.date)}</h3>
                  </div>
                </div>
                <div>
                  {log.isPaid ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      Paid
                    </span>
                  ) : !log.endTime ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      Incomplete
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      Unpaid
                    </span>
                  )}
                </div>
              </div>
              <div className="px-4 py-4 sm:px-6">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Start</dt>
                    <dd className="mt-1 text-base text-gray-900">{formatTime(log.startTime)}</dd>
                  </div>
                  <div className="col-span-1">
                    <dt className="text-sm font-medium text-gray-500">End</dt>
                    <dd className="mt-1 text-base text-gray-900">{log.endTime ? formatTime(log.endTime) : 'Not set'}</dd>
                  </div>
                  <div className="col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Hours</dt>
                    <dd className="mt-1 text-base text-gray-900">{log.hours ? `${log.hours.toFixed(2)}` : '-'}</dd>
                  </div>
                  <div className="col-span-1 flex items-end justify-end">
                    <Link
                      href={`/employee/hours/${log.id}`}
                      className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-indigo-600 shadow-sm hover:bg-gray-50"
                    >
                      View Details
                    </Link>
                  </div>
                </dl>
                {log.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <dt className="text-sm font-medium text-gray-500">Notes</dt>
                    <dd className="mt-1 text-sm text-gray-900 line-clamp-2">{log.notes}</dd>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 