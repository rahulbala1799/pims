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
  isPaid: boolean;
  notes: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function HourLogDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  
  const [hourLog, setHourLog] = useState<HourLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [editNotes, setEditNotes] = useState<string>('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  
  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStartTime, setSelectedStartTime] = useState('');
  const [selectedEndTime, setSelectedEndTime] = useState('');
  const [includeEndTime, setIncludeEndTime] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Get user data from localStorage
  useEffect(() => {
    const storedUserData = localStorage.getItem('employeeUser');
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }
  }, []);
  
  // Fetch the hour log
  const fetchHourLog = async () => {
    if (!id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/hour-logs?id=${id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch hour log');
      }
      
      if (Array.isArray(data) && data.length > 0) {
        setHourLog(data[0]);
        setEditNotes(data[0].notes || '');
        
        // Initialize edit form values from the hour log
        const startDate = new Date(data[0].startTime);
        setSelectedDate(format(startDate, 'yyyy-MM-dd'));
        setSelectedStartTime(format(startDate, 'HH:mm'));
        
        if (data[0].endTime) {
          const endDate = new Date(data[0].endTime);
          setSelectedEndTime(format(endDate, 'HH:mm'));
          setIncludeEndTime(true);
        } else {
          setSelectedEndTime('17:00'); // Default end time
          setIncludeEndTime(false);
        }
      } else {
        throw new Error('Hour log not found');
      }
    } catch (err) {
      console.error('Error fetching hour log:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch log on component mount
  useEffect(() => {
    if (id) {
      fetchHourLog();
    }
  }, [id]);
  
  // Delete the hour log
  const handleDeleteLog = async () => {
    if (!hourLog || isDeleting) return;
    
    if (!confirm('Are you sure you want to delete this hour log? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/hour-logs?id=${hourLog.id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete hour log');
      }
      
      // Redirect back to the logs list
      router.push('/employee/hours');
    } catch (err) {
      console.error('Error deleting hour log:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Update notes
  const handleUpdateNotes = async () => {
    if (!hourLog || isEditingNotes) return;
    
    setIsEditingNotes(true);
    setError(null);
    
    try {
      const response = await fetch('/api/hour-logs', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: hourLog.id,
          notes: editNotes 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update notes');
      }
      
      setHourLog(data);
      setIsEditingNotes(false);
    } catch (err) {
      console.error('Error updating notes:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsEditingNotes(false);
    }
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
  
  // Update hour log
  const handleUpdateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hourLog || isUpdating) return;
    
    setIsUpdating(true);
    setError(null);
    
    try {
      // Construct datetime strings with selected date and times
      const startDateTime = `${selectedDate}T${selectedStartTime}:00`;
      let endDateTime = null;
      let hours = null;
      
      // Only calculate hours if end time is included
      if (includeEndTime && selectedEndTime) {
        endDateTime = `${selectedDate}T${selectedEndTime}:00`;
        
        // Calculate hours between start and end time
        const startMs = new Date(startDateTime).getTime();
        const endMs = new Date(endDateTime).getTime();
        const diffMs = endMs - startMs;
        
        // Don't allow negative hours
        if (diffMs <= 0) {
          throw new Error('End time must be after start time');
        }
        
        hours = diffMs / (1000 * 60 * 60);
      }
      
      const response = await fetch('/api/hour-logs', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: hourLog.id,
          startTime: startDateTime,
          endTime: endDateTime,
          hours: hours,
          date: selectedDate,
          isActive: false,
          notes: hourLog.notes 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update hour log');
      }
      
      setHourLog(data);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating hour log:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'EEEE, MMMM d, yyyy');
  };
  
  // Format time for display
  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a');
  };
  
  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (error || !hourLog) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Hour Log Details</h1>
          </div>
          <div className="flex space-x-3">
            <Link 
              href="/employee/hours" 
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Back to Hour Logs
            </Link>
          </div>
        </div>
        
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error || 'Hour log not found'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Hour Log Details</h1>
          <p className="mt-2 text-sm text-gray-700">
            View and manage your time log.
          </p>
        </div>
        <div className="flex space-x-3">
          <Link 
            href="/employee/hours" 
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Back to Hour Logs
          </Link>
        </div>
      </div>
      
      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
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
      
      {isEditing ? (
        <div className="mb-8 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Edit Hour Log</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Update your working hours for this log.
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <form onSubmit={handleUpdateLog} className="space-y-6">
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
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75"
                >
                  {isUpdating ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <>
          {/* Hour log details */}
          <div className="overflow-hidden bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Time Log - {formatDate(hourLog.date)}
              </h3>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Start time</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    {formatTime(hourLog.startTime)}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">End time</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    {hourLog.endTime ? formatTime(hourLog.endTime) : 'In progress'}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Duration</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    {hourLog.hours ? `${hourLog.hours.toFixed(2)} hours` : 'In progress'}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Notes</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    {isEditingNotes ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          rows={3}
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditNotes(hourLog.notes || '');
                              setIsEditingNotes(false);
                            }}
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleUpdateNotes}
                            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <div>{hourLog.notes || 'No notes added'}</div>
                        <button
                          type="button"
                          onClick={() => setIsEditingNotes(true)}
                          className="text-sm text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="px-4 py-4 sm:px-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Edit Times
              </button>
              <button
                type="button"
                onClick={handleDeleteLog}
                disabled={isDeleting}
                className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Log'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 