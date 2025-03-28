'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FiUsers, 
  FiDatabase, 
  FiShoppingCart, 
  FiFileText, 
  FiPackage, 
  FiCheck, 
  FiX,
  FiPlus,
  FiSettings,
  FiTrash2,
  FiEdit,
  FiEye,
  FiEyeOff,
  FiDollarSign
} from 'react-icons/fi';

interface ApiConnection {
  name: string;
  status: 'connected' | 'error' | 'pending';
  endpoint: string;
  icon: any;
  description: string;
}

interface Customer {
  id: string;
  name: string;
}

interface PortalUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: string;
  status: string;
  customerId: string;
  customerName: string;
  lastLogin?: string;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  productClass: string;
  basePrice: number;
  unit: string;
  isActive: boolean;
}

interface CustomerCatalog {
  customerId: string;
  customerName: string;
  totalProducts: number;
  visibleProducts: number;
  hasCustomPricing: boolean;
  lastUpdated: string;
}

export default function CustomerPortalPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'products' | 'settings'>('overview');
  const [portalUsers, setPortalUsers] = useState<PortalUser[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // User form state
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<PortalUser | null>(null);
  const [userForm, setUserForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'STANDARD',
    status: 'ACTIVE',
    customerId: ''
  });
  
  // Add a new state for customers loading
  const [customersLoading, setCustomersLoading] = useState(false);
  
  // Add a new state for customer loading errors
  const [customerError, setCustomerError] = useState<string | null>(null);
  
  // Product catalog states
  const [customerCatalogs, setCustomerCatalogs] = useState<CustomerCatalog[]>([]);
  const [catalogsLoading, setCatalogsLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  
  // Product management modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [customerProducts, setCustomerProducts] = useState<{
    id: string;
    productId: string;
    customPrice: number | null;
    isVisible: boolean;
    customerProductCode?: string;
    customerProductName?: string;
  }[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  
  // Mock API connections
  const apiConnections: ApiConnection[] = [
    {
      name: 'Customer Database',
      status: 'connected',
      endpoint: '/api/portal/customers',
      icon: FiUsers,
      description: 'Access to customer information and authentication'
    },
    {
      name: 'Product Database',
      status: 'connected',
      endpoint: '/api/portal/products',
      icon: FiPackage,
      description: 'Customer-specific product catalogs and pricing'
    },
    {
      name: 'Order Management',
      status: 'connected',
      endpoint: '/api/portal/orders',
      icon: FiShoppingCart,
      description: 'Customer order processing and tracking'
    },
    {
      name: 'Invoice Database',
      status: 'connected',
      endpoint: '/api/portal/invoices',
      icon: FiFileText,
      description: 'Access to customer invoice history and payments'
    },
    {
      name: 'Job Database',
      status: 'connected',
      endpoint: '/api/portal/jobs',
      icon: FiDatabase,
      description: 'Job status tracking and updates'
    }
  ];
  
  // Fetch portal users
  useEffect(() => {
    if (activeTab === 'users') {
      fetchPortalUsers();
    }
  }, [activeTab]);
  
  // Fetch customers for dropdown
  useEffect(() => {
    if (showUserModal) {
      fetchCustomers();
    }
  }, [showUserModal]);

  // Fetch customer catalogs when products tab is active
  useEffect(() => {
    if (activeTab === 'products') {
      fetchCustomerCatalogs();
    }
  }, [activeTab]);
  
  // Fetch all products and customer products when product modal is shown
  useEffect(() => {
    if (showProductModal && selectedCustomerId) {
      fetchAllProducts();
      fetchCustomerProducts(selectedCustomerId);
    }
  }, [showProductModal, selectedCustomerId]);
  
  const fetchPortalUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/portal/users');
      if (!response.ok) {
        throw new Error('Failed to fetch portal users');
      }
      
      const data = await response.json();
      setPortalUsers(data.users || []);
    } catch (err: any) {
      console.error('Error fetching portal users:', err);
      setError(err.message || 'An error occurred while fetching portal users');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchCustomers = async () => {
    try {
      setCustomersLoading(true);
      setCustomerError(null);
      const response = await fetch('/api/customers');
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      
      const data = await response.json();
      // Check the structure of the data returned by the API
      // Some APIs might return data directly, others might nest it under a property
      if (Array.isArray(data)) {
        // If the response is a direct array of customers
        setCustomers(data);
      } else if (data.customers && Array.isArray(data.customers)) {
        // If the response has a customers property
        setCustomers(data.customers);
      } else if (data.data && Array.isArray(data.data)) {
        // Some APIs use a data property
        setCustomers(data.data);
      } else {
        console.error('Unexpected API response format:', data);
        setCustomerError('Unexpected API response format');
      }
      
      // Log for debugging
      console.log('Customers API response:', data);
    } catch (err: any) {
      console.error('Error fetching customers:', err);
      setCustomerError(err.message || 'Failed to load customers');
    } finally {
      setCustomersLoading(false);
    }
  };

  // Fetch customer catalogs with product counts
  const fetchCustomerCatalogs = async () => {
    try {
      setCatalogsLoading(true);
      setCatalogError(null);
      
      // First, get all customers
      const customersResponse = await fetch('/api/customers');
      if (!customersResponse.ok) {
        throw new Error('Failed to fetch customers');
      }
      
      let customersData;
      const customersJson = await customersResponse.json();
      
      if (Array.isArray(customersJson)) {
        customersData = customersJson;
      } else if (customersJson.customers && Array.isArray(customersJson.customers)) {
        customersData = customersJson.customers;
      } else if (customersJson.data && Array.isArray(customersJson.data)) {
        customersData = customersJson.data;
      } else {
        throw new Error('Unexpected customers API response format');
      }
      
      // For each customer, get catalog stats
      const catalogPromises = customersData.map(async (customer: Customer) => {
        try {
          const response = await fetch(`/api/portal/catalog/stats?customerId=${customer.id}`);
          
          if (!response.ok) {
            // If we can't get catalog stats, create default values
            return {
              customerId: customer.id,
              customerName: customer.name,
              totalProducts: 0,
              visibleProducts: 0,
              hasCustomPricing: false,
              lastUpdated: 'Never'
            };
          }
          
          const data = await response.json();
          return {
            customerId: customer.id,
            customerName: customer.name,
            totalProducts: data.totalProducts || 0,
            visibleProducts: data.visibleProducts || 0,
            hasCustomPricing: data.hasCustomPricing || false,
            lastUpdated: data.lastUpdated || 'Never'
          };
        } catch (err) {
          console.error(`Error fetching catalog for customer ${customer.id}:`, err);
          return {
            customerId: customer.id,
            customerName: customer.name,
            totalProducts: 0,
            visibleProducts: 0,
            hasCustomPricing: false,
            lastUpdated: 'Never'
          };
        }
      });
      
      const catalogs = await Promise.all(catalogPromises);
      setCustomerCatalogs(catalogs);
      
    } catch (err: any) {
      console.error('Error fetching customer catalogs:', err);
      setCatalogError(err.message || 'An error occurred while fetching catalogs');
    } finally {
      setCatalogsLoading(false);
    }
  };
  
  // Fetch all products
  const fetchAllProducts = async () => {
    try {
      setProductsLoading(true);
      setProductError(null);
      
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      let products;
      
      if (Array.isArray(data)) {
        products = data;
      } else if (data.products && Array.isArray(data.products)) {
        products = data.products;
      } else if (data.data && Array.isArray(data.data)) {
        products = data.data;
      } else {
        throw new Error('Unexpected products API response format');
      }
      
      setAllProducts(products.filter((p: any) => p.isActive));
      
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setProductError(err.message || 'An error occurred while fetching products');
    } finally {
      setProductsLoading(false);
    }
  };
  
  // Fetch customer-specific products
  const fetchCustomerProducts = async (customerId: string) => {
    try {
      setProductsLoading(true);
      setProductError(null);
      
      const response = await fetch(`/api/portal/catalog?customerId=${customerId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch customer catalog');
      }
      
      const data = await response.json();
      setCustomerProducts(data.catalog || []);
      
    } catch (err: any) {
      console.error('Error fetching customer catalog:', err);
      setProductError(err.message || 'An error occurred while fetching customer catalog');
    } finally {
      setProductsLoading(false);
    }
  };
  
  const handleAddUser = () => {
    setEditingUser(null);
    setUserForm({
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      role: 'STANDARD',
      status: 'ACTIVE',
      customerId: customers.length > 0 ? customers[0].id : ''
    });
    setShowUserModal(true);
  };
  
  const handleEditUser = (user: PortalUser) => {
    setEditingUser(user);
    setUserForm({
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      password: '', // Don't populate password when editing
      role: user.role,
      status: user.status,
      customerId: user.customerId
    });
    setShowUserModal(true);
  };
  
  const handleUserFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate form
      if (!userForm.email || (!editingUser && !userForm.password) || !userForm.customerId) {
        setError('Please fill in all required fields');
        setIsLoading(false);
        return;
      }
      
      let response;
      
      if (editingUser) {
        // Update existing user
        response = await fetch(`/api/portal/users/${editingUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userForm),
        });
      } else {
        // Create new user
        response = await fetch('/api/portal/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userForm),
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save user');
      }
      
      // Refresh the user list
      await fetchPortalUsers();
      
      // Close the modal
      setShowUserModal(false);
    } catch (err: any) {
      console.error('Error saving portal user:', err);
      setError(err.message || 'An error occurred while saving the user');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/portal/users/${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      
      // Refresh the user list
      await fetchPortalUsers();
    } catch (err: any) {
      console.error('Error deleting portal user:', err);
      setError(err.message || 'An error occurred while deleting the user');
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };
  
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Admin';
      case 'STANDARD': return 'Standard';
      case 'VIEWER': return 'Viewer';
      default: return role;
    }
  };
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Function to handle updating a customer's product catalog
  const handleManageCatalog = (customerId: string, customerName: string) => {
    setSelectedCustomerId(customerId);
    setSelectedCustomerName(customerName);
    setShowProductModal(true);
  };
  
  // Handle toggling product visibility in customer catalog
  const handleProductVisibilityToggle = (productId: string, isVisible: boolean) => {
    setCustomerProducts(prev => {
      // Find if the product is already in the customer catalog
      const existingIndex = prev.findIndex(p => p.productId === productId);
      
      if (existingIndex >= 0) {
        // Update existing entry
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          isVisible
        };
        return updated;
      } else {
        // Create new entry
        return [
          ...prev,
          {
            id: '', // Will be assigned by the server
            productId,
            customPrice: null,
            isVisible,
            customerProductCode: '',
            customerProductName: ''
          }
        ];
      }
    });
  };
  
  // Handle changing custom price
  const handleCustomPriceChange = (productId: string, price: number | null) => {
    setCustomerProducts(prev => {
      // Find if the product is already in the customer catalog
      const existingIndex = prev.findIndex(p => p.productId === productId);
      
      if (existingIndex >= 0) {
        // Update existing entry
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          customPrice: price
        };
        return updated;
      } else {
        // Create new entry with visibility defaulted to true
        return [
          ...prev,
          {
            id: '', // Will be assigned by the server
            productId,
            customPrice: price,
            isVisible: true,
            customerProductCode: '',
            customerProductName: ''
          }
        ];
      }
    });
  };
  
  // Handle changing custom product code
  const handleCustomProductCodeChange = (productId: string, code: string) => {
    setCustomerProducts(prev => {
      // Find if the product is already in the customer catalog
      const existingIndex = prev.findIndex(p => p.productId === productId);
      
      if (existingIndex >= 0) {
        // Update existing entry
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          customerProductCode: code
        };
        return updated;
      } else {
        // Create new entry with visibility defaulted to true
        return [
          ...prev,
          {
            id: '', // Will be assigned by the server
            productId,
            customPrice: null,
            isVisible: true,
            customerProductCode: code,
            customerProductName: ''
          }
        ];
      }
    });
  };
  
  // Handle changing custom product name
  const handleCustomProductNameChange = (productId: string, name: string) => {
    setCustomerProducts(prev => {
      // Find if the product is already in the customer catalog
      const existingIndex = prev.findIndex(p => p.productId === productId);
      
      if (existingIndex >= 0) {
        // Update existing entry
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          customerProductName: name
        };
        return updated;
      } else {
        // Create new entry with visibility defaulted to true
        return [
          ...prev,
          {
            id: '', // Will be assigned by the server
            productId,
            customPrice: null,
            isVisible: true,
            customerProductCode: '',
            customerProductName: name
          }
        ];
      }
    });
  };
  
  // Handle saving catalog changes
  const handleSaveCatalog = async () => {
    if (!selectedCustomerId) return;
    
    try {
      setProductsLoading(true);
      setProductError(null);
      
      const response = await fetch(`/api/portal/catalog`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          products: customerProducts
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save catalog');
      }
      
      // Close the modal
      setShowProductModal(false);
      
      // Refresh the catalogs list
      fetchCustomerCatalogs();
      
    } catch (err: any) {
      console.error('Error saving catalog:', err);
      setProductError(err.message || 'An error occurred while saving the catalog');
    } finally {
      setProductsLoading(false);
    }
  };
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Customer Portal Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure and manage your B2B customer ordering platform
        </p>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`${
                activeTab === 'users'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
            >
              Portal Users
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`${
                activeTab === 'products'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
            >
              Product Catalog
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`${
                activeTab === 'settings'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
            >
              Settings
            </button>
          </nav>
        </div>
        
        {/* Tab content */}
        <div className="py-6">
          {activeTab === 'overview' && (
            <div>
              <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                <div className="px-4 py-5 sm:px-6">
                  <h2 className="text-lg leading-6 font-medium text-gray-900">Portal Information</h2>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">Customer portal details and statistics</p>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Portal URL</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <a href="https://portal.printingmis.com" target="_blank" className="text-indigo-600 hover:text-indigo-900">
                          https://portal.printingmis.com
                        </a>
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Active Customers</dt>
                      <dd className="mt-1 text-sm text-gray-900">12</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Last Order</dt>
                      <dd className="mt-1 text-sm text-gray-900">Today at 14:23</dd>
                    </div>
                  </dl>
                </div>
              </div>
              
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">API Connections</h3>
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {apiConnections.map((connection) => (
                    <li key={connection.name}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <connection.icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                            <p className="ml-3 text-sm font-medium text-gray-900">{connection.name}</p>
                          </div>
                          <div className="ml-2 flex-shrink-0 flex">
                            {connection.status === 'connected' ? (
                              <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                <FiCheck className="mr-1 h-3 w-3 mt-0.5" /> Connected
                              </p>
                            ) : connection.status === 'error' ? (
                              <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                <FiX className="mr-1 h-3 w-3 mt-0.5" /> Error
                              </p>
                            ) : (
                              <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Pending
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              {connection.endpoint}
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            {connection.description}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-8 flex">
                <Link href="/portal" target="_blank" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Visit Customer Portal
                </Link>
              </div>
            </div>
          )}
          
          {activeTab === 'users' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                  <h2 className="text-lg leading-6 font-medium text-gray-900">Portal Users</h2>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage customer access to the portal</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddUser}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FiPlus className="-ml-1 mr-2 h-4 w-4" />
                  Add User
                </button>
              </div>
              
              {error && (
                <div className="mx-6 mt-4 bg-red-50 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FiX className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{error}</h3>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="border-t border-gray-200">
                {isLoading && activeTab === 'users' ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Login
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {portalUsers.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                              No portal users found. Click "Add User" to create your first portal user.
                            </td>
                          </tr>
                        ) : (
                          portalUsers.map((user) => (
                            <tr key={user.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-sm font-medium text-gray-500">
                                      {user.firstName && user.lastName 
                                        ? `${user.firstName[0]}${user.lastName[0]}`
                                        : user.email.substring(0, 2).toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{user.name || 'Unnamed User'}</div>
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{user.customerName}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{getRoleDisplay(user.role)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(user.status)}`}>
                                  {user.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(user.lastLogin)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-3">
                                  <button
                                    onClick={() => handleEditUser(user)}
                                    className="text-indigo-600 hover:text-indigo-900"
                                  >
                                    <FiEdit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    <FiTrash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'products' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                  <h2 className="text-lg leading-6 font-medium text-gray-900">Product Catalog Management</h2>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage which products are visible to customers</p>
                </div>
                <button
                  type="button"
                  onClick={fetchCustomerCatalogs}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FiSettings className="-ml-1 mr-2 h-4 w-4" />
                  Refresh Catalogs
                </button>
              </div>
              
              {catalogError && (
                <div className="mx-6 mt-4 bg-red-50 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FiX className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{catalogError}</h3>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="border-t border-gray-200">
                {catalogsLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Products Visible
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Custom Pricing
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Updated
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Manage</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {customerCatalogs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                              No customer catalogs found. Add products to customer catalogs to get started.
                            </td>
                          </tr>
                        ) : (
                          customerCatalogs.map((catalog) => (
                            <tr key={catalog.customerId}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{catalog.customerName}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {catalog.visibleProducts} / {catalog.totalProducts}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${catalog.hasCustomPricing ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                  {catalog.hasCustomPricing ? 'Yes' : 'No'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {catalog.lastUpdated}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button 
                                  onClick={() => handleManageCatalog(catalog.customerId, catalog.customerName)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  Manage Products
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg leading-6 font-medium text-gray-900">Portal Settings</h2>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Configure the customer portal behavior</p>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-md leading-6 font-medium text-gray-900">General Settings</h3>
                    <div className="mt-4 space-y-4">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="allow-quotes"
                            name="allow-quotes"
                            type="checkbox"
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                            defaultChecked
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="allow-quotes" className="font-medium text-gray-700">
                            Allow Quote Requests
                          </label>
                          <p className="text-gray-500">Customers can request quotes for custom orders</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="order-approval"
                            name="order-approval"
                            type="checkbox"
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                            defaultChecked
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="order-approval" className="font-medium text-gray-700">
                            Require Order Approval
                          </label>
                          <p className="text-gray-500">Orders must be approved by an admin before processing</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="job-status"
                            name="job-status"
                            type="checkbox"
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                            defaultChecked
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="job-status" className="font-medium text-gray-700">
                            Show Job Status
                          </label>
                          <p className="text-gray-500">Customers can view the status of their jobs</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start">
                    <label htmlFor="default-currency" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                      Default Currency
                    </label>
                    <div className="mt-1 sm:mt-0 sm:col-span-2">
                      <select
                        id="default-currency"
                        name="default-currency"
                        className="max-w-lg block focus:ring-indigo-500 focus:border-indigo-500 w-full shadow-sm sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                        defaultValue="EUR"
                      >
                        <option value="EUR">Euro (€)</option>
                        <option value="USD">US Dollar ($)</option>
                        <option value="GBP">British Pound (£)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start">
                    <label htmlFor="order-prefix" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                      Order Number Prefix
                    </label>
                    <div className="mt-1 sm:mt-0 sm:col-span-2">
                      <input
                        type="text"
                        name="order-prefix"
                        id="order-prefix"
                        defaultValue="PO-"
                        className="max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-5">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Form Modal */}
      {showUserModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-0 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {editingUser ? 'Edit Portal User' : 'Add Portal User'}
                  </h3>
                  <div className="mt-2">
                    <form onSubmit={handleSubmitUser}>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            name="email"
                            id="email"
                            required
                            value={userForm.email}
                            onChange={handleUserFormChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            disabled={!!editingUser}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                              First Name
                            </label>
                            <input
                              type="text"
                              name="firstName"
                              id="firstName"
                              value={userForm.firstName}
                              onChange={handleUserFormChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                              Last Name
                            </label>
                            <input
                              type="text"
                              name="lastName"
                              id="lastName"
                              value={userForm.lastName}
                              onChange={handleUserFormChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password {!editingUser && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="password"
                            name="password"
                            id="password"
                            value={userForm.password}
                            onChange={handleUserFormChange}
                            required={!editingUser}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder={editingUser ? "Leave blank to keep current password" : ""}
                          />
                        </div>

                        <div>
                          <label htmlFor="customerId" className="block text-sm font-medium text-gray-700">
                            Customer <span className="text-red-500">*</span>
                          </label>
                          <div className="mt-1 relative">
                            <select
                              id="customerId"
                              name="customerId"
                              value={userForm.customerId}
                              onChange={handleUserFormChange}
                              required
                              disabled={customersLoading}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                              <option value="">Select a customer</option>
                              {customers.map(customer => (
                                <option key={customer.id} value={customer.id}>
                                  {customer.name}
                                </option>
                              ))}
                            </select>
                            {customersLoading && (
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <div className="animate-spin h-5 w-5 border-2 border-indigo-500 rounded-full border-t-transparent"></div>
                              </div>
                            )}
                          </div>
                          {customers.length === 0 && !customersLoading && !customerError && (
                            <p className="mt-1 text-sm text-red-600">
                              No customers available. Please add customers first.
                            </p>
                          )}
                          {customerError && (
                            <p className="mt-1 text-sm text-red-600">
                              Error loading customers: {customerError}
                            </p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                            Role
                          </label>
                          <select
                            id="role"
                            name="role"
                            value={userForm.role}
                            onChange={handleUserFormChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          >
                            <option value="ADMIN">Admin</option>
                            <option value="STANDARD">Standard</option>
                            <option value="VIEWER">Viewer</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                            Status
                          </label>
                          <select
                            id="status"
                            name="status"
                            value={userForm.status}
                            onChange={handleUserFormChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          >
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                            <option value="PENDING">Pending</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                        >
                          {isLoading ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowUserModal(false)}
                          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Product Catalog Modal */}
      {showProductModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-0 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Manage Product Catalog: {selectedCustomerName}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Select products to display in the customer portal and set custom pricing
                  </p>
                  
                  {productError && (
                    <div className="mt-4 bg-red-50 p-4 rounded-md">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <FiX className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">{productError}</h3>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    {productsLoading ? (
                      <div className="flex justify-center items-center py-10">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
                      </div>
                    ) : (
                      <div className="overflow-y-auto max-h-96">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                                Visible
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Product
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Base Price
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Custom Price
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Custom Name/Code
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {allProducts.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                  No products available. Please add products to your catalog first.
                                </td>
                              </tr>
                            ) : (
                              allProducts.map((product) => {
                                // Find if this product is in the customer catalog
                                const catalogEntry = customerProducts.find(cp => cp.productId === product.id);
                                const isVisible = catalogEntry ? catalogEntry.isVisible : false;
                                const customPrice = catalogEntry ? catalogEntry.customPrice : null;
                                const customerProductCode = catalogEntry ? catalogEntry.customerProductCode : '';
                                const customerProductName = catalogEntry ? catalogEntry.customerProductName : '';
                                
                                return (
                                  <tr key={product.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <input
                                        type="checkbox"
                                        checked={isVisible}
                                        onChange={() => handleProductVisibilityToggle(product.id, !isVisible)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                      />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                      <div className="text-sm text-gray-500">{product.sku}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-900">€{product.basePrice.toFixed(2)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={customPrice !== null ? customPrice : ''}
                                        onChange={(e) => handleCustomPriceChange(product.id, e.target.value ? parseFloat(e.target.value) : null)}
                                        placeholder={`€${product.basePrice.toFixed(2)}`}
                                        className="w-24 border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                      />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex space-x-2">
                                        <input
                                          type="text"
                                          value={customerProductCode || ''}
                                          onChange={(e) => handleCustomProductCodeChange(product.id, e.target.value)}
                                          placeholder="Custom Code"
                                          className="w-24 border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                        <input
                                          type="text"
                                          value={customerProductName || ''}
                                          onChange={(e) => handleCustomProductNameChange(product.id, e.target.value)}
                                          placeholder="Custom Name"
                                          className="w-32 border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button
                      type="button"
                      onClick={handleSaveCatalog}
                      disabled={productsLoading}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                    >
                      {productsLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowProductModal(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 