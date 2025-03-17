import { FiCalendar, FiUsers, FiPieChart, FiFileText, FiTruck, FiDollarSign } from 'react-icons/fi';

export default function FeatureSection() {
  const features = [
    {
      name: 'Job Tracking',
      description: 'Track all jobs from quote to delivery, with real-time status updates and progress monitoring.',
      icon: FiCalendar,
    },
    {
      name: 'Customer Management',
      description: 'Manage customer information, track communication history, and maintain relationships.',
      icon: FiUsers,
    },
    {
      name: 'Reporting & Analytics',
      description: 'Generate detailed reports on production efficiency, sales performance, and profitability.',
      icon: FiPieChart,
    },
    {
      name: 'Document Management',
      description: 'Store and organize all job-related files, proofs, and approvals in one central location.',
      icon: FiFileText,
    },
    {
      name: 'Delivery Management',
      description: 'Schedule and track deliveries, generate shipping labels, and notify customers of shipment status.',
      icon: FiTruck,
    },
    {
      name: 'Billing & Invoicing',
      description: 'Generate invoices, track payments, and manage accounts receivable efficiently.',
      icon: FiDollarSign,
    },
  ];

  return (
    <div className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">System Features</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Internal Management Tools
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Access all the tools you need to manage your daily operations efficiently.
          </p>
        </div>

        <div className="mt-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.name} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
                <div>
                  <span className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    <feature.icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-lg font-medium text-gray-900">{feature.name}</h3>
                  <p className="mt-2 text-base text-gray-500">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 