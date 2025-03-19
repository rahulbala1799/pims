'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const isActive = (path: string) => {
    return pathname?.startsWith(path) ? 'text-indigo-600 font-medium' : 'text-gray-600';
  };

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/admin/dashboard" className="text-2xl font-bold text-indigo-600">
              PrintNPack Ltd
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <nav className="hidden md:flex space-x-6">
            <Link 
              href="/admin/dashboard" 
              className={`hover:text-indigo-600 ${isActive('/admin/dashboard')}`}
            >
              Dashboard
            </Link>
            <Link 
              href="/admin/customers" 
              className={`hover:text-indigo-600 ${isActive('/admin/customers')}`}
            >
              Customers
            </Link>
            <Link 
              href="/admin/jobs" 
              className={`hover:text-indigo-600 ${isActive('/admin/jobs')}`}
            >
              Jobs
            </Link>
            <Link 
              href="/admin/products" 
              className={`hover:text-indigo-600 ${isActive('/admin/products')}`}
            >
              Products
            </Link>
            <Link 
              href="/admin/employees" 
              className={`hover:text-indigo-600 ${isActive('/admin/employees')}`}
            >
              Employees
            </Link>
            <Link 
              href="/admin/hours" 
              className={`hover:text-indigo-600 ${isActive('/admin/hours')}`}
            >
              Hours
            </Link>
            <Link 
              href="/admin/invoices" 
              className={`hover:text-indigo-600 ${isActive('/admin/invoices')}`}
            >
              Invoices
            </Link>
            <Link 
              href="/admin/mobile-invoices" 
              className={`hover:text-indigo-600 ${isActive('/admin/mobile-invoices')}`}
            >
              Mobile Invoices
            </Link>
            <Link 
              href="/admin/metrics" 
              className={`hover:text-indigo-600 ${isActive('/admin/metrics')}`}
            >
              Metrics
            </Link>
            <Link 
              href="/admin/settings" 
              className={`hover:text-indigo-600 ${isActive('/admin/settings')}`}
            >
              Settings
            </Link>
          </nav>
          
          {/* User menu (desktop) */}
          <div className="hidden md:flex items-center">
            <div className="relative ml-3">
              <div className="flex items-center space-x-3">
                <button 
                  type="button" 
                  className="flex items-center text-sm rounded-full focus:outline-none"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                    A
                  </div>
                  <span className="ml-2 text-gray-600">Admin</span>
                </button>
                <Link 
                  href="/logout" 
                  className="text-gray-600 hover:text-indigo-600"
                >
                  Logout
                </Link>
              </div>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-gray-100"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile navigation menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white shadow-lg border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/admin/dashboard"
              className={`block px-3 py-2 rounded-md text-base ${isActive('/admin/dashboard')} hover:bg-gray-100`}
            >
              Dashboard
            </Link>
            <Link
              href="/admin/customers"
              className={`block px-3 py-2 rounded-md text-base ${isActive('/admin/customers')} hover:bg-gray-100`}
            >
              Customers
            </Link>
            <Link
              href="/admin/jobs"
              className={`block px-3 py-2 rounded-md text-base ${isActive('/admin/jobs')} hover:bg-gray-100`}
            >
              Jobs
            </Link>
            <Link
              href="/admin/products"
              className={`block px-3 py-2 rounded-md text-base ${isActive('/admin/products')} hover:bg-gray-100`}
            >
              Products
            </Link>
            <Link
              href="/admin/employees"
              className={`block px-3 py-2 rounded-md text-base ${isActive('/admin/employees')} hover:bg-gray-100`}
            >
              Employees
            </Link>
            <Link
              href="/admin/hours"
              className={`block px-3 py-2 rounded-md text-base ${isActive('/admin/hours')} hover:bg-gray-100`}
            >
              Hours
            </Link>
            <Link
              href="/admin/invoices"
              className={`block px-3 py-2 rounded-md text-base ${isActive('/admin/invoices')} hover:bg-gray-100`}
            >
              Invoices
            </Link>
            <Link
              href="/admin/mobile-invoices"
              className={`block px-3 py-2 rounded-md text-base ${isActive('/admin/mobile-invoices')} hover:bg-gray-100`}
            >
              Mobile Invoices
            </Link>
            <Link
              href="/admin/metrics"
              className={`block px-3 py-2 rounded-md text-base ${isActive('/admin/metrics')} hover:bg-gray-100`}
            >
              Metrics
            </Link>
            <Link
              href="/admin/settings"
              className={`block px-3 py-2 rounded-md text-base ${isActive('/admin/settings')} hover:bg-gray-100`}
            >
              Settings
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-5">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                  A
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">Admin User</div>
                <div className="text-sm font-medium text-gray-500">admin@example.com</div>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <Link
                href="/admin/profile"
                className="block px-3 py-2 rounded-md text-base text-gray-700 hover:bg-gray-100"
              >
                Profile
              </Link>
              <Link
                href="/admin/settings"
                className="block px-3 py-2 rounded-md text-base text-gray-700 hover:bg-gray-100"
              >
                Settings
              </Link>
              <Link
                href="/logout"
                className="block px-3 py-2 rounded-md text-base text-gray-700 hover:bg-gray-100"
              >
                Logout
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
} 