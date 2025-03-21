'use client';

import Link from 'next/link';
import { FiUsers, FiShoppingCart, FiClock, FiCreditCard, FiPackage, FiArrowRight } from 'react-icons/fi';
import Image from 'next/image';

export default function CustomerPortalLanding() {
  return (
    <div className="bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-indigo-600">PrintingMIS</span>
              <span className="ml-2 text-sm text-gray-500">Customer Portal</span>
            </div>
            <div>
              <Link
                href="/portal/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <div className="relative bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="md:flex md:items-center md:space-x-12">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                <span className="block">Manage your printing</span>
                <span className="block text-indigo-600">orders with ease</span>
              </h1>
              <p className="mt-4 text-lg text-gray-500">
                Our customer portal gives you full control over your printing orders. 
                Place new orders, track production status, and access your invoices - 
                all in one convenient place.
              </p>
              <div className="mt-10">
                <Link
                  href="/portal/login"
                  className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Sign In to Your Account <FiArrowRight className="ml-2" />
                </Link>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="relative h-64 md:h-72 lg:h-96 overflow-hidden rounded-lg shadow-xl">
                <div className="bg-indigo-100 absolute inset-0 flex items-center justify-center text-indigo-600">
                  <div className="text-center p-6">
                    <FiShoppingCart className="w-20 h-20 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold">Your Customer Dashboard</h3>
                    <p className="mt-2 text-indigo-800">Manage all your printing needs in one place</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-indigo-600 uppercase tracking-wide">Features</h2>
            <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight">
              Everything you need
            </p>
            <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
              Our customer portal provides all the tools you need to manage your printing orders efficiently.
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="bg-gray-50 p-6 rounded-lg shadow">
                <div className="w-12 h-12 rounded-md bg-indigo-500 flex items-center justify-center">
                  <FiPackage className="h-6 w-6 text-white" />
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900">Product Catalog</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Browse your personalized product catalog with customer-specific pricing and options.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="bg-gray-50 p-6 rounded-lg shadow">
                <div className="w-12 h-12 rounded-md bg-indigo-500 flex items-center justify-center">
                  <FiShoppingCart className="h-6 w-6 text-white" />
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900">Order Management</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Place new orders, view order history, and track the status of current orders.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="bg-gray-50 p-6 rounded-lg shadow">
                <div className="w-12 h-12 rounded-md bg-indigo-500 flex items-center justify-center">
                  <FiClock className="h-6 w-6 text-white" />
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900">Real-time Tracking</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Monitor the status of your jobs through every stage of the production process.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="bg-gray-50 p-6 rounded-lg shadow">
                <div className="w-12 h-12 rounded-md bg-indigo-500 flex items-center justify-center">
                  <FiCreditCard className="h-6 w-6 text-white" />
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900">Invoice Access</h3>
                  <p className="mt-2 text-base text-gray-500">
                    View and download your invoices and payment history in one convenient location.
                  </p>
                </div>
              </div>

              {/* Feature 5 */}
              <div className="bg-gray-50 p-6 rounded-lg shadow">
                <div className="w-12 h-12 rounded-md bg-indigo-500 flex items-center justify-center">
                  <FiUsers className="h-6 w-6 text-white" />
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900">User Management</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Manage user accounts and access permissions for your organization.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="bg-indigo-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to get started?</span>
            <span className="block text-indigo-200">Sign in to your account today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                href="/portal/login"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50"
              >
                Sign In
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <a
                href="mailto:support@printingmis.com"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-600"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-base text-gray-400">
              &copy; {new Date().getFullYear()} PrintingMIS. All rights reserved.
            </p>
            <p className="mt-2 text-sm text-gray-400">
              For support, please contact support@printingmis.com
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 