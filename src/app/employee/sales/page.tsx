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
  XMarkIcon,
  DocumentTextIcon
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

// Product interface for quotation system
interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  basePrice: number;
  unit: string;
  productClass: string;
  isActive: boolean;
}

// QuotationItem interface
interface QuotationItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Quotation interface
interface Quotation {
  id?: string;
  quoteNumber?: string;
  customerId: string;
  customerName: string;
  items: QuotationItem[];
  totalAmount: number;
  expiresAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
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

// Remove mock products data and replace with API fetch
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

  // Quotation system state
  const [showQuotationForm, setShowQuotationForm] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([]);
  const [quotationError, setQuotationError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [isCreatingQuote, setIsCreatingQuote] = useState(false);

  // New state for product selection in quotation form
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);

  // Update the createQuotation function to use manual customer entry instead of customer ID
  const createQuotation = async () => {
    if (!selectedCustomerName) {
      setQuotationError('Please enter a customer name');
      return;
    }
    
    if (quotationItems.length === 0) {
      setQuotationError('Please add at least one item to the quotation');
      return;
    }
    
    if (!validUntil) {
      setQuotationError('Please set a validity date for the quotation');
      return;
    }
    
    setIsCreatingQuote(true);
    setQuotationError(null);
    
    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: selectedCustomerName,
          expiresAt: validUntil,
          totalAmount: calculateTotalAmount(),
          items: quotationItems
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create quotation');
      }
      
      const data = await response.json();
      
      // Reset form and close modal
      setQuotationItems([]);
      setSelectedCustomerId('');
      setSelectedCustomerName('');
      setValidUntil('');
      setShowQuotationForm(false);
      
