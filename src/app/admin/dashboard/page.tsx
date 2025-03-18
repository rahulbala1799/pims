'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DashboardStats {
  products: number;
  jobs: number;
  customers: number;
  employees: number;
  invoices: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    products: 0,
    jobs: 0,
    customers: 0,
    employees: 0,
    invoices: 0
  });

  useEffect(() => {
    // Fetch dashboard stats
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        // Fetch product count
        const productResponse = await fetch('/api/products');
        const products = await productResponse.json();
        
        // Fetch customer count
        const customerResponse = await fetch('/api/customers');
        const customers = await customerResponse.json();
        
        // Fetch job count
        const jobResponse = await fetch('/api/jobs');
        const jobs = await jobResponse.json();
        
        // Fetch invoice count
        const invoiceResponse = await fetch('/api/invoices');
        const invoices = await invoiceResponse.json();
        
        // In a real app, you would fetch other stats too
        // For now, we'll update the products, customers, and invoices count
        setStats(prev => ({
          ...prev,
          products: products.length,
          customers: customers.length,
          jobs: jobs.length || 0,
          invoices: invoices.length || 0
        }));
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  const handleLogout = () => {
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Logout
          </button>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Logo upload alert */}
          <div className="px-4 sm:px-0 mb-6">
            <div className="rounded-md bg-blue-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Upload Your Company Logo</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Upload your company logo to personalize your invoices and documents.{' '}
                      <Link href="/admin/settings" className="font-medium underline">
                        Go to Settings
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Welcome to PrintNPack Ltd Admin Panel</h2>
              <p className="mb-4">From here you can manage your printing business operations.</p>
              
              {/* Overview Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard title="Products" value={stats.products} />
                <StatCard title="Jobs" value={stats.jobs} />
                <StatCard title="Customers" value={stats.customers} />
                <StatCard title="Employees" value={stats.employees} />
              </div>
              
              <h3 className="text-xl font-semibold mb-4 mt-8">Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DashboardCard 
                  title="Products" 
                  count={stats.products.toString()} 
                  description="Manage product catalog, variants and pricing"
                  link="/admin/products"
                  icon={<ProductIcon />}
                />
                <DashboardCard 
                  title="Jobs" 
                  count={stats.jobs.toString()} 
                  description="Schedule and track print jobs"
                  link="/admin/jobs"
                  icon={<JobIcon />}
                />
                <DashboardCard 
                  title="Customers" 
                  count={stats.customers.toString()} 
                  description="Manage customer accounts and orders"
                  link="/admin/customers"
                  icon={<CustomerIcon />}
                />
              </div>
              
              <h3 className="text-xl font-semibold mb-4 mt-8">Invoicing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DashboardCard 
                  title="Invoices" 
                  count={stats.invoices.toString()} 
                  description="Create and manage desktop-optimized invoices"
                  link="/admin/invoices"
                  icon={<InvoiceIcon />}
                />
                <DashboardCard 
                  title="Mobile Invoices" 
                  count={stats.invoices.toString()} 
                  description="Mobile-friendly invoice creation and management"
                  link="/admin/mobile-invoices"
                  icon={<MobileInvoiceIcon />}
                />
              </div>
              
              <h3 className="text-xl font-semibold mb-4 mt-8">Administration</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DashboardCard 
                  title="Employees" 
                  count={stats.employees.toString()} 
                  description="Manage employee accounts and access"
                  link="#"
                  icon={<EmployeeIcon />}
                />
                <DashboardCard 
                  title="Reports" 
                  count="" 
                  description="View business reports and analytics"
                  link="#"
                  icon={<ReportIcon />}
                />
                <DashboardCard 
                  title="Settings" 
                  count="" 
                  description="Configure system settings and preferences"
                  link="#"
                  icon={<SettingsIcon />}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value }: { title: string, value: number }) {
  return (
    <div className="bg-white rounded-lg shadow px-4 py-5">
      <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
      <dd className="mt-1 text-3xl font-semibold text-indigo-600">{value}</dd>
    </div>
  );
}

function DashboardCard({ 
  title, 
  count, 
  description, 
  link, 
  icon 
}: { 
  title: string, 
  count: string, 
  description: string, 
  link: string,
  icon: React.ReactNode
}) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">
                {count}
              </div>
            </dd>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <div className="bg-gray-50 px-4 py-4 sm:px-6">
        <div className="text-sm">
          <Link href={link} className="font-medium text-indigo-600 hover:text-indigo-500">
            View all<span className="sr-only"> {title}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Icons
function ProductIcon() {
  return (
    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function JobIcon() {
  return (
    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function CustomerIcon() {
  return (
    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function EmployeeIcon() {
  return (
    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function InvoiceIcon() {
  return (
    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function MobileInvoiceIcon() {
  return (
    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
} 