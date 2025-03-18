'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Site Settings</h1>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-6">Company Information</h2>
              
              <div className="mb-8">
                <p className="text-gray-500 mb-4">
                  Configure your company information and branding settings.
                </p>
                
                <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-md">
                  <h4 className="font-medium">Coming Soon</h4>
                  <p>
                    Logo upload functionality and additional company settings will be available in a future update.
                  </p>
                </div>
                
                <hr className="my-6" />
                
                <h3 className="text-lg font-medium mb-4">Application Information</h3>
                <div className="rounded-md bg-gray-50 p-4">
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Application Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">PrintNPack Ltd</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Version</dt>
                      <dd className="mt-1 text-sm text-gray-900">1.0.0</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Contact Support</dt>
                      <dd className="mt-1 text-sm text-gray-900">support@printnpack.com</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                      <dd className="mt-1 text-sm text-gray-900">{new Date().toLocaleDateString()}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 