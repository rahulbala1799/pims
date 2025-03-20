'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Card component for metrics
interface MetricCardProps {
  title: string;
  description: string;
  category: string;
  path: string;
  icon: React.ReactNode;
}

const MetricCard = ({ title, description, category, path, icon }: MetricCardProps) => {
  return (
    <Link href={`/admin/reporting/${path}`}>
      <div className="bg-white overflow-hidden shadow-sm hover:shadow-md rounded-lg p-6 cursor-pointer transition-all duration-200 h-full">
        <div className="flex items-start">
          <div className="flex-shrink-0 w-12 h-12 rounded-md bg-indigo-100 flex items-center justify-center text-indigo-600">
            {icon}
          </div>
          <div className="ml-4">
            <p className="text-xs font-medium text-indigo-600 uppercase tracking-wider">{category}</p>
            <h3 className="text-lg font-medium text-gray-900 mt-1">{title}</h3>
            <p className="mt-2 text-sm text-gray-500">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  );
};

// Icons for different metric categories
const FinanceIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const OperationsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const ProductIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const CustomerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const EmployeeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const JobIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

export default function ReportingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading metrics data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Group metrics by category
  const financialMetrics = [
    {
      title: "Monthly/Quarterly Revenue Trends",
      description: "Track revenue patterns over time to identify seasonal trends and growth.",
      category: "Financial",
      path: "financial/revenue-trends",
      icon: <FinanceIcon />
    },
    {
      title: "Gross Profit Margins by Job Type",
      description: "Analyze profitability across different types of jobs and services.",
      category: "Financial",
      path: "financial/profit-margins",
      icon: <FinanceIcon />
    },
    {
      title: "Average Invoice Value",
      description: "Monitor the average value of invoices to track sales performance.",
      category: "Financial",
      path: "financial/avg-invoice-value",
      icon: <FinanceIcon />
    },
    {
      title: "Outstanding Invoice Amount",
      description: "Track unpaid invoices to manage cash flow and receivables.",
      category: "Financial",
      path: "financial/outstanding-invoices",
      icon: <FinanceIcon />
    },
    {
      title: "Revenue by Product Class",
      description: "Analyze revenue distribution across product categories.",
      category: "Financial",
      path: "financial/revenue-by-product",
      icon: <FinanceIcon />
    },
    {
      title: "Days Sales Outstanding (DSO)",
      description: "Measure the average time it takes to collect payment after a sale.",
      category: "Financial",
      path: "financial/dso",
      icon: <FinanceIcon />
    }
  ];

  const operationalMetrics = [
    {
      title: "Average Job Completion Time",
      description: "Track how long it takes to complete jobs on average.",
      category: "Operational",
      path: "operational/completion-time",
      icon: <OperationsIcon />
    },
    {
      title: "Production Time per Product Type",
      description: "Analyze how production time varies across different product types.",
      category: "Operational",
      path: "operational/production-time",
      icon: <OperationsIcon />
    },
    {
      title: "Employee Productivity",
      description: "Measure jobs completed per hour worked by employees.",
      category: "Operational",
      path: "operational/employee-productivity",
      icon: <OperationsIcon />
    },
    {
      title: "Job Status Distribution",
      description: "See the breakdown of jobs by status across the workflow.",
      category: "Operational",
      path: "operational/status-distribution",
      icon: <OperationsIcon />
    },
    {
      title: "Material Usage Efficiency",
      description: "Track material consumption and identify opportunities for optimization.",
      category: "Operational",
      path: "operational/material-efficiency",
      icon: <OperationsIcon />
    },
    {
      title: "Ink Cost per Job Type",
      description: "Analyze ink consumption and costs across different job types.",
      category: "Operational",
      path: "operational/ink-cost",
      icon: <OperationsIcon />
    }
  ];

  const productMetrics = [
    {
      title: "Top Selling Products",
      description: "Identify your best-performing products by sales volume.",
      category: "Product",
      path: "product/top-selling",
      icon: <ProductIcon />
    },
    {
      title: "Product Profitability Analysis",
      description: "Analyze which products generate the highest profit margins.",
      category: "Product",
      path: "product/profitability",
      icon: <ProductIcon />
    },
    {
      title: "Sales Volume by Product Class",
      description: "Track sales distribution across different product categories.",
      category: "Product",
      path: "product/sales-volume",
      icon: <ProductIcon />
    },
    {
      title: "Product Pricing Trends",
      description: "Monitor changes in product pricing over time.",
      category: "Product",
      path: "product/pricing-trends",
      icon: <ProductIcon />
    }
  ];

  const customerMetrics = [
    {
      title: "Top Customers by Revenue",
      description: "Identify your most valuable customers based on revenue.",
      category: "Customer",
      path: "customer/top-revenue",
      icon: <CustomerIcon />
    },
    {
      title: "Customer Retention Rate",
      description: "Track how effectively you're retaining customers over time.",
      category: "Customer",
      path: "customer/retention",
      icon: <CustomerIcon />
    },
    {
      title: "Jobs per Customer",
      description: "Analyze the average number of jobs per customer.",
      category: "Customer",
      path: "customer/jobs-per-customer",
      icon: <CustomerIcon />
    },
    {
      title: "Average Order Value by Customer",
      description: "Track average order value across different customers.",
      category: "Customer",
      path: "customer/avg-order-value",
      icon: <CustomerIcon />
    },
    {
      title: "New vs. Returning Customer Revenue",
      description: "Compare revenue from new and returning customers.",
      category: "Customer",
      path: "customer/new-vs-returning",
      icon: <CustomerIcon />
    }
  ];

  const employeeMetrics = [
    {
      title: "Hours Logged vs. Job Completion Rate",
      description: "Compare time logged against job completion metrics.",
      category: "Employee",
      path: "employee/hours-vs-completion",
      icon: <EmployeeIcon />
    },
    {
      title: "Employee Utilization Rate",
      description: "Track how efficiently employee time is being utilized.",
      category: "Employee",
      path: "employee/utilization",
      icon: <EmployeeIcon />
    },
    {
      title: "Average Job Completion Time by Employee",
      description: "Compare efficiency across different employees.",
      category: "Employee",
      path: "employee/avg-completion-time",
      icon: <EmployeeIcon />
    },
    {
      title: "Revenue Generated per Employee",
      description: "Track the revenue contribution of each employee.",
      category: "Employee",
      path: "employee/revenue-per-employee",
      icon: <EmployeeIcon />
    }
  ];

  const jobMetrics = [
    {
      title: "Job Priority Distribution",
      description: "Analyze the distribution of jobs by priority level.",
      category: "Job",
      path: "job/priority-distribution",
      icon: <JobIcon />
    },
    {
      title: "On-Time Delivery Rate",
      description: "Track the percentage of jobs delivered on time.",
      category: "Job",
      path: "job/on-time-delivery",
      icon: <JobIcon />
    },
    {
      title: "Job Revision Rate",
      description: "Monitor how frequently jobs require revisions.",
      category: "Job",
      path: "job/revision-rate",
      icon: <JobIcon />
    },
    {
      title: "Average Job Value",
      description: "Track the average monetary value of jobs over time.",
      category: "Job",
      path: "job/avg-value",
      icon: <JobIcon />
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Reporting</h1>
          <p className="mt-1 text-sm text-gray-500">Comprehensive metrics and KPIs to track business performance</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Financial Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {financialMetrics.map((metric, index) => (
                <MetricCard
                  key={`financial-${index}`}
                  title={metric.title}
                  description={metric.description}
                  category={metric.category}
                  path={metric.path}
                  icon={metric.icon}
                />
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Operational Efficiency</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {operationalMetrics.map((metric, index) => (
                <MetricCard
                  key={`operational-${index}`}
                  title={metric.title}
                  description={metric.description}
                  category={metric.category}
                  path={metric.path}
                  icon={metric.icon}
                />
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Product Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {productMetrics.map((metric, index) => (
                <MetricCard
                  key={`product-${index}`}
                  title={metric.title}
                  description={metric.description}
                  category={metric.category}
                  path={metric.path}
                  icon={metric.icon}
                />
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Customer Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customerMetrics.map((metric, index) => (
                <MetricCard
                  key={`customer-${index}`}
                  title={metric.title}
                  description={metric.description}
                  category={metric.category}
                  path={metric.path}
                  icon={metric.icon}
                />
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Employee Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {employeeMetrics.map((metric, index) => (
                <MetricCard
                  key={`employee-${index}`}
                  title={metric.title}
                  description={metric.description}
                  category={metric.category}
                  path={metric.path}
                  icon={metric.icon}
                />
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Job Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobMetrics.map((metric, index) => (
                <MetricCard
                  key={`job-${index}`}
                  title={metric.title}
                  description={metric.description}
                  category={metric.category}
                  path={metric.path}
                  icon={metric.icon}
                />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
} 