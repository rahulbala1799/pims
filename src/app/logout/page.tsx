'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const performLogout = () => {
      try {
        // Clear localStorage user data
        localStorage.removeItem('adminUser');
        localStorage.removeItem('employeeUser');
        
        // Redirect to home page
        router.push('/');
      } catch (error) {
        console.error('Error during logout:', error);
        // Redirect to home page even if logout fails
        router.push('/');
      }
    };

    performLogout();
  }, [router]);

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50">
      <div className="p-8 bg-white shadow rounded-lg">
        <h1 className="text-xl font-semibold text-center mb-2">Logging out...</h1>
        <p className="text-gray-500 text-center">Please wait while we log you out.</p>
      </div>
    </div>
  );
} 