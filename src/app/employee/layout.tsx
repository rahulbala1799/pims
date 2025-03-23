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
  const [userId, setUserId] = useState('');
  const [isSalesEmployee, setIsSalesEmployee] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Simplified auth check for employee section
  useEffect(() => {
    const checkAuth = () => {
      try {
        // Check if user data exists in localStorage
        const userData = localStorage.getItem('employeeUser');
        
        if (!userData) {
          // Redirect to login if no user data found
          console.error('No employee user data found in localStorage');
          router.push('/login/employee');
          return;
        }

        // Parse user data
        const user = JSON.parse(userData);
        
        // Verify the user is an employee
        if (user.role !== 'EMPLOYEE') {
          console.error('User is not an employee');
          localStorage.removeItem('employeeUser');
          router.push('/login/employee');
          return;
        }
        
        // Authentication successful
        setUserName(user.name || 'Employee');
        setUserId(user.id);
        
        // Check if user is a sales employee
        const checkSalesStatus = async () => {
          try {
            const response = await fetch(`/api/employees/${user.id}/sales-status/check`);
            
            if (response.ok) {
              const data = await response.json();
              setIsSalesEmployee(data.isSalesEmployee || false);
            }
          } catch (error) {
            console.error('Error checking sales status:', error);
          } finally {
            setIsLoading(false);
          }
        };
        
        checkSalesStatus();
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
        userId={userId}
        isSalesEmployee={isSalesEmployee}
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