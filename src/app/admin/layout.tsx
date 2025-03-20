'use client';

import { useRouter } from 'next/navigation';
import AdminHeader from '@/components/AdminHeader';
import { useEffect, useState } from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Verify client-side authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user data exists in localStorage
        const userData = localStorage.getItem('adminUser');
        
        if (!userData) {
          // Redirect to login if no user data found
          router.push('/login/admin');
          return;
        }

        // Parse user data
        const user = JSON.parse(userData);
        
        // Verify the user is an admin
        if (user.role !== 'ADMIN') {
          console.error('Not authorized as admin');
          localStorage.removeItem('adminUser');
          router.push('/login/admin');
          return;
        }
        
        // Additional check to see if the auth cookie is present
        // This is a secondary check since middleware should handle this already
        const res = await fetch('/api/auth/verify');
        const data = await res.json();
        
        if (!data.isAuthenticated) {
          console.error('Auth cookie not found or invalid');
          localStorage.removeItem('adminUser');
          router.push('/login/admin');
          return;
        }
        
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
        <div className="lg:block hidden w-64 flex-shrink-0">
          <AdminHeader />
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