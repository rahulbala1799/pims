'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function AdminHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoExists, setLogoExists] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const pathname = usePathname();

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Check if logo exists
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cacheParam = `cache=${Date.now()}`;
      const isLocalhost = window.location.hostname === 'localhost';
      
      // Determine which logo path to use based on environment
      const logoPath = isLocalhost ? '/images/logo.png' : '/placeholder-logo.png';
      const url = `${logoPath}?${cacheParam}`;
      
      console.log('AdminHeader: Checking for logo at', url);
      
      const img = new window.Image();
      img.onload = () => {
        console.log('AdminHeader: Logo found');
        setLogoExists(true);
        setLogoUrl(url);
      };
      img.onerror = () => {
        console.log('AdminHeader: No logo found at', url);
        setLogoExists(false);
        
        // If we're in production and the specific path failed, try a placeholder
        if (!isLocalhost) {
          const placeholderUrl = `/placeholder-logo.png?${cacheParam}`;
          console.log('AdminHeader: Trying placeholder logo at', placeholderUrl);
          
          const placeholderImg = new window.Image();
          placeholderImg.onload = () => {
            console.log('AdminHeader: Placeholder logo found');
            setLogoExists(true);
            setLogoUrl(placeholderUrl);
          };
          placeholderImg.onerror = () => {
            console.log('AdminHeader: No placeholder logo found');
            setLogoExists(false);
          };
          placeholderImg.src = placeholderUrl;
        }
      };
      img.src = url;
    }
  }, []);

  const isActive = (path: string) => {
    return pathname?.startsWith(path) ? 'text-indigo-600 font-medium' : 'text-gray-600';
  };

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/admin/dashboard" className="flex items-center">
              {logoExists ? (
                <div className="h-10 mr-2 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoUrl}
                    alt="PrintNPack Ltd"
                    className="h-10 object-contain"
                  />
                </div>
              ) : null}
              <span className="text-2xl font-bold text-indigo-600">PrintNPack Ltd</span>
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
              href="/admin/products" 
              className={`hover:text-indigo-600 ${isActive('/admin/products')}`}
            >
              Products
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
              href="/admin/settings" 
              className={`hover:text-indigo-600 ${isActive('/admin/settings')}`}
            >
              Settings
            </Link>
            {/* Temporarily commenting out Reports link until the page is created
            <Link 
              href="/admin/reports" 
              className={`hover:text-indigo-600 ${isActive('/admin/reports')}`}
            >
              Reports
            </Link>
            */}
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
              href="/admin/products"
              className={`block px-3 py-2 rounded-md text-base ${isActive('/admin/products')} hover:bg-gray-100`}
            >
              Products
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
              href="/admin/settings"
              className={`block px-3 py-2 rounded-md text-base ${isActive('/admin/settings')} hover:bg-gray-100`}
            >
              Settings
            </Link>
            {/* Temporarily commenting out Reports link until the page is created
            <Link
              href="/admin/reports"
              className={`block px-3 py-2 rounded-md text-base ${isActive('/admin/reports')} hover:bg-gray-100`}
            >
              Reports
            </Link>
            */}
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