'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface EmployeeLayoutProps {
  children: React.ReactNode;
}

export default function EmployeeLayout({ children }: EmployeeLayoutProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // This is a simple auth check that could be improved with proper auth session management
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user data exists in localStorage (set during login)
        const userData = localStorage.getItem('employeeUser');
        
        if (!userData) {
          // Redirect to login if no user data found
          router.push('/login/employee');
          return;
        }

        // Parse user data
        const user = JSON.parse(userData);
        
        // Verify the user is an employee
        if (user.role !== 'EMPLOYEE') {
          console.error('Not authorized as employee');
          localStorage.removeItem('employeeUser');
          router.push('/login/employee');
          return;
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        // If any error occurs, redirect to login
        localStorage.removeItem('employeeUser');
        router.push('/login/employee');
      }
    };
    
    checkAuth();
  }, [router]);

  // Define global logout handler
  if (typeof window !== 'undefined') {
    window.addEventListener('popstate', (event) => {
      if (window.location.pathname === '/logout') {
        localStorage.removeItem('employeeUser');
        window.location.href = '/';
      }
    });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
} 