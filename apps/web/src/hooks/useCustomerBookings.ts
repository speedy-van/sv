import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
// import { CustomerBooking } from '@/lib/customer-bookings';

interface CustomerBooking {
  id: string;
  reference: string;
  status: string;
}

interface UseCustomerBookingsReturn {
  bookings: {
    linkedBookings: CustomerBooking[];
    unlinkedBookings: CustomerBooking[];
    totalCount: number;
  } | null;
  stats: any;
  loading: boolean;
  error: string | null;
  refreshBookings: () => Promise<void>;
  linkExistingBookings: (
    email: string,
    phone: string
  ) => Promise<{
    success: boolean;
    message: string;
    linkedCount: number;
  }>;
  linkSpecificBooking: (bookingId: string) => Promise<{
    success: boolean;
    message: string;
  }>;
}

export function useCustomerBookings(): UseCustomerBookingsReturn {
  const { data: session, status } = useSession();
  const [bookings, setBookings] = useState<{
    linkedBookings: CustomerBooking[];
    unlinkedBookings: CustomerBooking[];
    totalCount: number;
  } | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/customer/bookings');
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  const fetchStats = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/customer/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_stats' }),
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [session?.user?.id]);

  const refreshBookings = useCallback(async () => {
    await Promise.all([fetchBookings(), fetchStats()]);
  }, [fetchBookings, fetchStats]);

  const linkExistingBookings = useCallback(
    async (email: string, phone: string) => {
      if (!session?.user?.id) {
        return {
          success: false,
          message: 'User not authenticated',
          linkedCount: 0,
        };
      }

      try {
        const response = await fetch('/api/customer/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'link_existing',
            data: { email, phone },
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to link existing bookings');
        }

        const data = await response.json();

        // Refresh bookings after linking
        await refreshBookings();

        return {
          success: true,
          message: data.message,
          linkedCount: data.linkedBookings,
        };
      } catch (error) {
        console.error('Error linking existing bookings:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error',
          linkedCount: 0,
        };
      }
    },
    [session?.user?.id, refreshBookings]
  );

  const linkSpecificBooking = useCallback(
    async (bookingId: string) => {
      if (!session?.user?.id) {
        return {
          success: false,
          message: 'User not authenticated',
        };
      }

      try {
        const response = await fetch(
          `/api/customer/bookings/${bookingId}/link`,
          {
            method: 'POST',
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to link booking');
        }

        const data = await response.json();

        // Refresh bookings after linking
        await refreshBookings();

        return {
          success: true,
          message: data.message,
        };
      } catch (error) {
        console.error('Error linking specific booking:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    [session?.user?.id, refreshBookings]
  );

  // Fetch bookings when session changes
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      refreshBookings();
    }
  }, [status, session?.user?.id, refreshBookings]);

  return {
    bookings,
    stats,
    loading,
    error,
    refreshBookings,
    linkExistingBookings,
    linkSpecificBooking,
  };
}
