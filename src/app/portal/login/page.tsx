'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PortalLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [debug, setDebug] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setDebug('Attempting login...');
    
    try {
      // Add request debugging
      setDebug(prev => prev + '\nSending request to /api/portal/auth...');
      
      // Call the authentication API
      const response = await fetch('/api/portal/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      setDebug(prev => prev + `\nResponse status: ${response.status}`);
      
      const data = await response.json();
      setDebug(prev => prev + `\nResponse data: ${JSON.stringify(data, null, 2)}`);
      
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      
      setDebug(prev => prev + '\nAuthentication successful, storing token...');
      
      // Store user info and token in localStorage
      localStorage.setItem('portalUser', JSON.stringify(data.user));
      localStorage.setItem('portalToken', data.token);
      
      setDebug(prev => prev + '\nRedirecting to portal dashboard...');
      
      // Redirect to dashboard
      router.push('/portal');
    } catch (err: any) {
      const errorMsg = err.message || 'An error occurred during login';
      setError(errorMsg);
      setDebug(prev => prev + `\nError: ${errorMsg}`);
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Debug mode toggle
  const [showDebug, setShowDebug] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Customer Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access your printing orders
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <input type="hidden" name="remember" defaultValue="true" />
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

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
              <button 
                type="button" 
                onClick={() => setShowDebug(!showDebug)}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                {showDebug ? 'Hide debug' : 'Show debug'}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          
          {/* TEST CREDENTIALS SECTION */}
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <h3 className="text-sm font-medium text-blue-800">Test Credentials</h3>
            <div className="mt-1 text-sm text-blue-700">
              <p>Email: portal@example.com</p>
              <p>Password: password123</p>
            </div>
          </div>
          
          {/* DEBUG INFO SECTION */}
          {showDebug && debug && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700">Debug Information</h3>
              <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap overflow-auto max-h-40">
                {debug}
              </pre>
            </div>
          )}
        </form>
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Don't have an account? Contact your account manager.
          </p>
          <p className="mt-2 text-sm text-gray-600">
            <Link href="/portal/landing" className="font-medium text-indigo-600 hover:text-indigo-500">
              Return to portal home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 