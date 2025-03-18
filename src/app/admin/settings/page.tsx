'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SettingsPage() {
  const [logo, setLogo] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Check if we already have a logo at page load
  useEffect(() => {
    // In a real app, you might fetch this from an API
    // For now, we'll just check if the logo file exists
    // Use the browser's Image constructor
    if (typeof window !== 'undefined') {
      const img = new window.Image();
      img.src = '/images/logo.png?cache=' + new Date().getTime(); // Cache busting
      img.onload = () => {
        setLogo('/images/logo.png');
      };
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
      setErrorMessage('Please select an image file (JPEG, PNG, GIF, etc.)');
      return;
    }

    // Preview the selected image
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setLogo(result);
    };
    reader.readAsDataURL(file);
  };
  
  const uploadLogo = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      setErrorMessage('Please select a file first');
      return;
    }
    
    setUploading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    const formData = new FormData();
    formData.append('logo', fileInputRef.current.files[0]);
    
    try {
      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload logo');
      }
      
      setSuccessMessage('Logo uploaded successfully!');
      
      // Force a refresh of the logo throughout the app
      router.refresh();
    } catch (error) {
      console.error('Error uploading logo:', error);
      setErrorMessage('Failed to upload logo. Please try again.');
    } finally {
      setUploading(false);
    }
  };
  
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
              <h2 className="text-2xl font-semibold mb-6">Company Branding</h2>
              
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Company Logo</h3>
                <p className="text-gray-500 mb-4">
                  Upload your company logo. This will be used on invoices, reports, and throughout the application.
                </p>
                
                {/* Logo preview */}
                <div className="mb-4">
                  <div className="border border-gray-300 rounded-lg p-4 w-full max-w-md flex items-center justify-center bg-gray-50">
                    {logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logo}
                        alt="Company logo"
                        className="max-h-40 max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-gray-400 text-center py-10">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-12 w-12 mx-auto mb-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <p>No logo uploaded</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* File input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select a new logo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                    className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-indigo-50 file:text-indigo-700
                    hover:file:bg-indigo-100"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Recommended: PNG or JPEG, at least 400x200 pixels
                  </p>
                </div>
                
                {/* Upload button */}
                <button
                  type="button"
                  onClick={uploadLogo}
                  disabled={uploading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    'Upload Logo'
                  )}
                </button>
                
                {/* Success message */}
                {successMessage && (
                  <div className="mt-4 p-3 bg-green-50 text-green-800 rounded-md">
                    {successMessage}
                  </div>
                )}
                
                {/* Error message */}
                {errorMessage && (
                  <div className="mt-4 p-3 bg-red-50 text-red-800 rounded-md">
                    {errorMessage}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 