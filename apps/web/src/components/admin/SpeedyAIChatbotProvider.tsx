'use client';

import React, { useState, useEffect } from 'react';
import SpeedyAIChatbot from './SpeedyAIChatbot';
import AdminAIOverlay from './AdminAIOverlay';

interface AdminInfo {
  name: string;
  email: string;
}

export default function SpeedyAIChatbotProvider() {
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch admin info with improved retry logic
    const fetchAdminInfo = async (retryCount = 0) => {
      const safeParseJson = async (response: Response) => {
        try {
          return await response.json();
        } catch {
          return null;
        }
      };

      try {
        const response = await fetch('/api/admin/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies for session
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.admin) {
            setAdminInfo({
              name: result.admin.name || 'Admin',
              email: result.admin.email || '',
            });
            setLoading(false);
            return; // Success - no need to retry
          } else {
            console.warn('Admin info response missing success or admin data:', result);
            // Use default values if API returns unexpected format
            setAdminInfo({
              name: 'Admin',
              email: '',
            });
            setLoading(false);
            return; // Got response - no need to retry
          }
        } else {
          // Handle non-OK responses
          if (response.status === 401) {
            console.warn('Unauthorized - Admin session may have expired');
            setAdminInfo({
              name: 'Admin',
              email: '',
            });
            setLoading(false);
            return; // Auth error - no need to retry
          } else if (response.status === 404) {
            const errorBody = await safeParseJson(response);
            const errorMessage =
              (errorBody as { error?: string } | null)?.error || 'Admin user not found';
            // 404 means route doesn't exist - only retry once after a short delay
            if (retryCount < 1) {
              console.log(
                `Admin info endpoint returned 404 (${errorMessage}), retrying once (attempt ${
                  retryCount + 1
                })...`
              );
              setTimeout(() => fetchAdminInfo(retryCount + 1), 1500);
              return;
            } else {
              // After 1 retry, give up and use defaults
              console.warn(
                `Admin info endpoint still 404 (${errorMessage}) - using default admin info`
              );
              setAdminInfo({
                name: 'Admin',
                email: '',
              });
              setLoading(false);
              return;
            }
          } else {
            const errorBody = await safeParseJson(response);
            const errorMessage =
              (errorBody as { error?: string } | null)?.error || response.statusText;
            console.error(
              'Failed to fetch admin info:',
              response.status,
              response.statusText,
              errorMessage
            );
            setAdminInfo({
              name: 'Admin',
              email: '',
            });
            setLoading(false);
            return; // Other errors - no retry
          }
        }
      } catch (error) {
        console.error('Failed to fetch admin info:', error);
        // Retry on network errors only once
        if (retryCount < 1) {
          console.log(`Network error, retrying once (attempt ${retryCount + 1})...`);
          setTimeout(() => fetchAdminInfo(retryCount + 1), 1500);
          return;
        }
        // After 1 retry, give up and use defaults
        console.warn('Failed to fetch admin info after retries - using default values');
        setAdminInfo({
          name: 'Admin',
          email: '',
        });
        setLoading(false);
      }
    };

    fetchAdminInfo();
  }, []);

  // Show chatbot even if loading fails (with default values)
  // Use the Enterprise Grid overlay by default
  return (
    <AdminAIOverlay
      adminName={adminInfo?.name || 'Admin'}
      adminEmail={adminInfo?.email || ''}
    />
  );
}

