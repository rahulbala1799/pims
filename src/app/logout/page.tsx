'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Perform any logout actions here (clear cookies, etc.)
    
    // Redirect to home page
    router.push('/');
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-700">Logging you out...</h1>
        <p className="mt-2 text-gray-500">Please wait while we redirect you.</p>
      </div>
    </div>
  );
} 