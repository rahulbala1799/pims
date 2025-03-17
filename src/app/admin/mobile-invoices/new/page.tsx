'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function NewMobileInvoicePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // This is just a placeholder that will be fully implemented later
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // This will be implemented later with the actual form logic
    setTimeout(() => {
      setIsSubmitting(false);
    }, 1000);
  };
  
  return (
    <div className="px-4 py-6">
      {/* Simplified mobile back navigation */}
      <div className="flex items-center mb-6">
        <Link href="/admin/mobile-invoices" className="text-indigo-600">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path>
          </svg>
        </Link>
        <h1 className="text-lg font-bold ml-2">New Mobile Invoice</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="text-center py-8">
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
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Mobile Invoice Form</h3>
          <p className="mt-1 text-sm text-gray-500">
            This is a placeholder for the mobile-optimized invoice creation form.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            The full implementation will be coming soon.
          </p>
        </div>
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <div className="flex space-x-3">
          <Link
            href="/admin/mobile-invoices"
            className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              isSubmitting ? 'bg-indigo-400' : 'bg-indigo-600'
            } focus:outline-none`}
          >
            {isSubmitting ? 'Processing...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
} 