      // Show success message or update UI
      alert(`Quotation created successfully with reference number: ${data.quoteNumber}`);
      
    } catch (error) {
      console.error('Error creating quotation:', error);
      setQuotationError('Failed to create quotation. Please try again.');
    } finally {
      setIsCreatingQuote(false);
    }
  };

  // Update the handleSubmit function to fix activity logging
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // For now, we'll just use the mock implementation
      // In production, this would be replaced with an API call
      const createdAt = new Date().toISOString();
      const newActivityWithId: SalesActivity = {
        ...newActivity,
        id: `temp-${Date.now()}`,
        createdAt,
        updatedAt: createdAt
      };
      
      // Add to activities list
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
      
    } catch (error) {
      console.error('Error saving activity:', error);
      setError('Failed to save activity. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle product selection change
  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = e.target.value;
    setSelectedProduct(productId);
    
    if (productId) {
      const product = products.find(p => p.id === productId);
      if (product) {
        setUnitPrice(Number(product.basePrice));
      }
    } else {
      setUnitPrice(0);
    }
  };

  // Add item to quotation
  const addItemToQuotation = () => {
    if (!selectedProduct) {
      setQuotationError('Please select a product');
      return;
    }
    
    if (quantity <= 0) {
      setQuotationError('Quantity must be greater than 0');
      return;
    }
    
    if (unitPrice <= 0) {
      setQuotationError('Unit price must be greater than 0');
      return;
    }
    
    const product = products.find(p => p.id === selectedProduct);
    if (!product) {
      setQuotationError('Selected product not found');
      return;
    }
    
    const newItem: QuotationItem = {
      productId: selectedProduct,
      productName: product.name,
      quantity,
      unitPrice,
      totalPrice: quantity * unitPrice
    };
    
    setQuotationItems([...quotationItems, newItem]);
    setQuotationError(null);
    
    // Reset form
    setSelectedProduct('');
    setQuantity(1);
    setUnitPrice(0);
  };

  // Remove item from quotation
  const removeItemFromQuotation = (index: number) => {
    const updatedItems = [...quotationItems];
    updatedItems.splice(index, 1);
    setQuotationItems(updatedItems);
  };

  // Calculate total amount
  const calculateTotalAmount = () => {
    return quotationItems.reduce((total, item) => total + item.totalPrice, 0);
  };

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

  // Fetch products for quotation
  useEffect(() => {
    const fetchProducts = async () => {
      if (showQuotationForm) {
        setLoadingProducts(true);
        setProductsError(null);
        try {
          const response = await fetch('/api/products');
          if (!response.ok) {
            throw new Error('Failed to fetch products');
          }
          const data = await response.json();
          setProducts(data.filter((product: Product) => product.isActive));
        } catch (error) {
          console.error('Error fetching products:', error);
          setProductsError('Failed to load products. Please try again.');
        } finally {
          setLoadingProducts(false);
        }
      }
    };

    fetchProducts();
  }, [showQuotationForm]);

  // Fetch customers for quotation
  useEffect(() => {
    const fetchCustomers = async () => {
      if (showQuotationForm) {
        try {
          const response = await fetch('/api/customers');
          if (!response.ok) {
            throw new Error('Failed to fetch customers');
          }
          const data = await response.json();
          setCustomers(data);
        } catch (error) {
          console.error('Error fetching customers:', error);
        }
      }
    };

    fetchCustomers();
  }, [showQuotationForm]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
        </Head>
        <div className="w-full flex justify-center items-center min-h-[calc(100vh-2rem)]">
          <svg className="animate-spin h-12 w-12 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
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
    <div className="min-h-screen bg-gray-50 py-6">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
      </Head>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">Sales CRM</h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <button
              onClick={() => setShowAddActivity(true)}
              className="flex items-center justify-center p-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Log Activity
            </button>
            <button
              onClick={() => setShowQuotationForm(true)}
              className="flex items-center justify-center p-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full"
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Create Quotation
            </button>
          </div>
        </div>

        {/* Create Quotation Modal */}
        {showQuotationForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Create Quotation</h2>
                  <button
                    onClick={() => setShowQuotationForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {quotationError && (
                  <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                    {quotationError}
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={selectedCustomerName}
                    onChange={(e) => setSelectedCustomerName(e.target.value)}
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="mb-6 border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Add Product</h3>
                  
                  {loadingProducts ? (
                    <div className="text-center py-4">Loading products...</div>
                  ) : productsError ? (
                    <div className="text-center py-4 text-red-600">{productsError}</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Product
                        </label>
                        <select
                          className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          value={selectedProduct}
                          onChange={handleProductChange}
                        >
                          <option value="">Select a product</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} - {product.sku}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity
                        </label>
                        <input
                          type="number"
                          className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                          min="1"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Unit Price (€)
                        </label>
                        <input
                          type="number"
                          className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          value={unitPrice}
                          onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={addItemToQuotation}
                          className="w-full p-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          Add Item
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {quotationItems.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Quotation Items</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Product
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Quantity
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Unit Price
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {quotationItems.map((item, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {item.productName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {item.quantity}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                €{item.unitPrice.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                €{item.totalPrice.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <button
                                  onClick={() => removeItemFromQuotation(index)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50">
                            <td colSpan={3} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                              Total Amount:
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                              €{calculateTotalAmount().toFixed(2)}
                            </td>
                            <td></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowQuotationForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={createQuotation}
                    disabled={isCreatingQuote || quotationItems.length === 0}
                    className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      isCreatingQuote || quotationItems.length === 0
                        ? 'bg-blue-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isCreatingQuote ? 'Creating...' : 'Create Quotation'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Activity Modal */}
        {showAddActivity && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit} className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Log Sales Activity</h2>
                  <button
                    type="button"
                    onClick={() => setShowAddActivity(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shop Name
                    </label>
                    <input
                      type="text"
                      name="shopName"
                      value={newActivity.shopName}
                      onChange={handleInputChange}
                      required
                      className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      name="contactName"
                      value={newActivity.contactName}
                      onChange={handleInputChange}
                      required
                      className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      name="contactEmail"
                      value={newActivity.contactEmail}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      name="contactPhone"
                      value={newActivity.contactPhone}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={newActivity.status}
                      onChange={handleInputChange}
                      required
                      className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={newActivity.date}
                      onChange={handleInputChange}
                      required
                      className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={newActivity.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddActivity(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Activity'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Rest of the existing code... */}
      </div>
    </div>
  );
} 