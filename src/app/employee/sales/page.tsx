'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistance } from 'date-fns';
import { 
  PlusIcon, 
  BuildingStorefrontIcon, 
  PhoneIcon, 
  DocumentIcon,
  CurrencyEuroIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Head from 'next/head';

interface SalesData {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  recentSales: Array<{
    id: string;
    customer: string;
    amount: number;
    date: string;
    status: string;
  }>;
}

// Status options for the sales pipeline
const STATUS_OPTIONS = [
  'Leaflet/Booklet Dropped',
  'Spoke with Manager',
  'Sample Requested',
  'Order Placed',
  'Converted'
] as const;

// Define activity type
interface SalesActivity {
  id: string;
  shopName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  status: typeof STATUS_OPTIONS[number];
  notes: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

// Form input type
interface ActivityFormInput {
  shopName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  status: typeof STATUS_OPTIONS[number];
  notes: string;
  date: string;
}

// Mock data - in a real implementation, this would come from an API
const mockActivities: SalesActivity[] = [
  {
    id: '1',
    shopName: 'City Print Shop',
    contactName: 'John Smith',
    contactEmail: 'john@cityprint.com',
    contactPhone: '+49 123 4567890',
    status: 'Sample Requested',
    notes: 'Interested in business cards and brochures. Will follow up next week.',
    date: '2023-10-15',
    createdAt: '2023-10-15T14:30:00Z',
    updatedAt: '2023-10-15T14:30:00Z'
  },
  {
    id: '2',
    shopName: 'Quick Copy Center',
    contactName: 'Maria Garcia',
    contactEmail: 'maria@quickcopy.com',
    contactPhone: '+49 987 6543210',
    status: 'Spoke with Manager',
    notes: 'They currently use a competitor but are open to quotes.',
    date: '2023-10-12',
    createdAt: '2023-10-12T10:15:00Z',
    updatedAt: '2023-10-12T10:15:00Z'
  },
  {
    id: '3',
    shopName: 'Print Express',
    contactName: 'David Lee',
    contactEmail: 'david@printexpress.com',
    contactPhone: '+49 234 5678901',
    status: 'Order Placed',
    notes: 'Ordered 1000 business cards and 500 flyers. Delivery expected in 1 week.',
    date: '2023-10-10',
    createdAt: '2023-10-10T16:45:00Z',
    updatedAt: '2023-10-10T16:45:00Z'
  },
  {
    id: '4',
    shopName: 'Banner Pro',
    contactName: 'Sarah Johnson',
    contactEmail: 'sarah@bannerpro.com',
    contactPhone: '+49 345 6789012',
    status: 'Converted',
    notes: 'Successfully onboarded as a regular customer. Monthly orders expected.',
    date: '2023-10-08',
    createdAt: '2023-10-08T11:30:00Z',
    updatedAt: '2023-10-08T11:30:00Z'
  },
  {
    id: '5',
    shopName: 'Office Supplies Plus',
    contactName: 'Michael Brown',
    contactEmail: 'michael@officesupplies.com',
    contactPhone: '+49 456 7890123',
    status: 'Leaflet/Booklet Dropped',
    notes: 'Left catalog with receptionist. Will follow up next week.',
    date: '2023-10-05',
    createdAt: '2023-10-05T09:00:00Z',
    updatedAt: '2023-10-05T09:00:00Z'
  }
];

export default function SalesCRMPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSalesEmployee, setIsSalesEmployee] = useState(false);
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('month'); // 'week', 'month', 'year', 'all'
  const [activities, setActivities] = useState<SalesActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | typeof STATUS_OPTIONS[number]>('all');
  const [showAddActivity, setShowAddActivity] = useState(false);
  
  // New activity form state
  const [newActivity, setNewActivity] = useState<ActivityFormInput>({
    shopName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    status: STATUS_OPTIONS[0],
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Get employee user from localStorage
        const userData = localStorage.getItem('employeeUser');
        if (!userData) {
          router.push('/login/employee');
          return;
        }

        const user = JSON.parse(userData);
        
        // Check if user is a sales employee
        const response = await fetch(`/api/employees/${user.id}/sales-status/check`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to check sales access');
        }
        
        setIsSalesEmployee(data.isSalesEmployee);
        
        if (!data.isSalesEmployee) {
          setError('You do not have access to the sales dashboard.');
          setIsLoading(false);
          return;
        }
        
        // Mock data for now - would be replaced with actual API calls
        setSalesData({
          totalSales: 42580.50,
          totalOrders: 24,
          averageOrderValue: 1774.19,
          recentSales: [
            {
              id: 'INV-0012',
              customer: 'Acme Corp',
              amount: 5420.75,
              date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'Paid'
            },
            {
              id: 'INV-0011',
              customer: 'Globex Inc',
              amount: 3780.00,
              date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'Pending'
            },
            {
              id: 'INV-0010',
              customer: 'Wayne Enterprises',
              amount: 8950.25,
              date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'Paid'
            },
            {
              id: 'INV-0009',
              customer: 'Stark Industries',
              amount: 6125.50,
              date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'Overdue'
            }
          ]
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking sales access:', error);
        setError('An error occurred while loading the sales dashboard.');
        setIsLoading(false);
      }
    };
    
    checkAccess();
  }, [router]);

  // Load activities (mock data for now)
  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setActivities(mockActivities);
      setLoading(false);
    }, 800);
  }, []);

  // Filter activities by status
  const filteredActivities = filterStatus === 'all' 
    ? activities 
    : activities.filter(activity => activity.status === filterStatus);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewActivity({
      ...newActivity,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create new activity with ID and timestamps
    const createdAt = new Date().toISOString();
    const newActivityWithId: SalesActivity = {
      ...newActivity,
      id: `temp-${Date.now()}`,
      createdAt,
      updatedAt: createdAt
    };
    
    // Add to activities list (in production, this would be an API call)
    setActivities([newActivityWithId, ...activities]);
    
    // Reset form and close modal
    setNewActivity({
      shopName: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      status: STATUS_OPTIONS[0],
      notes: '',
      date: new Date().toISOString().split('T')[0]
    });
    setShowAddActivity(false);
  };

  // Navigate to activity detail page
  const viewActivity = (id: string) => {
    router.push(`/employee/sales/activities/${id}`);
  };

  // Function to handle period change
  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    // In a real implementation, you would fetch new data based on the period
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !isSalesEmployee) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">{error || 'You do not have permission to view this page.'}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      <div className="px-4 py-6 bg-gray-50 min-h-screen">
        <div className="mb-6">
          <div className="mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Sales Pipeline</h1>
            <p className="mt-1 text-sm text-gray-600">
              Track your sales activities, visits, and follow-ups with potential customers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddActivity(true)}
            className="w-full sm:w-auto mt-4 flex items-center justify-center py-3 px-4 rounded-md border border-transparent bg-indigo-600 text-white text-base font-medium shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <PlusIcon className="h-5 w-5 mr-2" aria-hidden="true" />
            New Activity
          </button>
        </div>

        {/* Status Filter */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Status
          </label>
          <select
            id="status-filter"
            name="status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | typeof STATUS_OPTIONS[number])}
            className="block w-full py-3 px-4 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
          >
            <option value="all">All Activities</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {/* Sales Pipeline Summary - Mobile Friendly */}
        <div className="mb-6 overflow-x-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {STATUS_OPTIONS.map((status) => {
              const count = activities.filter(a => a.status === status).length;
              return (
                <div key={status} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {status === 'Leaflet/Booklet Dropped' && (
                          <DocumentIcon className="h-6 w-6 text-gray-400" />
                        )}
                        {status === 'Spoke with Manager' && (
                          <PhoneIcon className="h-6 w-6 text-blue-500" />
                        )}
                        {status === 'Sample Requested' && (
                          <ClockIcon className="h-6 w-6 text-yellow-500" />
                        )}
                        {status === 'Order Placed' && (
                          <CurrencyEuroIcon className="h-6 w-6 text-green-500" />
                        )}
                        {status === 'Converted' && (
                          <CheckCircleIcon className="h-6 w-6 text-indigo-600" />
                        )}
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dt className="text-sm font-medium text-gray-500 truncate">{status}</dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900">{count}</div>
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activities List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="py-12 flex justify-center">
              <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No activities matching the selected filter.
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredActivities.map((activity) => (
                <li key={activity.id}>
                  <div 
                    className="block hover:bg-gray-50 active:bg-gray-100 cursor-pointer p-4" 
                    onClick={() => viewActivity(activity.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <BuildingStorefrontIcon className="flex-shrink-0 h-5 w-5 text-gray-400" />
                        <p className="ml-2 text-base font-medium text-indigo-600 truncate">{activity.shopName}</p>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${activity.status === 'Converted' ? 'bg-green-100 text-green-800' : 
                          activity.status === 'Order Placed' ? 'bg-blue-100 text-blue-800' : 
                          activity.status === 'Sample Requested' ? 'bg-yellow-100 text-yellow-800' : 
                          activity.status === 'Spoke with Manager' ? 'bg-purple-100 text-purple-800' : 
                          'bg-gray-100 text-gray-800'}`}
                        >
                          {activity.status}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex flex-col sm:flex-row sm:items-center mb-2">
                        <p className="flex items-center text-sm text-gray-500 mb-1 sm:mb-0">
                          <PhoneIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                          {activity.contactName}
                        </p>
                        <p className="flex items-center text-sm text-gray-500 sm:ml-6">
                          <ClockIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                          {new Date(activity.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 line-clamp-2">{activity.notes}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Add Activity Modal - Mobile Optimized */}
        {showAddActivity && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="relative bg-white rounded-lg w-full max-w-lg mx-4 my-8">
              {/* Close button */}
              <button
                type="button"
                onClick={() => setShowAddActivity(false)}
                className="absolute top-3 right-3 text-gray-400 bg-white rounded-full p-1 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
              
              <div className="px-4 pt-5 pb-4 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  New Sales Activity
                </h3>
                
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="shopName" className="block text-sm font-medium text-gray-700 mb-1">
                        Shop/Company Name*
                      </label>
                      <input
                        type="text"
                        name="shopName"
                        id="shopName"
                        required
                        value={newActivity.shopName}
                        onChange={handleInputChange}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
                        placeholder="Enter shop name"
                      />
                    </div>
                    <div>
                      <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Person
                      </label>
                      <input
                        type="text"
                        name="contactName"
                        id="contactName"
                        value={newActivity.contactName}
                        onChange={handleInputChange}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
                        placeholder="Enter contact name"
                      />
                    </div>
                    <div>
                      <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        name="contactEmail"
                        id="contactEmail"
                        value={newActivity.contactEmail}
                        onChange={handleInputChange}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="text"
                        name="contactPhone"
                        id="contactPhone"
                        value={newActivity.contactPhone}
                        onChange={handleInputChange}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                        Status*
                      </label>
                      <select
                        id="status"
                        name="status"
                        required
                        value={newActivity.status}
                        onChange={handleInputChange}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                        Visit Date*
                      </label>
                      <input
                        type="date"
                        name="date"
                        id="date"
                        required
                        value={newActivity.date}
                        onChange={handleInputChange}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
                      />
                    </div>
                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        rows={4}
                        value={newActivity.notes}
                        onChange={handleInputChange}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
                        placeholder="Enter notes about your visit"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowAddActivity(false)}
                      className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex justify-center items-center py-3 px-4 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-full sm:w-auto inline-flex justify-center items-center py-3 px-4 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Save Activity
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 