'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Remove hardcoded employee ID
// const EMPLOYEE_ID = "employee123"; 

interface Attendance {
  id: string;
  clockInTime: string;
  clockOutTime: string | null;
  totalHours: number | null;
}

interface JobSummary {
  total: number;
  inProgress: number;
  completed: number;
}

export default function EmployeeDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [isClockingIn, setIsClockingIn] = useState(false);
  const [isClockingOut, setIsClockingOut] = useState(false);
  const [clockError, setClockError] = useState<string | null>(null);
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

  // Fetch today's attendance and job summary on component mount
  useEffect(() => {
    // Only fetch data if we have user data
    if (!userData || !userData.id) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch today's attendance
        const today = new Date().toISOString().split('T')[0];
        const attendanceResponse = await fetch(`/api/attendance?userId=${userData.id}&date=${today}`);
        const attendanceData = await attendanceResponse.json();
        
        if (attendanceResponse.ok && attendanceData.length > 0) {
          setAttendance(attendanceData[0]);
        }
        
        // Fetch job summary
        const activeJobsResponse = await fetch(`/api/employee/jobs?userId=${userData.id}&status=active`);
        const activeJobs = await activeJobsResponse.json();
        
        const completedJobsResponse = await fetch(`/api/employee/jobs?userId=${userData.id}&status=completed`);
        const completedJobs = await completedJobsResponse.json();
        
        setJobSummary({
          total: activeJobs.length + completedJobs.length,
          inProgress: activeJobs.length,
          completed: completedJobs.length
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [userData]);

  const handleClockIn = async () => {
    if (!userData || !userData.id) return;
    
    setIsClockingIn(true);
    setClockError(null);
    
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userData.id }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setAttendance(data);
      } else {
        setClockError(data.error || 'Failed to clock in');
      }
    } catch (error) {
      console.error('Error clocking in:', error);
      setClockError('An error occurred while clocking in');
    } finally {
      setIsClockingIn(false);
    }
  };

  const handleClockOut = async () => {
    if (!userData || !userData.id) return;
    
    setIsClockingOut(true);
    setClockError(null);
    
    try {
      const response = await fetch('/api/attendance', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userData.id }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setAttendance(data);
      } else {
        setClockError(data.error || 'Failed to clock out');
      }
    } catch (error) {
      console.error('Error clocking out:', error);
      setClockError('An error occurred while clocking out');
    } finally {
      setIsClockingOut(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('employeeUser');
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Format time for display
  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Employee Dashboard</h1>
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
          {/* Attendance Card */}
          <div className="bg-white overflow-hidden shadow-sm rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Attendance</h2>
              
              {clockError && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{clockError}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  {attendance ? (
                    <div>
                      <p className="text-sm text-gray-500">Clock In Time</p>
                      <p className="text-lg font-semibold">{formatTime(attendance.clockInTime)}</p>
                      
                      {attendance.clockOutTime && (
                        <>
                          <p className="text-sm text-gray-500 mt-2">Clock Out Time</p>
                          <p className="text-lg font-semibold">{formatTime(attendance.clockOutTime)}</p>
                          
                          <p className="text-sm text-gray-500 mt-2">Total Hours</p>
                          <p className="text-lg font-semibold">{attendance.totalHours?.toFixed(2)} hours</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">You haven't clocked in yet today.</p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {!attendance && (
                    <button
                      onClick={handleClockIn}
                      disabled={isClockingIn}
                      className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                      {isClockingIn ? 'Clocking In...' : 'Clock In'}
                    </button>
                  )}
                  
                  {attendance && !attendance.clockOutTime && (
                    <button
                      onClick={handleClockOut}
                      disabled={isClockingOut}
                      className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                    >
                      {isClockingOut ? 'Clocking Out...' : 'Clock Out'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
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
                  count="" 
                  description="View your work schedule"
                  link="#"
                />
                <DashboardCard 
                  title="Messages" 
                  count="0" 
                  description="View messages and notifications"
                  link="#"
                />
                <DashboardCard 
                  title="Profile" 
                  count="" 
                  description="Update your profile information"
                  link="#"
                />
                <DashboardCard 
                  title="Help" 
                  count="" 
                  description="Get help and support"
                  link="#"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function DashboardCard({ title, count, description, link }: { title: string, count: string, description: string, link: string }) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
            <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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