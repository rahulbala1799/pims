'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiShoppingCart, FiFileText, FiPackage, FiUser, FiHome, FiLogOut } from 'react-icons/fi';

interface PortalLayoutProps {
  children: React.ReactNode;
}

export default function PortalLayout({ children }: PortalLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Skip authentication for login page and landing page
        if (pathname === '/portal/login' || pathname === '/portal/landing') {
          setIsLoading(false);
          return;
        }
        
        // Get token from localStorage
        const token = localStorage.getItem('portalToken');
        
        if (!token) {
          // Not logged in, redirect to portal login
          console.log('No token found in localStorage, redirecting to login');
          setAuthError('No authentication token found');
          router.push('/portal/login');
          return;
        }

        console.log('Verifying token with API...');
        
        // Verify token with API
        const response = await fetch('/api/portal/auth', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store',
          },
        });
        
        if (!response.ok) {
          // Try to get the error message from the response
          let errorMsg = 'Authentication verification failed';
          try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
          } catch (e) {
            console.error('Failed to parse error response:', e);
          }
          
          console.error(`Auth verification failed: ${response.status} ${response.statusText}`);
          setAuthError(errorMsg);
          throw new Error(errorMsg);
        }
        
        const data = await response.json();
        
        if (!data.valid) {
          const errorMsg = data.error || 'Invalid authentication token';
          console.error(`Token verification failed: ${errorMsg}`);
          setAuthError(errorMsg);
          throw new Error(errorMsg);
        }
        
        console.log('Authentication successful:', data.user);
        
        // Set user data
        setUser(data.user);
        localStorage.setItem('portalUser', JSON.stringify(data.user));
        
        // Authentication successful
        setAuthError(null);
        setIsLoading(false);
      } catch (error: any) {
        console.error('Auth check error:', error);
        setAuthError(error.message || 'Authentication failed');
        localStorage.removeItem('portalToken');
        localStorage.removeItem('portalUser');
        
        // Add a small delay before redirect to ensure the error is displayed
        setTimeout(() => {
          router.push('/portal/login');
        }, 1000);
      }
    };
    
    // Check authentication on route change
    checkAuth();
  }, [router, pathname]);

  const handleLogout = () => {
    localStorage.removeItem('portalToken');
    localStorage.removeItem('portalUser');
    router.push('/portal/login');
  };

  // Check if the current route is the login page or landing page
  const isLoginPage = pathname === '/portal/login';
  const isLandingPage = pathname === '/portal/landing';

  if (isLoading && pathname !== '/portal/login' && pathname !== '/portal/landing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Loading...</h2>
          {authError && (
            <div className="mt-4 p-4 bg-red-50 rounded-md text-red-800 max-w-md">
              <p className="text-sm font-medium">Authentication Error</p>
              <p className="text-xs mt-1">{authError}</p>
              <button 
                onClick={() => router.push('/portal/login')}
                className="mt-3 text-sm text-blue-600 hover:text-blue-800"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isLoginPage || isLandingPage) {
    // Just render the login page or landing page without the portal layout
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
                  <span className="text-sm text-gray-500 mr-4">{user.companyName || 'Company'}</span>
                  <div className="relative">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="font-medium text-indigo-800">
                          {user.name && user.name.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                      <div className="ml-2">
                        <div className="text-sm font-medium text-gray-700">{user.name || 'User'}</div>
                        <div className="text-xs text-gray-500">{user.email || 'Email'}</div>
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