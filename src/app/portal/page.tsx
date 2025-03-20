'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FiPlus, 
  FiShoppingCart, 
  FiFileText, 
  FiClock, 
  FiPackage, 
  FiAlertCircle,
  FiArrowRight,
  FiTruck
} from 'react-icons/fi';

interface DashboardStats {
  pendingOrders: number;
  inProductionJobs: number;
  readyForDeliveryJobs: number;
  pendingInvoices: number;
  mostOrderedProducts: {
    name: string;
    count: number;
  }[];
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  date: string;
  status: string;
  totalAmount: number;
  itemCount: number;
}

export default function PortalDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    pendingOrders: 0,
    inProductionJobs: 0,
    readyForDeliveryJobs: 0,
    pendingInvoices: 0,
    mostOrderedProducts: []
  });
  
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // In a real implementation, this would be an API call
    // Simulate API call with mock data
    setTimeout(() => {
      setStats({
        pendingOrders: 3,
        inProductionJobs: 5,
        readyForDeliveryJobs: 2,
        pendingInvoices: 4,
        mostOrderedProducts: [
          { name: 'Business Cards', count: 25 },
          { name: 'Brochures', count: 18 },
          { name: 'Banners', count: 12 },
        ]
      });
      
      setRecentOrders([
        {
          id: '1',
          orderNumber: 'PO-1234',
          date: '2023-11-20',
          status: 'Processing',
          totalAmount: 345.60,
          itemCount: 3
        },
        {
          id: '2',
          orderNumber: 'PO-1235',
          date: '2023-11-15',
          status: 'Completed',
          totalAmount: 129.99,
          itemCount: 2
        },
        {
          id: '3',
          orderNumber: 'PO-1236',
          date: '2023-11-10',
          status: 'Delivered',
          totalAmount: 864.75,
          itemCount: 5
        }
      ]);
      
      setIsLoading(false);
    }, 1000);
  }, []);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-indigo-100 text-indigo-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Customer Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here's an overview of your orders and account.
        </p>
      </div>
      
      {/* Quick action buttons */}
      <div className="mb-8">
        <Link
          href="/portal/orders/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <FiPlus className="-ml-1 mr-2 h-4 w-4" /> Place New Order
        </Link>
      </div>
      
      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                <FiShoppingCart className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Orders</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.pendingOrders}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link href="/portal/orders?status=pending" className="font-medium text-indigo-600 hover:text-indigo-500">
                View all
              </Link>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <FiClock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">In Production</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.inProductionJobs}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link href="/portal/orders?status=production" className="font-medium text-indigo-600 hover:text-indigo-500">
                View all
              </Link>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <FiTruck className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Ready for Delivery</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.readyForDeliveryJobs}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link href="/portal/orders?status=ready" className="font-medium text-indigo-600 hover:text-indigo-500">
                View all
              </Link>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                <FiFileText className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Invoices</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.pendingInvoices}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link href="/portal/invoices?status=pending" className="font-medium text-indigo-600 hover:text-indigo-500">
                View all
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent orders */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Orders</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {recentOrders.map((order) => (
              <li key={order.id}>
                <Link href={`/portal/orders/${order.id}`} className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-indigo-600 truncate">{order.orderNumber}</p>
                        <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="text-sm text-gray-500">{formatCurrency(order.totalAmount)}</p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          <FiPackage className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          Ordered on {new Date(order.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
            <span className="text-sm text-gray-500">
              Showing <span className="font-medium">{recentOrders.length}</span> orders
            </span>
            <Link href="/portal/orders" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500">
              View all orders
              <FiArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
      
      {/* Most ordered products */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Most Ordered Products</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {stats.mostOrderedProducts.map((product, index) => (
              <li key={index}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                        {product.count} orders
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="bg-gray-50 px-4 py-3 text-right">
            <Link href="/portal/products" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500">
              Browse all products
              <FiArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 