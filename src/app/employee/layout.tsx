'use client';

import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import EmployeeHeader from '@/components/EmployeeHeader';
import { useState, useEffect } from 'react';

interface EmployeeLayoutProps {
  children: React.ReactNode;
}

export default function EmployeeLayout({ children }: EmployeeLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Enhanced auth check for employee section
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user data exists in localStorage
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
        
        // Additional check to see if the auth cookie is present
        // This is a secondary check since middleware should handle this already
        const res = await fetch('/api/auth/verify');
        const data = await res.json();
        
        if (!data.isAuthenticated || data.role !== 'EMPLOYEE') {
          console.error('Auth cookie not found or invalid');
          localStorage.removeItem('employeeUser');
          router.push('/login/employee');
          return;
        }
        
        setUserName(user.name || 'Employee');
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-100">
        <div className="p-8 bg-white shadow rounded-lg">
          <p className="text-lg text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Check if the current path should highlight in nav
  const isActivePath = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeeHeader 
        userName={userName} 
        isMenuOpen={isMenuOpen} 
        toggleMenu={toggleMenu}
        isActivePath={isActivePath}
      />
      
      <main className="pt-16 sm:pl-64">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
} 