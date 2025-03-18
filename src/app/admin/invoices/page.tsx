'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Customer {
  id: string;
  name: string;
  email: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer: Customer;
  issueDate: string;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  invoiceItems: InvoiceItem[];
  createdAt: string;
}

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering and sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [customers, setCustomers] = useState<{id: string, name: string}[]>([]);
  const [customerFilter, setCustomerFilter] = useState<string>('ALL');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [invoicesPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const indexOfLastInvoice = currentPage * invoicesPerPage;
  const indexOfFirstInvoice = indexOfLastInvoice - invoicesPerPage;
  const currentInvoices = filteredInvoices.slice(indexOfFirstInvoice, indexOfLastInvoice);
  
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/invoices');
        
        if (!response.ok) {
          throw new Error('Failed to fetch invoices');
        }
        
        const data = await response.json();
        
        // Process invoices to ensure all numeric values are numbers
        const processedInvoices = data.map((invoice: any) => ({
          ...invoice,
          subtotal: typeof invoice.subtotal === 'number' ? invoice.subtotal : Number(invoice.subtotal),
          taxRate: typeof invoice.taxRate === 'number' ? invoice.taxRate : Number(invoice.taxRate),
          taxAmount: typeof invoice.taxAmount === 'number' ? invoice.taxAmount : Number(invoice.taxAmount),
          totalAmount: typeof invoice.totalAmount === 'number' ? invoice.totalAmount : Number(invoice.totalAmount),
          invoiceItems: invoice.invoiceItems ? invoice.invoiceItems.map((item: any) => ({
            ...item,
            quantity: typeof item.quantity === 'number' ? item.quantity : Number(item.quantity),
            unitPrice: typeof item.unitPrice === 'number' ? item.unitPrice : Number(item.unitPrice),
            totalPrice: typeof item.totalPrice === 'number' ? item.totalPrice : Number(item.totalPrice)
          })) : []
        }));
        
        // Extract unique customers
        const customerMap = new Map<string, {id: string, name: string}>();
        processedInvoices.forEach((invoice: Invoice) => {
          if (invoice.customer && invoice.customerId) {
            customerMap.set(invoice.customerId, {
              id: invoice.customerId,
              name: invoice.customer.name
            });
          }
        });
        setCustomers(Array.from(customerMap.values()));
        
        setInvoices(processedInvoices);
        setFilteredInvoices(processedInvoices);
        setTotalPages(Math.ceil(processedInvoices.length / invoicesPerPage));
      } catch (err) {
        console.error('Error fetching invoices:', err);
        setError(err instanceof Error ? err.message : 'Failed to load invoices');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [invoicesPerPage]);
  
  // Apply filters and sorting whenever the dependencies change
  useEffect(() => {
    let result = [...invoices];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(invoice => 
        invoice.invoiceNumber.toLowerCase().includes(query) ||
        invoice.customer?.name.toLowerCase().includes(query) ||
        invoice.customer?.email.toLowerCase().includes(query)
      );
    }
    
    // Filter by status
    if (statusFilter !== 'ALL') {
      result = result.filter(invoice => invoice.status === statusFilter);
    }
    
    // Filter by customer
    if (customerFilter !== 'ALL') {
      result = result.filter(invoice => invoice.customerId === customerFilter);
    }
    
    // Filter by date
    if (startDateFilter && endDateFilter) {
      const start = new Date(startDateFilter).getTime();
      const end = new Date(endDateFilter).getTime();
      result = result.filter(invoice => {
        const issueDate = new Date(invoice.issueDate).getTime();
        return issueDate >= start && issueDate <= end;
      });
    }
    
    // Sort results
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'invoiceNumber':
          comparison = a.invoiceNumber.localeCompare(b.invoiceNumber);
          break;
        case 'customer':
          comparison = (a.customer?.name || '').localeCompare(b.customer?.name || '');
          break;
        case 'issueDate':
          comparison = new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
          break;
        case 'dueDate':
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'amount':
          comparison = a.totalAmount - b.totalAmount;
          break;
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    setFilteredInvoices(result);
    setTotalPages(Math.ceil(result.length / invoicesPerPage));
    setCurrentPage(1); // Reset to first page when filters change
  }, [invoices, searchQuery, statusFilter, sortBy, sortDirection, invoicesPerPage, customerFilter, startDateFilter, endDateFilter]);

  // Toggle sort when clicking column header
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  // Helper functions
  const formatNumber = (value: any, decimals = 2) => {
    const num = typeof value === 'number' ? value : Number(value);
    return isNaN(num) ? '0.00' : num.toFixed(decimals);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle deleting an invoice
  const handleDeleteInvoice = async (id: string, invoiceNumber: string) => {
    if (!confirm(`Are you sure you want to cancel invoice #${invoiceNumber}? This action cannot be undone. Any associated jobs will be retained but their revenue will be set to 0.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to cancel invoice: ${response.statusText}`);
      }
      
      // Update local state to reflect the cancelled invoice
      const updatedInvoices = invoices.map(invoice => 
        invoice.id === id 
          ? { ...invoice, status: 'CANCELLED' as 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED', totalAmount: 0, taxAmount: 0, subtotal: 0 }
          : invoice
      );
      setInvoices(updatedInvoices);
      
      // Also update the filtered invoices
      setFilteredInvoices(
        filteredInvoices.map(invoice => 
          invoice.id === id 
            ? { ...invoice, status: 'CANCELLED' as 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED', totalAmount: 0, taxAmount: 0, subtotal: 0 }
            : invoice
        )
      );
      
      alert('Invoice cancelled successfully');
    } catch (err) {
      console.error('Error cancelling invoice:', err);
      alert(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  // Pagination controls
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Invoices</h1>
          <p className="mt-2 text-sm text-gray-700">
            Create and manage invoices for customers.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/admin/invoices/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            Create Invoice
          </Link>
        </div>
      </div>
      
      {/* Filters and search */}
      <div className="mt-6 bg-white shadow overflow-hidden rounded-lg p-4">
        <h2 className="text-lg font-medium text-gray-900 mb-3">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Search by invoice number or customer"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
            <select
              id="customer"
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="ALL">All Customers</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setSortDirection('desc');
              }}
              className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="createdAt">Date Created</option>
              <option value="invoiceNumber">Invoice Number</option>
              <option value="customer">Customer</option>
              <option value="issueDate">Issue Date</option>
              <option value="dueDate">Due Date</option>
              <option value="status">Status</option>
              <option value="amount">Amount</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Issue Date From</label>
            <input
              type="date"
              id="startDate"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">Issue Date To</label>
            <input
              type="date"
              id="endDate"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="direction" className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
            <select
              id="direction"
              value={sortDirection}
              onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
              className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setCustomerFilter('ALL');
                setStartDateFilter('');
                setEndDateFilter('');
                setSortBy('createdAt');
                setSortDirection('desc');
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>
      
      {/* Invoices table */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-white shadow overflow-hidden rounded-lg p-6 mt-6">
          <div className="text-center py-6">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading invoices</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <div className="mt-6">
              <button
                onClick={() => router.refresh()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      ) : filteredInvoices.length === 0 && searchQuery ? (
        <div className="bg-white shadow overflow-hidden rounded-lg p-6 mt-6">
          <div className="text-center py-6">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No matching invoices found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
            <div className="mt-6">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Clear filters
              </button>
            </div>
          </div>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="bg-white shadow overflow-hidden rounded-lg p-6 mt-6">
          <div className="text-center py-6">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices yet</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new invoice.</p>
            <div className="mt-6">
              <Link
                href="/admin/invoices/new"
                className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Create Invoice
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('invoiceNumber')}
                >
                  <div className="flex items-center">
                    <span>Invoice Number</span>
                    {sortBy === 'invoiceNumber' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('customer')}
                >
                  <div className="flex items-center">
                    <span>Customer</span>
                    {sortBy === 'customer' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('issueDate')}
                >
                  <div className="flex items-center">
                    <span>Issue Date</span>
                    {sortBy === 'issueDate' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('dueDate')}
                >
                  <div className="flex items-center">
                    <span>Due Date</span>
                    {sortBy === 'dueDate' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    <span>Status</span>
                    {sortBy === 'status' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center justify-end">
                    <span>Amount</span>
                    {sortBy === 'amount' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {currentInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-indigo-600 sm:pl-6">
                    <Link href={`/admin/invoices/${invoice.id}`} className="hover:underline">
                      {invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-800">
                    <div>{invoice.customer?.name || 'Unknown'}</div>
                    <div className="text-gray-500 text-xs">{invoice.customer?.email || ''}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {formatDate(invoice.issueDate)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {formatDate(invoice.dueDate)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusClasses(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 text-right font-medium">
                    £{formatNumber(invoice.totalAmount)}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <div className="flex justify-end space-x-2">
                      <Link
                        href={`/admin/invoices/${invoice.id}`}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/invoices/${invoice.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteInvoice(invoice.id, invoice.invoiceNumber)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination */}
          {filteredInvoices.length > 0 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{indexOfFirstInvoice + 1}</span> to <span className="font-medium">
                      {Math.min(indexOfLastInvoice, filteredInvoices.length)}
                    </span> of <span className="font-medium">{filteredInvoices.length}</span> invoices
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={prevPage}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === 1 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const pageNum = currentPage <= 3 
                        ? i + 1 
                        : currentPage >= totalPages - 2 
                          ? totalPages - 4 + i 
                          : currentPage - 2 + i;
                      
                      if (pageNum <= 0 || pageNum > totalPages) return null;
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => paginate(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === totalPages 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 