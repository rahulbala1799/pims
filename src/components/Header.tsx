'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiMenu, FiX } from 'react-icons/fi';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-2xl font-bold text-indigo-600">
              PrintPack MIS
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <nav className="hidden md:flex space-x-10">
            <Link href="/" className="text-gray-700 hover:text-indigo-600">
              Home
            </Link>
            <Link href="/help" className="text-gray-700 hover:text-indigo-600">
              Help
            </Link>
          </nav>
          
          {/* Login buttons for desktop */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              href="/login/employee" 
              className="px-4 py-2 text-sm font-medium rounded-md text-indigo-600 border border-indigo-600 hover:bg-indigo-50"
            >
              Employee Login
            </Link>
            <Link 
              href="/login/admin" 
              className="px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Admin Login
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-gray-100"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <FiX className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <FiMenu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              href="/" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-100"
            >
              Home
            </Link>
            <Link 
              href="/help" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-100"
            >
              Help
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-4 px-4">
              <Link 
                href="/login/employee" 
                className="w-full px-4 py-2 text-center font-medium rounded-md text-indigo-600 border border-indigo-600 hover:bg-indigo-50"
              >
                Employee Login
              </Link>
              <Link 
                href="/login/admin" 
                className="w-full px-4 py-2 text-center font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Admin Login
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
} 