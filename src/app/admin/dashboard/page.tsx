'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would check if the user is authenticated
    // For now, we'll simulate a loading state
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Logout
          </button>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Welcome to PrintPack MIS Admin Panel</h2>
              <p className="mb-4">From here you can manage your printing business operations.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                <DashboardCard 
                  title="Jobs" 
                  count="0" 
                  description="Manage printing jobs"
                  link="#"
                />
                <DashboardCard 
                  title="Customers" 
                  count="0" 
                  description="Manage customer accounts"
                  link="#"
                />
                <DashboardCard 
                  title="Employees" 
                  count="0" 
                  description="Manage employee accounts"
                  link="#"
                />
                <DashboardCard 
                  title="Reports" 
                  count="0" 
                  description="View business reports"
                  link="#"
                />
                <DashboardCard 
                  title="Settings" 
                  count="" 
                  description="Configure system settings"
                  link="#"
                />
                <DashboardCard 
                  title="Help" 
                  count="" 
                  description="Get help and support"
                  link="#"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function DashboardCard({ title, count, description, link }: { title: string, count: string, description: string, link: string }) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
            <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">
                {count}
              </div>
            </dd>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <div className="bg-gray-50 px-4 py-4 sm:px-6">
        <div className="text-sm">
          <Link href={link} className="font-medium text-indigo-600 hover:text-indigo-500">
            View all<span className="sr-only"> {title}</span>
          </Link>
        </div>
      </div>
    </div>
  );
} 