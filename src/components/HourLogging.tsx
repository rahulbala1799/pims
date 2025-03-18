'use client';

import { useState, useEffect } from 'react';
import { format, formatDistanceStrict } from 'date-fns';

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

interface HourLoggingProps {
  userId: string;
}

export default function HourLogging({ userId }: HourLoggingProps) {
  const [hourLogs, setHourLogs] = useState<HourLog[]>([]);
  const [activeLog, setActiveLog] = useState<HourLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStartingLog, setIsStartingLog] = useState(false);
  const [isStoppingLog, setIsStoppingLog] = useState(false);
  const [elapsedTime, setElapsedTime] = useState<string>('0:00:00');
  const [notes, setNotes] = useState<string>('');
  
  // Timer for active log
  useEffect(() => {
    if (!activeLog) return;
    
    const startTime = new Date(activeLog.startTime).getTime();
    
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
  }, [activeLog]);
  
  // Fetch hour logs
  const fetchHourLogs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch last 7 days of logs
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      
      const response = await fetch(`/api/hour-logs?userId=${userId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
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
  
  // Fetch logs on component mount and when userId changes
  useEffect(() => {
    if (!userId) return;
    fetchHourLogs();
  }, [userId]);
  
  // Start a new hour log
  const handleStartLog = async () => {
    if (isStartingLog) return;
    
    setIsStartingLog(true);
    setError(null);
    
    try {
      const response = await fetch('/api/hour-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId,
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
    } catch (err) {
      console.error('Error starting hour log:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsStartingLog(false);
    }
  };
  
  // Stop the active hour log
  const handleStopLog = async () => {
    if (!activeLog || isStoppingLog) return;
    
    setIsStoppingLog(true);
    setError(null);
    
    try {
      const response = await fetch('/api/hour-logs', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: activeLog.id,
          notes: activeLog.notes 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to stop hour log');
      }
      
      setActiveLog(null);
      fetchHourLogs(); // Refresh the list
    } catch (err) {
      console.error('Error stopping hour log:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsStoppingLog(false);
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
  
  // Format duration
  const formatDuration = (startTime: string, endTime: string | null) => {
    if (!endTime) return 'In progress';
    
    return formatDistanceStrict(
      new Date(startTime),
      new Date(endTime)
    );
  };
  
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Hour Logging</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Log your work hours for tracking and reporting.
        </p>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {activeLog ? (
        <div className="px-6 py-4 bg-indigo-50 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h4 className="text-md font-medium text-gray-900">Current Log</h4>
              <p className="text-sm text-gray-500">Started at {formatTime(activeLog.startTime)}</p>
              <p className="text-xl font-bold mt-1">{elapsedTime}</p>
              {activeLog.notes && (
                <p className="text-sm italic mt-1">Notes: {activeLog.notes}</p>
              )}
            </div>
            <button
              onClick={handleStopLog}
              disabled={isStoppingLog}
              className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {isStoppingLog ? 'Stopping...' : 'Stop Log'}
            </button>
          </div>
        </div>
      ) : (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
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
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
            <button
              onClick={handleStartLog}
              disabled={isStartingLog}
              className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isStartingLog ? 'Starting...' : 'Start New Log'}
            </button>
          </div>
        </div>
      )}
      
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
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                  </div>
                </td>
              </tr>
            ) : hourLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
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
                    {log.hours ? `${log.hours.toFixed(2)} hours` : formatDuration(log.startTime, log.endTime)}
                    {log.autoStopped && ' (Auto-stopped)'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.notes || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 