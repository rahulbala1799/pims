'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import HourLogging from '@/components/HourLogging';

// Remove hardcoded employee ID
// const EMPLOYEE_ID = "employee123"; 

interface JobSummary {
  total: number;
  inProgress: number;
  completed: number;
}

export default function EmployeeDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [jobSummary, setJobSummary] = useState<JobSummary>({
    total: 0,
    inProgress: 0,
    completed: 0
  });
  const [userData, setUserData] = useState<any>(null);

  // Get user data from localStorage
  useEffect(() => {
    const storedUserData = localStorage.getItem('employeeUser');
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }
  }, []);

  // Fetch job summary on component mount
  useEffect(() => {
    // Only fetch data if we have user data
    if (!userData || !userData.id) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch job summary with proper error handling
        let activeJobs = [];
        let completedJobs = [];
        
        try {
          const activeJobsResponse = await fetch(`/api/employee/jobs?userId=${userData.id}&status=active`);
          if (activeJobsResponse.ok) {
            activeJobs = await activeJobsResponse.json();
          } else {
            console.error('Failed to fetch active jobs:', await activeJobsResponse.text());
          }
        } catch (activeError) {
          console.error('Error fetching active jobs:', activeError);
        }
        
        try {
          const completedJobsResponse = await fetch(`/api/employee/jobs?userId=${userData.id}&status=completed`);
          if (completedJobsResponse.ok) {
            completedJobs = await completedJobsResponse.json();
          } else {
            console.error('Failed to fetch completed jobs:', await completedJobsResponse.text());
          }
        } catch (completedError) {
          console.error('Error fetching completed jobs:', completedError);
        }
        
        // If both arrays are valid, update the summary
        if (Array.isArray(activeJobs) && Array.isArray(completedJobs)) {
          setJobSummary({
            total: activeJobs.length + completedJobs.length,
            inProgress: activeJobs.length,
            completed: completedJobs.length
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [userData]);

  const handleLogout = () => {
    localStorage.removeItem('employeeUser');
    window.location.href = '/';
  };

  if (isLoading && !userData) {
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
          <h1 className="text-3xl font-bold text-gray-900">Employee Dashboard</h1>
          <div className="flex items-center space-x-4">
            {userData && (
              <span className="text-gray-600">Welcome, {userData.name}</span>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Hour Logging Section */}
          {userData && (
            <div className="mb-6">
              <HourLogging userId={userData.id} />
            </div>
          )}
          
          {/* Dashboard Cards */}
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Welcome to PrintPack MIS Employee Portal</h2>
              <p className="mb-4">From here you can manage your assigned tasks and track progress.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                <DashboardCard 
                  title="Active Jobs" 
                  count={jobSummary.inProgress.toString()} 
                  description="View and update your assigned jobs"
                  link="/employee/jobs"
                />
                <DashboardCard 
                  title="Completed Jobs" 
                  count={jobSummary.completed.toString()} 
                  description="View your completed jobs"
                  link="/employee/jobs/completed"
                />
                <DashboardCard 
                  title="Schedule" 
                  count="View" 
                  description="Check your upcoming schedule"
                  link="/employee/schedule"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Dashboard Card Component
function DashboardCard({ title, count, description, link }: { 
  title: string; 
  count: string; 
  description: string; 
  link: string;
}) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
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
        <div className="mt-3">
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <div className="mt-4">
          <Link
            href={link}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
} 