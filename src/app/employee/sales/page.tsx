'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistance } from 'date-fns';

interface SalesData {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  recentSales: Array<{
    id: string;
    customer: string;
    amount: number;
    date: string;
    status: string;
  }>;
}

export default function SalesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSalesEmployee, setIsSalesEmployee] = useState(false);
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('month'); // 'week', 'month', 'year', 'all'

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Get employee user from localStorage
        const userData = localStorage.getItem('employeeUser');
        if (!userData) {
          router.push('/login/employee');
          return;
        }

        const user = JSON.parse(userData);
        
        // Check if user is a sales employee
        const response = await fetch(`/api/employees/${user.id}/sales-status/check`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to check sales access');
        }
        
        setIsSalesEmployee(data.isSalesEmployee);
        
        if (!data.isSalesEmployee) {
          setError('You do not have access to the sales dashboard.');
          setIsLoading(false);
          return;
        }
        
        // Mock data for now - would be replaced with actual API calls
        setSalesData({
          totalSales: 42580.50,
          totalOrders: 24,
          averageOrderValue: 1774.19,
          recentSales: [
            {
              id: 'INV-0012',
              customer: 'Acme Corp',
              amount: 5420.75,
              date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'Paid'
            },
            {
              id: 'INV-0011',
              customer: 'Globex Inc',
              amount: 3780.00,
              date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'Pending'
            },
            {
              id: 'INV-0010',
              customer: 'Wayne Enterprises',
              amount: 8950.25,
              date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'Paid'
            },
            {
              id: 'INV-0009',
              customer: 'Stark Industries',
              amount: 6125.50,
              date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'Overdue'
            }
          ]
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking sales access:', error);
        setError('An error occurred while loading the sales dashboard.');
        setIsLoading(false);
      }
    };
    
    checkAccess();
  }, [router]);

  // Function to handle period change
  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    // In a real implementation, you would fetch new data based on the period
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !isSalesEmployee) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">{error || 'You do not have permission to view this page.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Sales Dashboard</h1>
        
        {/* Period selector */}
        <div className="flex items-center space-x-2 bg-white shadow rounded-md p-1">
          <button
            onClick={() => handlePeriodChange('week')}
            className={`px-3 py-1 text-sm rounded-md ${
              period === 'week' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => handlePeriodChange('month')}
            className={`px-3 py-1 text-sm rounded-md ${
              period === 'month' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => handlePeriodChange('year')}
            className={`px-3 py-1 text-sm rounded-md ${
              period === 'year' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Year
          </button>
          <button
            onClick={() => handlePeriodChange('all')}
            className={`px-3 py-1 text-sm rounded-md ${
              period === 'all' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            All Time
          </button>
        </div>
      </div>
      
      {/* Statistics Cards */}
      {salesData && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Total Sales Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Sales</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{formatCurrency(salesData.totalSales)}</dd>
            </div>
          </div>
          
          {/* Total Orders Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{salesData.totalOrders}</dd>
            </div>
          </div>
          
          {/* Average Order Value Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Average Order Value</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{formatCurrency(salesData.averageOrderValue)}</dd>
            </div>
          </div>
        </div>
      )}
      
      {/* Recent Sales Table */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Sales</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salesData?.recentSales.map((sale) => (
                <tr key={sale.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                    {sale.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sale.customer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(sale.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDistance(new Date(sale.date), new Date(), { addSuffix: true })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      sale.status === 'Paid' 
                        ? 'bg-green-100 text-green-800' 
                        : sale.status === 'Pending' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {sale.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 