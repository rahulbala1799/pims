'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ClockIcon, CalendarDaysIcon, PencilIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

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
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Hour Log Details</h1>
          </div>
          <Link 
            href="/employee/hours" 
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 flex items-center"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Back
          </Link>
        </div>
        
        <div className="rounded-lg bg-red-50 p-4">
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
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Hour Log Details</h1>
        </div>
        <Link 
          href="/employee/hours" 
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 flex items-center"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-1" />
          Back
        </Link>
      </div>
      
      {error && (
        <div className="rounded-lg bg-red-50 p-4 mb-6">
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
        <div className="mb-6 bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex items-center">
              <ClockIcon className="h-6 w-6 text-indigo-500 mr-2" />
              <h3 className="text-lg leading-6 font-medium text-gray-900">Edit Hour Log</h3>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Update your working hours for this log.
            </p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleUpdateLog} className="space-y-6">
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
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-12 sm:h-10 text-base"
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
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-12 sm:h-10 text-base"
                      required={includeEndTime}
                    >
                      {generateTimeOptions().map((time) => (
                        <option key={`end-${time}`} value={time} className="py-2">
                          {format(new Date(`2000-01-01T${time}:00`), 'h:mm a')}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="w-full sm:w-auto py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full sm:w-auto py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <>
          {/* Hour log details */}
          <div className="overflow-hidden bg-white shadow-lg rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CalendarDaysIcon className="h-6 w-6 text-indigo-500 mr-2" />
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    {formatDate(hourLog.date)}
                  </h3>
                </div>
                <div>
                  {hourLog.isPaid ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      Paid
                    </span>
                  ) : !hourLog.endTime ? (
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
            </div>
            <div className="border-b border-gray-200">
              <dl className="py-4 px-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <dt className="text-sm font-medium text-gray-500">Start time</dt>
                    <dd className="mt-1 text-lg font-medium text-gray-900">
                      {formatTime(hourLog.startTime)}
                    </dd>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <dt className="text-sm font-medium text-gray-500">End time</dt>
                    <dd className="mt-1 text-lg font-medium text-gray-900">
                      {hourLog.endTime ? formatTime(hourLog.endTime) : 'Not completed'}
                    </dd>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <dt className="text-sm font-medium text-gray-500">Duration</dt>
                    <dd className="mt-1 text-lg font-medium text-gray-900">
                      {hourLog.hours ? `${hourLog.hours.toFixed(2)} hours` : 'Not calculated'}
                    </dd>
                  </div>
                </div>
              </dl>
            </div>
            <div className="px-4 py-4">
              <div className="mb-3">
                <h4 className="text-base font-medium text-gray-700 mb-2">Notes</h4>
                {isEditingNotes ? (
                  <div className="space-y-3">
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base py-3 px-4"
                      rows={4}
                      placeholder="Add notes about this time log..."
                    />
                    <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditNotes(hourLog.notes || '');
                          setIsEditingNotes(false);
                        }}
                        className="w-full sm:w-auto py-2 px-4 border border-gray-300 rounded-lg text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleUpdateNotes}
                        className="w-full sm:w-auto py-2 px-4 border border-transparent rounded-lg text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        Save Notes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="text-base text-gray-900 whitespace-pre-wrap">
                        {hourLog.notes || 'No notes added'}
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsEditingNotes(true)}
                        className="ml-2 inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="px-4 py-4 sm:px-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center justify-center w-full sm:w-auto py-3 px-4 border border-gray-300 rounded-lg text-base font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
                >
                  <PencilIcon className="h-5 w-5 mr-2" />
                  Edit Times
                </button>
                <button
                  type="button"
                  onClick={handleDeleteLog}
                  disabled={isDeleting}
                  className="inline-flex items-center justify-center w-full sm:w-auto py-3 px-4 border border-transparent rounded-lg text-base font-medium text-white bg-red-600 hover:bg-red-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  <TrashIcon className="h-5 w-5 mr-2" />
                  {isDeleting ? 'Deleting...' : 'Delete Log'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 