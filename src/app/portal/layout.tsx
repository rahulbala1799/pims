'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiShoppingCart, FiFileText, FiPackage, FiUser, FiHome, FiLogOut } from 'react-icons/fi';

interface PortalLayoutProps {
  children: React.ReactNode;
}

export default function PortalLayout({ children }: PortalLayoutProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Mock authentication check - replace with actual authentication later
  useEffect(() => {
    const checkAuth = () => {
      try {
        // This would check if user data exists in localStorage or session
        const userData = localStorage.getItem('portalUser');
        
        if (!userData) {
          // Not logged in, redirect to portal login
          router.push('/portal/login');
          return;
        }

        // Parse user data and set to state
        const user = JSON.parse(userData);
        setUser(user);
        
        // Authentication successful
        setIsLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('portalUser');
        router.push('/portal/login');
      }
    };
    
    // In development, we'll skip authentication for now
    // checkAuth();
    setTimeout(() => {
      setUser({
        name: 'John Doe',
        email: 'john.doe@example.com',
        company: 'Acme Inc.',
        role: 'ADMIN'
      });
      setIsLoading(false);
    }, 500);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('portalUser');
    router.push('/portal/login');
  };

  // Check if the current route is the login page
  const isLoginPage = false; // We'll implement this logic later

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-100">
        <div className="p-8 bg-white shadow rounded-lg">
          <p className="text-lg text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  if (isLoginPage) {
    // Just render the login page without the portal layout
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Portal header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link href="/portal" className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-indigo-600">PrintingMIS</span>
                <span className="ml-2 text-sm text-gray-500">Customer Portal</span>
              </Link>
            </div>
            <div className="flex items-center">
              {user && (
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-4">{user.company}</span>
                  <div className="relative">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="font-medium text-indigo-800">
                          {user.name.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                      <div className="ml-2">
                        <div className="text-sm font-medium text-gray-700">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="ml-4 p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <FiLogOut className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <nav className="hidden md:block w-64 bg-white border-r border-gray-200 pt-5 pb-4 flex-shrink-0">
          <div className="flex-shrink-0 px-4 mb-5">
            <h2 className="text-lg font-medium text-gray-900">Navigation</h2>
          </div>
          <div className="mt-5 flex-grow flex flex-col">
            <div className="space-y-1 px-2">
              <Link 
                href="/portal" 
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <FiHome className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                Dashboard
              </Link>
              <Link 
                href="/portal/products" 
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <FiPackage className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                Products
              </Link>
              <Link 
                href="/portal/orders" 
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <FiShoppingCart className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                Orders
              </Link>
              <Link 
                href="/portal/invoices" 
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <FiFileText className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                Invoices
              </Link>
              <Link 
                href="/portal/account" 
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <FiUser className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                Account
              </Link>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 