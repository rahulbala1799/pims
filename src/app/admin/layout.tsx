'use client';

import AdminHeader from '@/components/AdminHeader';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <main className="pb-16">
        {children}
      </main>
    </div>
  );
} 