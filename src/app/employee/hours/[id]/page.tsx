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
  const [isStoppingLog, setIsStoppingLog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [elapsedTime, setElapsedTime] = useState<string>('');
  const [userData, setUserData] = useState<any>(null);
  const [editNotes, setEditNotes] = useState<string>('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  
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
  
  // Timer for active log
  useEffect(() => {
    if (!hourLog || !hourLog.isActive) return;
    
    const startTime = new Date(hourLog.startTime).getTime();
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const elapsed = now - startTime;
      
      // Format as HH:MM:SS
      const hours = Math.floor(elapsed / (1000 * 60 * 60));
      const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);
      
      setElapsedTime(
        `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);
    
    return () => clearInterval(timer);
  }, [hourLog]);
  
  // Stop the hour log
  const handleStopLog = async () => {
    if (!hourLog || !hourLog.isActive || isStoppingLog) return;
    
    setIsStoppingLog(true);
    setError(null);
    
    try {
      const response = await fetch('/api/hour-logs', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: hourLog.id,
          notes: hourLog.notes 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to stop hour log');
      }
      
      setHourLog(data);
    } catch (err) {
      console.error('Error stopping hour log:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsStoppingLog(false);
    }
  };
  
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
      const response = await fetch('/api/hour-logs/notes', {
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
      
      setHourLog({
        ...hourLog,
        notes: editNotes
      });
      setIsEditingNotes(false);
    } catch (err) {
      console.error('Error updating notes:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsEditingNotes(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'EEEE, MMMM d, yyyy');
  };
  
  // Format time for display
  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm:ss a');
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
      
      {/* Status indicator */}
      <div className={`mb-6 rounded-md ${hourLog.isActive ? 'bg-green-50' : 'bg-gray-50'} p-4`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <div className={`h-3 w-3 rounded-full ${hourLog.isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-800">
              {hourLog.isActive 
                ? 'This log is currently active' 
                : hourLog.autoStopped 
                ? 'This log was automatically stopped after 8 hours' 
                : 'This log is completed'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Hour log details */}
      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Time Log - {formatDate(hourLog.date)}
          </h3>
          {hourLog.isActive && (
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Current duration: <span className="font-semibold">{elapsedTime}</span>
            </p>
          )}
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
          {hourLog.isActive ? (
            <button
              type="button"
              onClick={handleStopLog}
              disabled={isStoppingLog}
              className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isStoppingLog ? 'Stopping...' : 'Stop Log'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDeleteLog}
              disabled={isDeleting}
              className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete Log'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 