'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { FiDownload, FiEye, FiFileText, FiDollarSign, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

// Invoice type definition
interface InvoiceItem {
  id: string;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  notes: string | null;
  invoiceItems: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export default function InvoicesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all'
  });

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'PAID':
        return (
          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            <FiCheckCircle className="mr-1 h-3 w-3 mt-0.5" /> Paid
          </p>
        );
      case 'PENDING':
        return (
          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            <FiDollarSign className="mr-1 h-3 w-3 mt-0.5" /> Outstanding
          </p>
        );
      case 'OVERDUE':
        return (
          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            <FiAlertCircle className="mr-1 h-3 w-3 mt-0.5" /> Overdue
          </p>
        );
      case 'CANCELLED':
        return (
          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            Cancelled
          </p>
        );
      default:
        return (
          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            {status}
          </p>
        );
    }
  };

  // Fetch invoices from API
  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('portalToken');
        if (!token) {
          throw new Error('Authentication required');
        }
        
        const response = await fetch('/api/portal/invoices', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch invoices');
        }
        
        const data = await response.json();
        setInvoices(data);
        setFilteredInvoices(data);
      } catch (err: any) {
        console.error('Error fetching invoices:', err);
        setError(err.message || 'Failed to load invoices');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInvoices();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    if (!invoices.length) return;
    
    let result = [...invoices];
    
    // Filter by status
    if (filters.status !== 'all') {
      result = result.filter(invoice => 
        invoice.status.toLowerCase() === filters.status.toUpperCase()
      );
    }
    
    // Filter by date range
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      switch (filters.dateRange) {
        case 'last_30':
          startDate.setDate(now.getDate() - 30);
          break;
        case 'last_90':
          startDate.setDate(now.getDate() - 90);
          break;
        case 'last_year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      result = result.filter(invoice => {
        const invoiceDate = new Date(invoice.issueDate);
        return invoiceDate >= startDate && invoiceDate <= now;
      });
    }
    
    setFilteredInvoices(result);
  }, [filters, invoices]);

  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Apply filters button handler
  const applyFilters = () => {
    // Filters are already applied via useEffect
    // This is just to provide UX feedback
    console.log('Filters applied:', filters);
  };
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and download your invoices
        </p>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Invoice filters */}
      <div className="bg-white shadow p-4 sm:p-5 sm:rounded-md mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Filter Invoices</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Outstanding</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <select
              id="dateRange"
              name="dateRange"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={filters.dateRange}
              onChange={handleFilterChange}
            >
              <option value="all">All Time</option>
              <option value="last_30">Last 30 Days</option>
              <option value="last_90">Last 90 Days</option>
              <option value="last_year">Last Year</option>
            </select>
          </div>
          
          <div className="lg:flex items-end">
            <button
              type="button"
              onClick={applyFilters}
              className="w-full lg:w-auto mt-6 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
      
      {/* Invoices table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Your Invoices</h3>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="px-4 py-12 text-center border-b border-gray-200">
            <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {invoices.length === 0 
                ? "You don't have any invoices yet."
                : "No invoices match your current filters."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredInvoices.map((invoice) => (
              <li key={invoice.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-indigo-600 truncate">
                      Invoice #{invoice.invoiceNumber}
                    </p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <StatusBadge status={invoice.status} />
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {invoice.notes ? invoice.notes.split('\n')[0] : 'No order reference'}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>
                        {formatDate(invoice.issueDate)} • {formatCurrency(invoice.totalAmount)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end space-x-2">
                    <Link 
                      href={`/portal/invoices/${invoice.id}`}
                      className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <FiEye className="mr-1 h-3 w-3" /> View
                    </Link>
                    <button
                      type="button"
                      className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <FiDownload className="mr-1 h-3 w-3" /> Download PDF
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 