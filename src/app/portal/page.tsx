'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HiOutlineDocumentText, HiOutlineShoppingCart, HiOutlineClipboardCheck, HiOutlineInformationCircle } from 'react-icons/hi';

export default function Portal() {
  const [userName, setUserName] = useState('');
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    // Get user info from localStorage
    const userJson = localStorage.getItem('portalUser');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        setUserName(user.name || '');
        setCompanyName(user.companyName || '');
      } catch (err) {
        console.error('Failed to parse user data:', err);
      }
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to PrintPack Portal{userName ? `, ${userName}` : ''}</h1>
        {companyName && <p className="text-xl text-gray-600">{companyName}</p>}
      </div>

      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden mb-8">
        <div className="p-8">
          <div className="flex items-center mb-4">
            <HiOutlineInformationCircle className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-800 ml-2">About This Portal</h2>
          </div>
          <p className="text-gray-600 mb-4">
            This customer portal allows you to place orders, track your invoices, and manage your printing needs efficiently.
            Use the navigation menu to access different features, or explore the key sections highlighted below.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <HiOutlineShoppingCart className="h-8 w-8 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-800 ml-2">Products</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Browse our catalog of available products and place orders directly from our selection.
              Each product includes detailed specifications and pricing information.
            </p>
            <Link 
              href="/portal/products" 
              className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <HiOutlineClipboardCheck className="h-8 w-8 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-800 ml-2">Orders</h3>
            </div>
            <p className="text-gray-600 mb-4">
              View your order history, check order status, and manage upcoming deliveries.
              Track the progress of your orders from submission to completion.
            </p>
            <Link 
              href="/portal/orders" 
              className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              View Orders
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <HiOutlineDocumentText className="h-8 w-8 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-800 ml-2">Invoices</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Access and download your invoices, check payment status, and review previous transactions.
              All invoices include detailed breakdowns of products and services.
            </p>
            <Link 
              href="/portal/invoices" 
              className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              View Invoices
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden mb-8">
        <div className="p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">How to Use the Portal</h2>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-700 mb-2">1. Placing an Order</h3>
            <ol className="list-decimal list-inside text-gray-600 ml-4 space-y-1">
              <li>Navigate to the Products section</li>
              <li>Browse the catalog and select the products you want</li>
              <li>Click "Add to Cart" for each product, specifying the quantity</li>
              <li>Review your cart and proceed to checkout</li>
              <li>Fill in delivery and payment details</li>
              <li>Submit your order</li>
            </ol>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-700 mb-2">2. Tracking Orders</h3>
            <ol className="list-decimal list-inside text-gray-600 ml-4 space-y-1">
              <li>Go to the Orders section</li>
              <li>View a list of all your orders with their current status</li>
              <li>Click on any order to see detailed information</li>
              <li>Use filters to find specific orders by date or status</li>
            </ol>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">3. Managing Invoices</h3>
            <ol className="list-decimal list-inside text-gray-600 ml-4 space-y-1">
              <li>Visit the Invoices section</li>
              <li>See all invoices with payment status indicators</li>
              <li>Click on an invoice to view or download a copy</li>
              <li>Filter invoices by date range or status</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-gray-600">
          Need assistance? Contact our customer support team at <a href="mailto:support@printpack.com" className="text-blue-600 hover:underline">support@printpack.com</a>
        </p>
      </div>
    </div>
  );
} 