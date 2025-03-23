'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeftIcon, 
  BuildingStorefrontIcon,
  PhoneIcon, 
  EnvelopeIcon,
  CalendarIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import Head from 'next/head';

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

export default function ActivityDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [activity, setActivity] = useState<SalesActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<SalesActivity>>({});
  const [followUps, setFollowUps] = useState<{
    id: string;
    date: string;
    notes: string;
    completed: boolean;
  }[]>([
    {
      id: '1',
      date: '2023-10-25',
      notes: 'Call to check if they received the sample materials',
      completed: false
    },
    {
      id: '2',
      date: '2023-10-18',
      notes: 'Sent brochure samples by courier',
      completed: true
    }
  ]);
  const [newFollowUp, setNewFollowUp] = useState({
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);

  // Fetch activity data (mock for now)
  useEffect(() => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // This would be a real API call in production
      const mockActivity: SalesActivity = {
        id: params.id,
        shopName: 'City Print Shop',
        contactName: 'John Smith',
        contactEmail: 'john@cityprint.com',
        contactPhone: '+49 123 4567890',
        status: 'Sample Requested',
        notes: 'Interested in business cards and brochures. Will follow up next week. The shop owner mentioned they currently use a competitor but are unhappy with the quality. They specifically need high-quality business cards with spot UV coating.',
        date: '2023-10-15',
        createdAt: '2023-10-15T14:30:00Z',
        updatedAt: '2023-10-15T14:30:00Z'
      };
      
      setActivity(mockActivity);
      setFormData(mockActivity);
      setLoading(false);
    }, 800);
  }, [params.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activity) return;
    
    // Update the activity
    const updatedActivity = {
      ...activity,
      ...formData,
      updatedAt: new Date().toISOString()
    };
    
    // This would be an API call in production
    setActivity(updatedActivity);
    setIsEditing(false);
  };

  const handleFollowUpChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewFollowUp({
      ...newFollowUp,
      [name]: value
    });
  };

  const addFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    
    const followUp = {
      id: `followup-${Date.now()}`,
      date: newFollowUp.date,
      notes: newFollowUp.notes,
      completed: false
    };
    
    setFollowUps([followUp, ...followUps]);
    setNewFollowUp({
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowFollowUpForm(false);
  };

  const toggleFollowUpStatus = (id: string) => {
    setFollowUps(followUps.map(item => {
      if (item.id === id) {
        return { ...item, completed: !item.completed };
      }
      return item;
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        <svg className="animate-spin h-12 w-12 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-center text-gray-600 text-lg">Loading activity details...</p>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Activity not found</h2>
          <p className="text-gray-600 mb-6">
            The sales activity you're looking for doesn't exist or has been removed.
          </p>
          <button
            type="button"
            onClick={() => router.push('/employee/sales')}
            className="w-full py-3 px-4 flex items-center justify-center bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Sales Pipeline
          </button>
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
        {/* Header with back button */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.push('/employee/sales')}
            className="inline-flex items-center px-4 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2 text-gray-500" />
            Back
          </button>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Activity Details</h1>
        </div>

        {/* Activity Details */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="px-4 py-5 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                {activity.shopName}
              </h2>
              <p className="text-sm text-gray-500">
                Visit on {new Date(activity.date).toLocaleDateString()}
              </p>
            </div>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="mt-4 sm:mt-0 flex items-center px-4 py-2 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PencilIcon className="h-5 w-5 mr-2 text-gray-500" />
                Edit
              </button>
            )}
          </div>

          {!isEditing ? (
            <div className="border-t border-gray-200 px-4 py-5">
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-2">Status</h3>
                  <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full 
                    ${activity.status === 'Converted' ? 'bg-green-100 text-green-800' : 
                    activity.status === 'Order Placed' ? 'bg-blue-100 text-blue-800' : 
                    activity.status === 'Sample Requested' ? 'bg-yellow-100 text-yellow-800' : 
                    activity.status === 'Spoke with Manager' ? 'bg-purple-100 text-purple-800' : 
                    'bg-gray-100 text-gray-800'}`}
                  >
                    {activity.status}
                  </span>
                </div>
                
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-2">Shop/Company</h3>
                  <div className="flex items-center">
                    <BuildingStorefrontIcon className="flex-shrink-0 h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-900">{activity.shopName}</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-2">Contact Person</h3>
                  <span className="text-gray-900">{activity.contactName}</span>
                </div>
                
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-2">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <PhoneIcon className="flex-shrink-0 h-5 w-5 text-gray-400 mr-2" />
                      <a href={`tel:${activity.contactPhone}`} className="text-indigo-600 underline hover:text-indigo-500">
                        {activity.contactPhone}
                      </a>
                    </div>
                    <div className="flex items-center">
                      <EnvelopeIcon className="flex-shrink-0 h-5 w-5 text-gray-400 mr-2" />
                      <a href={`mailto:${activity.contactEmail}`} className="text-indigo-600 underline hover:text-indigo-500">
                        {activity.contactEmail}
                      </a>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-2">Visit Date</h3>
                  <div className="flex items-center">
                    <CalendarIcon className="flex-shrink-0 h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-900">{new Date(activity.date).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-2">Notes</h3>
                  <p className="text-gray-900 whitespace-pre-line">{activity.notes}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-t border-gray-200 px-4 py-5">
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="status" className="block text-base font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="shopName" className="block text-base font-medium text-gray-700 mb-1">
                      Shop/Company Name
                    </label>
                    <input
                      type="text"
                      name="shopName"
                      id="shopName"
                      value={formData.shopName}
                      onChange={handleInputChange}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="contactName" className="block text-base font-medium text-gray-700 mb-1">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      name="contactName"
                      id="contactName"
                      value={formData.contactName}
                      onChange={handleInputChange}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="contactEmail" className="block text-base font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="contactEmail"
                      id="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="contactPhone" className="block text-base font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      name="contactPhone"
                      id="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="date" className="block text-base font-medium text-gray-700 mb-1">
                      Visit Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      id="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="notes" className="block text-base font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={5}
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(activity);
                        setIsEditing(false);
                      }}
                      className="mt-3 sm:mt-0 py-3 px-4 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="py-3 px-4 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Follow-Up Section */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Follow-Up Tasks
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Track your follow-up activities for this prospect
              </p>
            </div>
            {!showFollowUpForm && (
              <button
                type="button"
                onClick={() => setShowFollowUpForm(true)}
                className="mt-4 sm:mt-0 flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="h-5 w-5 mr-2 text-gray-500" />
                Add Follow-Up
              </button>
            )}
          </div>

          <div className="border-t border-gray-200">
            {showFollowUpForm && (
              <div className="px-4 py-5 border-b border-gray-200">
                <form onSubmit={addFollowUp}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="followup-date" className="block text-base font-medium text-gray-700 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        name="date"
                        id="followup-date"
                        value={newFollowUp.date}
                        onChange={handleFollowUpChange}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="followup-notes" className="block text-base font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        id="followup-notes"
                        name="notes"
                        rows={4}
                        placeholder="Describe the follow-up task"
                        value={newFollowUp.notes}
                        onChange={handleFollowUpChange}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowFollowUpForm(false)}
                        className="mt-3 sm:mt-0 py-3 px-4 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="py-3 px-4 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Add Task
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            <ul className="divide-y divide-gray-200">
              {followUps.length === 0 ? (
                <li className="px-4 py-5 text-center text-gray-500">
                  No follow-up tasks scheduled. Add one to keep track of your next steps.
                </li>
              ) : (
                followUps.map((followUp) => (
                  <li key={followUp.id} className="px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center min-w-0">
                        <button
                          onClick={() => toggleFollowUpStatus(followUp.id)}
                          className={`flex-shrink-0 h-6 w-6 rounded-full border ${
                            followUp.completed 
                              ? 'bg-green-500 border-green-500 text-white' 
                              : 'border-gray-300 text-transparent'
                          } flex items-center justify-center focus:outline-none`}
                          aria-label={followUp.completed ? "Mark as incomplete" : "Mark as complete"}
                        >
                          {followUp.completed && <CheckIcon className="h-4 w-4" />}
                        </button>
                        <div className="ml-3 min-w-0">
                          <p className={`text-base font-medium ${followUp.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {followUp.notes}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(followUp.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setFollowUps(followUps.filter(item => item.id !== followUp.id));
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          aria-label="Delete task"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
} 