'use client';

import { useRouter } from 'next/navigation';
import AdminHeader from '@/components/AdminHeader';
import { useEffect, useState } from 'react';
import { FiHome, FiUsers, FiFileText, FiPackage, FiDollarSign, FiClock, FiBarChart2, FiSettings, FiShoppingCart } from 'react-icons/fi';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const sidebarItems = [
  { name: 'Dashboard', href: '/admin', icon: FiHome },
  { name: 'Jobs', href: '/admin/jobs', icon: FiFileText },
  { name: 'Products', href: '/admin/products', icon: FiPackage },
  { name: 'Customers', href: '/admin/customers', icon: FiUsers },
  { name: 'Invoices', href: '/admin/invoices', icon: FiDollarSign },
  { name: 'Time Tracking', href: '/admin/time-tracking', icon: FiClock },
  { name: 'Reporting', href: '/admin/reporting', icon: FiBarChart2 },
  { name: 'Customer Portal', href: '/admin/customer-portal', icon: FiShoppingCart },
  { name: 'Settings', href: '/admin/settings', icon: FiSettings },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  // Verify client-side authentication
  useEffect(() => {
    const checkAuth = () => {
      try {
        // Check if user data exists in localStorage
        const userData = localStorage.getItem('adminUser');
        
        if (!userData) {
          console.error('No admin user data found in localStorage');
          router.push('/login/admin');
          return;
        }

        // Parse user data
        const user = JSON.parse(userData);
        
        // Verify the user is an admin
        if (user.role !== 'ADMIN') {
          console.error('User is not an admin');
          localStorage.removeItem('adminUser');
          router.push('/login/admin');
          return;
        }
        
        // Authentication successful
        setIsLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('adminUser');
        router.push('/login/admin');
      }
    };
    
    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-100">
        <div className="p-8 bg-white shadow rounded-lg">
          <p className="text-lg text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="lg:hidden">
        <AdminHeader />
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="lg:block hidden w-64 flex-shrink-0 bg-white border-r border-gray-200">
          <div className="h-16 flex items-center px-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <nav className="mt-5 px-3 space-y-1">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-5 w-5 ${
                      isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <main className="flex-1 overflow-y-auto pb-16 pt-4 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 