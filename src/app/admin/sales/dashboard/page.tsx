'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowUpIcon, 
  ArrowDownIcon,
  CurrencyEuroIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';

export default function SalesDashboardPage() {
  const [timeframe, setTimeframe] = useState('month');
  const [loading, setLoading] = useState(false);

  // Mock data for now - in production this would fetch from an API
  const salesData = {
    totalRevenue: 152480.75,
    growth: 12.8,
    averageOrderValue: 1876.30,
    orderCount: 78,
    newCustomers: 8,
    salesEmployees: 5,
    topSellingProducts: [
      { id: 1, name: 'Business Cards', revenue: 28750.50, growth: 15.2 },
      { id: 2, name: 'Brochures', revenue: 22450.25, growth: 7.8 },
      { id: 3, name: 'Banners', revenue: 18950.00, growth: -2.5 },
      { id: 4, name: 'Posters', revenue: 15830.75, growth: 22.1 },
      { id: 5, name: 'Leaflets', revenue: 12500.00, growth: 5.3 }
    ],
    topSalesEmployees: [
      { id: 1, name: 'Maria Garcia', sales: 48250.00, ordersCompleted: 22 },
      { id: 2, name: 'John Smith', sales: 32750.50, ordersCompleted: 17 },
      { id: 3, name: 'Sarah Johnson', sales: 28900.75, ordersCompleted: 14 },
      { id: 4, name: 'David Brown', sales: 22580.50, ordersCompleted: 11 },
      { id: 5, name: 'Lisa Wong', sales: 19999.00, ordersCompleted: 9 }
    ],
    recentOrders: [
      { id: 'ORD-1234', customer: 'Acme Corp', date: '2023-10-05', amount: 4520.00, status: 'Completed' },
      { id: 'ORD-1233', customer: 'TechStart Ltd', date: '2023-10-03', amount: 2150.75, status: 'In Progress' },
      { id: 'ORD-1232', customer: 'Global Designs', date: '2023-10-01', amount: 3750.50, status: 'Completed' },
      { id: 'ORD-1231', customer: 'Local Cafe', date: '2023-09-29', amount: 950.25, status: 'Completed' },
      { id: 'ORD-1230', customer: 'City Council', date: '2023-09-28', amount: 6820.00, status: 'In Progress' }
    ]
  };

  // Apply loading effect when timeframe changes
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [timeframe]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Sales Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Overview of sales performance, trends, and metrics.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <div className="flex space-x-3">
            <Link
              href="/admin/sales-employees"
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Sales Team
            </Link>
            <Link
              href="/admin/sales/reports"
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Reports
            </Link>
          </div>
        </div>
      </div>

      {/* Time Period Selector */}
      <div className="flex justify-end mt-6">
        <div className="inline-flex shadow-sm rounded-md">
          <button
            type="button"
            onClick={() => setTimeframe('week')}
            className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
              timeframe === 'week' ? 'bg-indigo-500 text-white' : 'bg-white text-gray-700'
            }`}
          >
            Week
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('month')}
            className={`relative inline-flex items-center px-4 py-2 border-t border-b border-gray-300 text-sm font-medium ${
              timeframe === 'month' ? 'bg-indigo-500 text-white' : 'bg-white text-gray-700'
            }`}
          >
            Month
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('quarter')}
            className={`relative inline-flex items-center px-4 py-2 border-t border-b border-gray-300 text-sm font-medium ${
              timeframe === 'quarter' ? 'bg-indigo-500 text-white' : 'bg-white text-gray-700'
            }`}
          >
            Quarter
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('year')}
            className={`relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
              timeframe === 'year' ? 'bg-indigo-500 text-white' : 'bg-white text-gray-700'
            }`}
          >
            Year
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Revenue Card */}
        <div className={`bg-white overflow-hidden shadow rounded-lg transition-opacity ${loading ? 'opacity-60' : 'opacity-100'}`}>
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                <CurrencyEuroIcon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{formatCurrency(salesData.totalRevenue)}</div>
                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${salesData.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {salesData.growth >= 0 ? (
                        <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDownIcon className="self-center flex-shrink-0 h-4 w-4 text-red-500" />
                      )}
                      <span className="ml-1">{Math.abs(salesData.growth)}%</span>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Card */}
        <div className={`bg-white overflow-hidden shadow rounded-lg transition-opacity ${loading ? 'opacity-60' : 'opacity-100'}`}>
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <ShoppingCartIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Orders</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{salesData.orderCount}</div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                      <span className="ml-1">8.2%</span>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Average Order Value Card */}
        <div className={`bg-white overflow-hidden shadow rounded-lg transition-opacity ${loading ? 'opacity-60' : 'opacity-100'}`}>
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <ChartBarIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg. Order Value</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{formatCurrency(salesData.averageOrderValue)}</div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                      <span className="ml-1">3.5%</span>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* New Customers Card */}
        <div className={`bg-white overflow-hidden shadow rounded-lg transition-opacity ${loading ? 'opacity-60' : 'opacity-100'}`}>
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <UserGroupIcon className="h-6 w-6 text-yellow-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">New Customers</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{salesData.newCustomers}</div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-red-600">
                      <ArrowDownIcon className="self-center flex-shrink-0 h-4 w-4 text-red-500" />
                      <span className="ml-1">4.1%</span>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products & Sales Employees */}
      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Top Products */}
        <div className={`bg-white shadow sm:rounded-lg transition-opacity ${loading ? 'opacity-60' : 'opacity-100'}`}>
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Top Selling Products</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="flow-root">
              <ul className="-my-5 divide-y divide-gray-200">
                {salesData.topSellingProducts.map((product) => (
                  <li key={product.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500">{formatCurrency(product.revenue)}</p>
                        </div>
                      </div>
                      <div className={`flex items-center text-sm font-medium ${product.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {product.growth >= 0 ? (
                          <ArrowUpIcon className="mr-1.5 h-4 w-4 flex-shrink-0" />
                        ) : (
                          <ArrowDownIcon className="mr-1.5 h-4 w-4 flex-shrink-0" />
                        )}
                        {Math.abs(product.growth)}%
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Top Sales Employees */}
        <div className={`bg-white shadow sm:rounded-lg transition-opacity ${loading ? 'opacity-60' : 'opacity-100'}`}>
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Top Sales Employees</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="flow-root">
              <ul className="-my-5 divide-y divide-gray-200">
                {salesData.topSalesEmployees.map((employee) => (
                  <li key={employee.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                          <p className="text-sm text-gray-500">{formatCurrency(employee.sales)} • {employee.ordersCompleted} orders</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        <Link href={`/admin/employees/${employee.id}`} className="text-indigo-600 hover:text-indigo-900">
                          View
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className={`mt-8 bg-white shadow sm:rounded-lg transition-opacity ${loading ? 'opacity-60' : 'opacity-100'}`}>
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">View</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salesData.recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                    {order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.customer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(order.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      order.status === 'Completed' 
                        ? 'bg-green-100 text-green-800' 
                        : order.status === 'In Progress' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href="#" className="text-indigo-600 hover:text-indigo-900">
                      View
                    </a>
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