'use client';

import { useRouter } from 'next/navigation';
import AdminHeader from '@/components/AdminHeader';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();

  // This is a client-side route handler for logout
  if (typeof window !== 'undefined') {
    // Define global logout handler for the "/logout" path
    window.addEventListener('popstate', (event) => {
      if (window.location.pathname === '/logout') {
        // Implement simple logout - redirect to home
        window.location.href = '/';
      }
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <main className="lg:pl-64 pb-16 pt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
} 