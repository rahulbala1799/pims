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