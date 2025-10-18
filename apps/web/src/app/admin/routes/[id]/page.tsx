'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
// import { toast } from 'sonner';

interface Drop {
  id: string;
  sequence: number;
  booking: {
    id: string;
    bookingReference: string;
    pickupAddress: string;
    dropoffAddress: string;
    customerName: string;
    customerPhone: string;
    status: string;
  };
  status: string;
  estimatedArrival?: string;
  actualArrival?: string;
}

interface RouteDetails {
  id: string;
  routeNumber: string;
  status: string;
  driver?: {
    id: string;
    user: {
      name: string;
      email: string;
      phone?: string;
    };
  };
  drops: Drop[];
  totalDistance?: number;
  estimatedDuration?: number;
  totalValue: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export default function RouteDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const routeId = params?.id as string;
  
  const [route, setRoute] = useState<RouteDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRouteDetails();
  }, [routeId]);

  const loadRouteDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/routes/${routeId}/details`);
      
      if (!response.ok) {
        throw new Error('Failed to load route details');
      }
      
      const data = await response.json();
      setRoute(data);
    } catch (error) {
      console.error('Error loading route details:', error);
      console.error('Failed to load route details');
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

  if (!route) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Route Not Found</h1>
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
        <h1 className="text-3xl font-bold text-gray-900">Route Details</h1>
      </div>

      {/* Route Info Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Route Number</p>
            <p className="text-lg font-semibold">{route.routeNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              route.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
              route.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
              route.status === 'ASSIGNED' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {route.status}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-lg font-semibold">£{route.totalValue.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Drops</p>
            <p className="text-lg font-semibold">{route.drops.length}</p>
          </div>
        </div>
      </div>

      {/* Driver Info */}
      {route.driver && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Driver Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="text-lg font-semibold">{route.driver.user.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="text-lg">{route.driver.user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="text-lg">{route.driver.user.phone || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Drops List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Drops ({route.drops.length})</h2>
        <div className="space-y-4">
          {route.drops.map((drop, index) => (
            <div key={drop.id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                      {drop.sequence}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-lg">{drop.booking.bookingReference}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        drop.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        drop.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {drop.status}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-gray-600">Customer</p>
                        <p className="font-medium">{drop.booking.customerName}</p>
                        <p className="text-gray-500">{drop.booking.customerPhone}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Pickup</p>
                        <p className="font-medium">{drop.booking.pickupAddress}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Dropoff</p>
                        <p className="font-medium">{drop.booking.dropoffAddress}</p>
                      </div>
                      {drop.estimatedArrival && (
                        <div>
                          <p className="text-gray-600">Estimated Arrival</p>
                          <p className="font-medium">{new Date(drop.estimatedArrival).toLocaleString()}</p>
                        </div>
                      )}
                      {drop.actualArrival && (
                        <div>
                          <p className="text-gray-600">Actual Arrival</p>
                          <p className="font-medium">{new Date(drop.actualArrival).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h2 className="text-xl font-bold mb-4">Timeline</h2>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="font-medium">{new Date(route.createdAt).toLocaleString()}</p>
            </div>
          </div>
          {route.startedAt && (
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full bg-green-600"></div>
              <div>
                <p className="text-sm text-gray-600">Started</p>
                <p className="font-medium">{new Date(route.startedAt).toLocaleString()}</p>
              </div>
            </div>
          )}
          {route.completedAt && (
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full bg-gray-600"></div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="font-medium">{new Date(route.completedAt).toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

