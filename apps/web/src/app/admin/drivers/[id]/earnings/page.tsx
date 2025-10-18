'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
// import { toast } from 'sonner';

interface EarningItem {
  id: string;
  type: 'route' | 'booking';
  reference: string;
  date: string;
  amount: number;
  commission: number;
  netEarning: number;
  status: string;
}

interface DriverEarnings {
  driver: {
    id: string;
    user: {
      name: string;
      email: string;
    };
    commissionRate: number;
  };
  summary: {
    totalEarnings: number;
    totalCommission: number;
    netEarnings: number;
    completedJobs: number;
    averagePerJob: number;
  };
  thisWeek: {
    earnings: number;
    jobs: number;
  };
  thisMonth: {
    earnings: number;
    jobs: number;
  };
  earnings: EarningItem[];
}

export default function DriverEarningsPage() {
  const params = useParams();
  const router = useRouter();
  const driverId = params?.id as string;
  
  const [earnings, setEarnings] = useState<DriverEarnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'all' | 'week' | 'month'>('all');

  useEffect(() => {
    loadEarnings();
  }, [driverId, period]);

  const loadEarnings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/drivers/${driverId}/earnings?period=${period}`);
      
      if (!response.ok) {
        throw new Error('Failed to load earnings');
      }
      
      const data = await response.json();
      setEarnings(data);
    } catch (error) {
      console.error('Error loading earnings:', error);
      console.error('Failed to load driver earnings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!earnings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Driver Not Found</h1>
        <button
          onClick={() => router.push('/admin/routes')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Routes
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin/routes')}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
        >
          ← Back to Routes
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Driver Earnings</h1>
      </div>

      {/* Driver Info Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{earnings.driver.user.name}</h2>
            <p className="text-gray-600">{earnings.driver.user.email}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Commission Rate</p>
            <p className="text-2xl font-bold text-blue-600">{(earnings.driver.commissionRate * 100).toFixed(0)}%</p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm text-gray-600">Total Earnings</p>
          <p className="text-2xl font-bold text-green-600">£{earnings.summary.totalEarnings.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm text-gray-600">Commission</p>
          <p className="text-2xl font-bold text-orange-600">£{earnings.summary.totalCommission.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm text-gray-600">Net Earnings</p>
          <p className="text-2xl font-bold text-blue-600">£{earnings.summary.netEarnings.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm text-gray-600">Completed Jobs</p>
          <p className="text-2xl font-bold text-purple-600">{earnings.summary.completedJobs}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm text-gray-600">Avg Per Job</p>
          <p className="text-2xl font-bold text-indigo-600">£{earnings.summary.averagePerJob.toFixed(2)}</p>
        </div>
      </div>

      {/* Period Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
          <p className="text-sm opacity-90">This Week</p>
          <div className="flex items-end justify-between mt-2">
            <div>
              <p className="text-3xl font-bold">£{earnings.thisWeek.earnings.toFixed(2)}</p>
              <p className="text-sm opacity-90">{earnings.thisWeek.jobs} jobs</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
          <p className="text-sm opacity-90">This Month</p>
          <div className="flex items-end justify-between mt-2">
            <div>
              <p className="text-3xl font-bold">£{earnings.thisMonth.earnings.toFixed(2)}</p>
              <p className="text-sm opacity-90">{earnings.thisMonth.jobs} jobs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Period Filter */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Earnings History</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setPeriod('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  period === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => setPeriod('month')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  period === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setPeriod('week')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  period === 'week'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                This Week
              </button>
            </div>
          </div>
        </div>

        {/* Earnings Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Commission</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Earning</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {earnings.earnings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No earnings found for this period
                  </td>
                </tr>
              ) : (
                earnings.earnings.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => router.push(`/admin/routes/${item.id}`)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {item.reference}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.type === 'route' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {item.type === 'route' ? 'Multi-Drop' : 'Single Job'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      £{item.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600">
                      -£{item.commission.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-600">
                      £{item.netEarning.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        item.status === 'PAID' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

