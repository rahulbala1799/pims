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
      <div className="px-4 sm:px-6 lg:px-8 py-8 flex justify-center">
        <svg className="animate-spin h-10 w-10 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900">Activity not found</h2>
          <p className="mt-2 text-sm text-gray-500">
            The sales activity you're looking for doesn't exist or has been removed.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => router.push('/employee/sales')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" />
              Back to Sales Pipeline
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with back button */}
      <div className="mb-6 flex items-center">
        <button
          type="button"
          onClick={() => router.push('/employee/sales')}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowLeftIcon className="-ml-1 mr-1 h-5 w-5 text-gray-500" />
          Back
        </button>
        <h1 className="ml-4 text-xl font-semibold text-gray-900">Sales Activity Details</h1>
      </div>

      {/* Activity Details */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {activity.shopName}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Visit on {new Date(activity.date).toLocaleDateString()}
            </p>
          </div>
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PencilIcon className="-ml-1 mr-1 h-4 w-4 text-gray-500" />
              Edit
            </button>
          )}
        </div>

        {!isEditing ? (
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${activity.status === 'Converted' ? 'bg-green-100 text-green-800' : 
                    activity.status === 'Order Placed' ? 'bg-blue-100 text-blue-800' : 
                    activity.status === 'Sample Requested' ? 'bg-yellow-100 text-yellow-800' : 
                    activity.status === 'Spoke with Manager' ? 'bg-purple-100 text-purple-800' : 
                    'bg-gray-100 text-gray-800'}`}
                  >
                    {activity.status}
                  </span>
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Shop/Company</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
                  <BuildingStorefrontIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                  {activity.shopName}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Contact Person</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {activity.contactName}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Contact Information</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="flex items-center mb-2">
                    <PhoneIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                    <a href={`tel:${activity.contactPhone}`} className="text-indigo-600 hover:text-indigo-500">
                      {activity.contactPhone}
                    </a>
                  </div>
                  <div className="flex items-center">
                    <EnvelopeIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                    <a href={`mailto:${activity.contactEmail}`} className="text-indigo-600 hover:text-indigo-500">
                      {activity.contactEmail}
                    </a>
                  </div>
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Visit Date</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
                  <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                  {new Date(activity.date).toLocaleDateString()}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Notes</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {activity.notes}
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="shopName" className="block text-sm font-medium text-gray-700">
                    Shop/Company Name
                  </label>
                  <input
                    type="text"
                    name="shopName"
                    id="shopName"
                    value={formData.shopName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    name="contactName"
                    id="contactName"
                    value={formData.contactName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      name="contactEmail"
                      id="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">
                      Phone
                    </label>
                    <input
                      type="text"
                      name="contactPhone"
                      id="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                    Visit Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    id="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={4}
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(activity);
                      setIsEditing(false);
                    }}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Follow-Up Tasks
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Track your follow-up activities for this prospect
            </p>
          </div>
          {!showFollowUpForm && (
            <button
              type="button"
              onClick={() => setShowFollowUpForm(true)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="-ml-1 mr-1 h-4 w-4 text-gray-500" />
              Add Follow-Up
            </button>
          )}
        </div>
        <div className="border-t border-gray-200">
          {showFollowUpForm && (
            <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
              <form onSubmit={addFollowUp}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="followup-date" className="block text-sm font-medium text-gray-700">
                      Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      id="followup-date"
                      value={newFollowUp.date}
                      onChange={handleFollowUpChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="followup-notes" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id="followup-notes"
                      name="notes"
                      rows={3}
                      placeholder="Describe the follow-up task"
                      value={newFollowUp.notes}
                      onChange={handleFollowUpChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowFollowUpForm(false)}
                      className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
              <li className="px-4 py-5 sm:px-6 text-center text-sm text-gray-500">
                No follow-up tasks scheduled. Add one to keep track of your next steps.
              </li>
            ) : (
              followUps.map((followUp) => (
                <li key={followUp.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <button
                        onClick={() => toggleFollowUpStatus(followUp.id)}
                        className={`flex-shrink-0 h-5 w-5 rounded-full border ${
                          followUp.completed 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : 'border-gray-300 text-transparent'
                        } flex items-center justify-center focus:outline-none`}
                      >
                        {followUp.completed && <CheckIcon className="h-3 w-3" />}
                      </button>
                      <div className="ml-3">
                        <p className={`text-sm font-medium ${followUp.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                          {followUp.notes}
                        </p>
                        <p className="text-sm text-gray-500">
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
                        className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <XMarkIcon className="h-4 w-4 text-red-500" />
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
  );
} 