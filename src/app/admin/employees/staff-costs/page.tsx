'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import Link from 'next/link';

// Helper function to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

type Employee = {
  id: string;
  name: string;
  email: string;
  role: string;
  hourlyWage: number;
  hours: number;
  cost: number;
};

type SummaryData = {
  totalEmployees: number;
  totalHours: number;
  totalCost: number;
  averageHourlyWage: number;
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
};

type StaffCostsData = {
  employees: Employee[];
  summary: SummaryData;
};

export default function StaffCostsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [staffCosts, setStaffCosts] = useState<StaffCostsData | null>(null);
  const [period, setPeriod] = useState('month');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const currentPeriod = searchParams.get('period') || 'month';
    setPeriod(currentPeriod);
    fetchStaffCosts(currentPeriod);
  }, [searchParams]);

  const fetchStaffCosts = async (selectedPeriod: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/hour-logs/labor-costs?period=${selectedPeriod}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch staff costs');
      }
      
      const data = await response.json();
      setStaffCosts(data);
    } catch (error) {
      console.error('Error fetching staff costs:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while fetching staff costs data');
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (value: string) => {
    router.push(`/admin/employees/staff-costs?period=${value}`);
  };

  // Format date range for display
  const getDateRangeDisplay = (summary?: SummaryData) => {
    if (!summary) return '';
    
    const start = new Date(summary.dateRange.start);
    const end = new Date(summary.dateRange.end);
    
    return `${format(start, 'dd MMM yyyy')} - ${format(end, 'dd MMM yyyy')}`;
  };

  // Get title for the current period
  const getPeriodTitle = (period: string) => {
    switch (period) {
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'year':
        return 'Year to Date';
      case 'all':
        return 'All Time';
      case 'prev-week':
        return 'Last Week';
      case 'prev-month':
        return 'Last Month';
      case 'prev-year':
        return 'Last Year';
      default:
        return 'This Month';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Staff Costs</h1>
      </div>

      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/admin/employees"
          className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-900"
        >
          <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Employees
        </Link>
      </div>
      
      <div className="flex justify-between items-center my-6">
        <h2 className="text-2xl font-bold">
          Staff Labor Costs - {getPeriodTitle(period)}
        </h2>
        
        {/* Period Tabs */}
        <div className="bg-white rounded-md shadow p-1">
          <div className="flex space-x-1">
            <button
              onClick={() => handlePeriodChange('week')}
              className={`px-3 py-1.5 text-sm rounded-md ${
                period === 'week' 
                  ? 'bg-indigo-100 text-indigo-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => handlePeriodChange('month')}
              className={`px-3 py-1.5 text-sm rounded-md ${
                period === 'month' 
                  ? 'bg-indigo-100 text-indigo-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => handlePeriodChange('year')}
              className={`px-3 py-1.5 text-sm rounded-md ${
                period === 'year' 
                  ? 'bg-indigo-100 text-indigo-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Year to Date
            </button>
            <button
              onClick={() => handlePeriodChange('all')}
              className={`px-3 py-1.5 text-sm rounded-md ${
                period === 'all' 
                  ? 'bg-indigo-100 text-indigo-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All Time
            </button>
          </div>
        </div>
      </div>

      {/* Error message */}
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
                <p className="mt-1">Make sure employees have hour logs and hourly wages set up properly.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Hours Card */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="mb-2">
            <p className="text-sm text-gray-500">Total Hours</p>
            <h3 className="text-2xl font-semibold">
              {loading ? (
                <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                staffCosts?.summary.totalHours.toFixed(1) || '0'
              )}
            </h3>
          </div>
          <p className="text-sm text-gray-500">
            {staffCosts?.summary ? getDateRangeDisplay(staffCosts.summary) : ''}
          </p>
        </div>
        
        {/* Total Labor Cost Card */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="mb-2">
            <p className="text-sm text-gray-500">Total Labor Cost</p>
            <h3 className="text-2xl font-semibold">
              {loading ? (
                <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                formatCurrency(staffCosts?.summary?.totalCost || 0)
              )}
            </h3>
          </div>
          <p className="text-sm text-gray-500">
            {staffCosts?.summary ? getDateRangeDisplay(staffCosts.summary) : ''}
          </p>
        </div>
        
        {/* Average Hourly Wage Card */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="mb-2">
            <p className="text-sm text-gray-500">Average Hourly Wage</p>
            <h3 className="text-2xl font-semibold">
              {loading ? (
                <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                formatCurrency(staffCosts?.summary?.averageHourlyWage || 0)
              )}
            </h3>
          </div>
          <p className="text-sm text-gray-500">
            Across {staffCosts?.summary?.totalEmployees || 0} employee(s)
          </p>
        </div>
      </div>
      
      {/* Staff Costs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Employee Labor Costs</h3>
          <p className="mt-1 text-sm text-gray-500">
            Breakdown of labor costs by employee based on logged hours
          </p>
        </div>
        <div className="px-4 py-4">
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 w-full bg-gray-200 animate-pulse rounded"></div>
              ))}
            </div>
          ) : error ? (
            <div className="py-4 text-center text-sm text-gray-500">
              Unable to load employee labor costs data.
            </div>
          ) : staffCosts?.employees && staffCosts.employees.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hours
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hourly Wage
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Labor Cost
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {staffCosts.employees.map((employee) => (
                    <tr key={employee.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{employee.name}</div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {employee.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.hours.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(employee.hourlyWage)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                        {formatCurrency(employee.cost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-4 text-center text-sm text-gray-500">
              No logged hours found for this period
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 