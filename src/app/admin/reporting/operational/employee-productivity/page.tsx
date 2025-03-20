'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Mock data for employee productivity
const generateEmployeeProductivityData = () => {
  const employees = [
    "John Smith",
    "Sarah Johnson",
    "Michael Brown",
    "Emily Davis",
    "David Wilson",
    "Jessica Martinez",
    "James Taylor",
    "Jennifer Anderson"
  ];
  
  return employees.map(name => {
    // Generate realistic-looking metrics
    const jobsCompleted = Math.floor(15 + Math.random() * 25); // 15-40 jobs
    const hoursLogged = Math.floor(120 + Math.random() * 60); // 120-180 hours
    const jobsPerHour = +(jobsCompleted / (hoursLogged / 40)).toFixed(2); // Jobs per 40 hour week
    const avgCompletionTime = +(hoursLogged / jobsCompleted).toFixed(1);
    
    return {
      name,
      jobsCompleted,
      hoursLogged,
      jobsPerHour,
      avgCompletionTime,
      efficiency: Math.floor(75 + Math.random() * 25) // 75-100% efficiency rating
    };
  }).sort((a, b) => b.jobsPerHour - a.jobsPerHour); // Sort by productivity
};

export default function EmployeeProductivityPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [employeeData, setEmployeeData] = useState<any[]>([]);
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'ascending' | 'descending'}>({
    key: 'jobsPerHour',
    direction: 'descending'
  });
  
  useEffect(() => {
    // In a real app, this would fetch data from the API
    const timer = setTimeout(() => {
      setEmployeeData(generateEmployeeProductivityData());
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = () => {
    const sortableData = [...employeeData];
    sortableData.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
    return sortableData;
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(num);
  };

  const getTeamAverages = () => {
    if (employeeData.length === 0) return { avgJobsPerHour: 0, avgCompletionTime: 0 };
    
    const totalJobsPerHour = employeeData.reduce((sum, employee) => sum + employee.jobsPerHour, 0);
    const totalCompletionTime = employeeData.reduce((sum, employee) => sum + employee.avgCompletionTime, 0);
    
    return {
      avgJobsPerHour: +(totalJobsPerHour / employeeData.length).toFixed(2),
      avgCompletionTime: +(totalCompletionTime / employeeData.length).toFixed(1)
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const teamAverages = getTeamAverages();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <Link href="/admin/reporting" className="text-indigo-600 hover:text-indigo-900 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Employee Productivity</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">Measure jobs completed per hour worked by employees</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Team Average Productivity</h3>
              <p className="text-3xl font-bold text-indigo-600 mt-2">{formatNumber(teamAverages.avgJobsPerHour)} jobs/week</p>
              <p className="text-sm text-gray-500 mt-1">Based on 40 hour work week</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Average Completion Time</h3>
              <p className="text-3xl font-bold text-indigo-600 mt-2">{formatNumber(teamAverages.avgCompletionTime)} hours</p>
              <p className="text-sm text-gray-500 mt-1">Average time to complete a job</p>
            </div>
          </div>
          
          {/* Productivity Visualization */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Productivity Comparison
              </h2>
              
              {/* Productivity Bar Chart */}
              <div className="mt-6 space-y-6">
                {getSortedData().map((employee, index) => (
                  <div key={index} className="relative">
                    <div className="flex items-center">
                      <div className="w-32 text-sm font-medium truncate">
                        {employee.name}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center">
                          <div 
                            className="bg-indigo-500 h-4 rounded-full" 
                            style={{ width: `${(employee.jobsPerHour / 10) * 100}%` }}
                          ></div>
                          <span className="ml-2 text-sm text-gray-700">
                            {formatNumber(employee.jobsPerHour)} jobs/week
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Data Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Employee Productivity Details
              </h3>
              <span className="text-sm text-gray-500">
                Click column headers to sort
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      scope="col"  
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('name')}
                    >
                      Employee Name
                      {sortConfig.key === 'name' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('jobsCompleted')}
                    >
                      Jobs Completed
                      {sortConfig.key === 'jobsCompleted' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('hoursLogged')}
                    >
                      Hours Logged
                      {sortConfig.key === 'hoursLogged' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('jobsPerHour')}
                    >
                      Jobs per Week
                      {sortConfig.key === 'jobsPerHour' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('avgCompletionTime')}
                    >
                      Avg. Completion Time
                      {sortConfig.key === 'avgCompletionTime' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('efficiency')}
                    >
                      Efficiency
                      {sortConfig.key === 'efficiency' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getSortedData().map((employee, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {employee.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.jobsCompleted}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.hoursLogged}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                        {formatNumber(employee.jobsPerHour)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatNumber(employee.avgCompletionTime)} hours
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${
                                employee.efficiency >= 90 ? 'bg-green-500' : 
                                employee.efficiency >= 80 ? 'bg-green-400' :
                                employee.efficiency >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                              }`} 
                              style={{ width: `${employee.efficiency}%` }}
                            ></div>
                          </div>
                          <span className="ml-2">{employee.efficiency}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 