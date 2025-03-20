'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface LoginFormProps {
  userType: 'admin' | 'employee';
}

export default function LoginForm({ userType }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [debug, setDebug] = useState<string | null>(null);

  useEffect(() => {
    // Clear any previous localStorage data on login page load
    if (userType === 'admin') {
      localStorage.removeItem('adminUser');
    } else {
      localStorage.removeItem('employeeUser');
    }
  }, [userType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDebug(null);
    setIsLoading(true);

    try {
      setDebug(`Attempting to log in as ${userType} with email: ${email}`);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          userType
        }),
        credentials: 'include' // Important for cookie handling
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      
      setDebug(`Login successful. Response: ${JSON.stringify(data)}`);
      
      // Store user data in localStorage based on user type
      if (userType === 'admin') {
        localStorage.setItem('adminUser', JSON.stringify(data.user));
      } else {
        localStorage.setItem('employeeUser', JSON.stringify(data.user));
      }
      
      // Login successful, redirect to appropriate dashboard using router
      const redirectUrl = data.redirectUrl || (userType === 'admin' ? '/admin/dashboard' : '/employee/dashboard');
      setDebug(`Redirecting to: ${redirectUrl}`);
      
      // Small delay to ensure cookies are set before redirect
      setTimeout(() => {
        router.push(redirectUrl);
      }, 500);
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-extrabold text-gray-900">
          {userType === 'admin' ? 'Admin Login' : 'Employee Login'}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {userType === 'admin' 
            ? 'Access the admin dashboard to manage your printing business' 
            : 'Log in to track your assigned jobs and update progress'}
        </p>
      </div>
      
      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {debug && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700 whitespace-pre-wrap">{debug}</p>
              </div>
            </div>
          </div>
        )}
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
              Forgot your password?
            </a>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </form>
      
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              {userType === 'admin' ? 'Not an admin?' : 'Not an employee?'}
            </span>
          </div>
        </div>

        <div className="mt-6 text-center">
          {userType === 'admin' ? (
            <Link href="/login/employee" className="font-medium text-indigo-600 hover:text-indigo-500">
              Go to Employee Login
            </Link>
          ) : (
            <Link href="/login/admin" className="font-medium text-indigo-600 hover:text-indigo-500">
              Go to Admin Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
} 