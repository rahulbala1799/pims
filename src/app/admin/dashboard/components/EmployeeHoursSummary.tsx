'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface HourSummary {
  totalHours: number;
  unpaidHours: number;
  employeeCount: number;
}

export default function EmployeeHoursSummary() {
  const [summary, setSummary] = useState<HourSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        // Fetch all hour logs
        const response = await fetch('/api/hour-logs');
        
        if (!response.ok) {
          throw new Error('Failed to fetch hour logs');
        }
        
        const hourLogs = await response.json();
        
        // Calculate summary statistics
        const totalHours = hourLogs.reduce((total: number, log: any) => total + (log.hours || 0), 0);
        const unpaidHours = hourLogs
          .filter((log: any) => !log.isPaid)
          .reduce((total: number, log: any) => total + (log.hours || 0), 0);
        
        // Get unique employee count
        const uniqueEmployees = new Set(hourLogs.map((log: any) => log.userId));
        
        setSummary({
          totalHours,
          unpaidHours,
          employeeCount: uniqueEmployees.size
        });
      } catch (err) {
        console.error('Error fetching hour logs summary:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900">Employee Hours</h3>
        <div className="mt-2 text-sm text-red-600">
          {error || 'Unable to load hour summary'}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Employee Hours</h3>
          <Link 
            href="/admin/employee-hours" 
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View all
          </Link>
        </div>
        
        <dl className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="flex flex-col">
            <dt className="text-sm font-medium text-gray-500">Total Hours</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {summary.totalHours.toFixed(1)}
            </dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-sm font-medium text-gray-500">Unpaid Hours</dt>
            <dd className="mt-1 text-3xl font-semibold text-indigo-600">
              {summary.unpaidHours.toFixed(1)}
            </dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-sm font-medium text-gray-500">Active Employees</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {summary.employeeCount}
            </dd>
          </div>
        </dl>
        
        {summary.unpaidHours > 0 && (
          <div className="mt-4 bg-yellow-50 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Attention needed</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    You have {summary.unpaidHours.toFixed(1)} unpaid hours that need approval.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 