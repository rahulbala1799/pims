'use client';

import Link from 'next/link';

export default function MobileInvoicesPage() {
  return (
    <div className="px-4 py-6">
      {/* Simplified breadcrumb for mobile */}
      <div className="flex items-center mb-4">
        <Link href="/admin/dashboard" className="text-indigo-600">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path>
          </svg>
        </Link>
        <h1 className="text-lg font-bold ml-2">Mobile Invoices</h1>
      </div>
      
      <p className="text-sm text-gray-600 mb-6">
        Create and manage invoices on mobile devices.
      </p>
      
      <div className="mb-6">
        <Link
          href="/admin/mobile-invoices/new"
          className="w-full flex justify-center items-center py-3 px-4 rounded-md bg-indigo-600 text-white font-medium shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <svg
            className="mr-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Create Invoice
        </Link>
      </div>
      
      <div className="mt-8 flex flex-col items-center justify-center text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices yet</h3>
        <p className="mt-1 text-sm text-gray-500">Create your first mobile invoice</p>
        <div className="mt-4">
          <Link
            href="/admin/mobile-invoices/new"
            className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            Create Now
          </Link>
        </div>
      </div>
    </div>
  );
} 