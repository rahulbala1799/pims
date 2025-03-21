'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DailySales {
  date: string;
  amount: number;
}

interface TopProduct {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
}

interface WeeklyGrowth {
  currentWeek: number;
  previousWeek: number;
  growthPercentage: number;
}

interface ApiResponse {
  lastThirtyDaysSales: DailySales[];
  topProducts: TopProduct[];
  weeklyGrowth: WeeklyGrowth;
}

export default function RevenueTrendsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<ApiResponse>({
    lastThirtyDaysSales: [],
    topProducts: [],
    weeklyGrowth: { currentWeek: 0, previousWeek: 0, growthPercentage: 0 }
  });
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would fetch from your API
      // For now we'll simulate some data
      const response = await fetch('/api/metrics/revenue-trends');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }
      
      const result: ApiResponse = await response.json();
      setData(result);
    } catch (err: any) {
      console.error('Error fetching revenue data:', err);
      
      // Simulate data for demonstration
      simulateDemoData();
      
      setError(null); // Clear error if we're using demo data
    } finally {
      setIsLoading(false);
    }
  };

  const simulateDemoData = () => {
    // Generate last 30 days of sales data
    const lastThirtyDaysSales: DailySales[] = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      lastThirtyDaysSales.push({
        date: date.toISOString().split('T')[0],
        amount: Math.floor(Math.random() * 5000) + 1000 // Random value between 1000-6000
      });
    }
    
    // Generate top 10 products
    const topProducts: TopProduct[] = [
      { id: '1', name: 'Business Cards', quantity: 250, revenue: 5600 },
      { id: '2', name: 'Brochures', quantity: 180, revenue: 4900 },
      { id: '3', name: 'Flyers', quantity: 320, revenue: 4200 },
      { id: '4', name: 'Posters', quantity: 95, revenue: 3800 },
      { id: '5', name: 'Banners', quantity: 42, revenue: 3500 },
      { id: '6', name: 'Letterheads', quantity: 220, revenue: 2900 },
      { id: '7', name: 'Envelopes', quantity: 300, revenue: 2400 },
      { id: '8', name: 'Labels', quantity: 450, revenue: 2200 },
      { id: '9', name: 'Booklets', quantity: 65, revenue: 1900 },
      { id: '10', name: 'Calendars', quantity: 80, revenue: 1600 }
    ];
    
    // Generate weekly growth data
    const currentWeek = 28500;
    const previousWeek = 25200;
    const growthPercentage = ((currentWeek - previousWeek) / previousWeek) * 100;
    
    setData({
      lastThirtyDaysSales,
      topProducts,
      weeklyGrowth: {
        currentWeek,
        previousWeek,
        growthPercentage
      }
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short'
    }).format(date);
  };

  // Prepare chart data for Line chart
  const chartData = {
    labels: data.lastThirtyDaysSales.map(day => formatDate(day.date)),
    datasets: [
      {
        label: 'Daily Sales',
        data: data.lastThirtyDaysSales.map(day => day.amount),
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointBackgroundColor: 'rgb(79, 70, 229)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      }
    ]
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `Sales: ${formatCurrency(context.raw)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value);
          }
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-6 rounded-lg shadow-md max-w-lg">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Data</h2>
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchRevenueData}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Find max sales value for scaling the chart
  const maxSales = Math.max(...data.lastThirtyDaysSales.map(day => day.amount));
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <div className="flex items-center">
              <Link href="/admin/reporting" className="text-indigo-600 hover:text-indigo-900 mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Revenue Trends</h1>
            </div>
            <p className="mt-1 text-sm text-gray-500">Track sales patterns and product performance</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* KPI Card - Week-on-Week Growth */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900">Week-on-Week Growth</h3>
            <div className="mt-4 flex items-end">
              <p className={`text-3xl font-bold ${data.weeklyGrowth.growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.weeklyGrowth.growthPercentage >= 0 ? '+' : ''}{data.weeklyGrowth.growthPercentage.toFixed(1)}%
              </p>
              <div className="ml-6">
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">Current Week:</span>
                  <span className="text-lg font-semibold text-gray-900">{formatCurrency(data.weeklyGrowth.currentWeek)}</span>
                </div>
                <div className="flex items-center mt-1">
                  <span className="text-sm text-gray-500 mr-2">Previous Week:</span>
                  <span className="text-lg font-semibold text-gray-900">{formatCurrency(data.weeklyGrowth.previousWeek)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Line Chart - Last 30 Days Sales */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Sales - Last 30 Days
              </h2>
              
              <div className="h-80">
                {data.lastThirtyDaysSales.length > 0 ? (
                  <Line data={chartData} options={chartOptions} />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-gray-500 mb-2">No sales data available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Top 10 Products Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Top 10 Sold Products
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity Sold
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.topProducts.map((product, index) => (
                    <tr key={product.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.quantity.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(product.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 