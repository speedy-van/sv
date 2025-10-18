'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface ScheduleItem {
  id: string;
  type: 'route' | 'booking';
  reference: string;
  status: string;
  startTime: string;
  endTime?: string;
  drops?: number;
  value: number;
  pickupAddress?: string;
  dropoffAddress?: string;
}

interface DriverSchedule {
  driver: {
    id: string;
    user: {
      name: string;
      email: string;
      phone?: string;
    };
    status: string;
  };
  today: ScheduleItem[];
  upcoming: ScheduleItem[];
  completed: ScheduleItem[];
}

export default function DriverSchedulePage() {
  const params = useParams();
  const router = useRouter();
  const driverId = params.id as string;
  
  const [schedule, setSchedule] = useState<DriverSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'completed'>('today');

  useEffect(() => {
    loadSchedule();
  }, [driverId]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/drivers/${driverId}/schedule`);
      
      if (!response.ok) {
        throw new Error('Failed to load schedule');
      }
      
      const data = await response.json();
      setSchedule(data);
    } catch (error) {
      console.error('Error loading schedule:', error);
      toast.error('Failed to load driver schedule');
    } finally {
      setLoading(false);
    }
  };

  const renderScheduleItem = (item: ScheduleItem) => (
    <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="font-semibold text-lg">{item.reference}</h3>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              item.type === 'route' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {item.type === 'route' ? 'Multi-Drop' : 'Single Job'}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              item.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
              item.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
              item.status === 'ASSIGNED' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {item.status}
            </span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Start:</span>
              <span className="font-medium">{new Date(item.startTime).toLocaleString()}</span>
            </div>
            {item.endTime && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">End:</span>
                <span className="font-medium">{new Date(item.endTime).toLocaleString()}</span>
              </div>
            )}
            {item.drops && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Drops:</span>
                <span className="font-medium">{item.drops}</span>
              </div>
            )}
            {item.pickupAddress && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Pickup:</span>
                <span className="font-medium">{item.pickupAddress}</span>
              </div>
            )}
            {item.dropoffAddress && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Dropoff:</span>
                <span className="font-medium">{item.dropoffAddress}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Value:</span>
              <span className="font-semibold text-green-600">£{item.value.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => router.push(`/admin/routes/${item.id}`)}
          className="ml-4 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          View
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!schedule) {
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

  const currentItems = activeTab === 'today' ? schedule.today :
                       activeTab === 'upcoming' ? schedule.upcoming :
                       schedule.completed;

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
        <h1 className="text-3xl font-bold text-gray-900">Driver Schedule</h1>
      </div>

      {/* Driver Info Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{schedule.driver.user.name}</h2>
            <p className="text-gray-600">{schedule.driver.user.email}</p>
            {schedule.driver.user.phone && (
              <p className="text-gray-600">{schedule.driver.user.phone}</p>
            )}
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${
            schedule.driver.status === 'ONLINE' ? 'bg-green-100 text-green-800' :
            schedule.driver.status === 'BUSY' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {schedule.driver.status}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm text-gray-600">Today's Jobs</p>
          <p className="text-3xl font-bold text-blue-600">{schedule.today.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm text-gray-600">Upcoming Jobs</p>
          <p className="text-3xl font-bold text-purple-600">{schedule.upcoming.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm text-gray-600">Completed Jobs</p>
          <p className="text-3xl font-bold text-green-600">{schedule.completed.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b">
          <div className="flex space-x-4 px-6">
            <button
              onClick={() => setActiveTab('today')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'today'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Today ({schedule.today.length})
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'upcoming'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Upcoming ({schedule.upcoming.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'completed'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Completed ({schedule.completed.length})
            </button>
          </div>
        </div>

        {/* Schedule Items */}
        <div className="p-6">
          {currentItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No {activeTab} jobs
            </div>
          ) : (
            <div className="space-y-4">
              {currentItems.map(renderScheduleItem)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

