'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Spinner, Text } from '@chakra-ui/react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  adminRole?: string | null;
}

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

/**
 * Client-side authentication guard for admin routes
 * Checks for token in sessionStorage and verifies with API
 */
export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      console.log('🔍 AdminAuthGuard: Checking authentication...');
      
      // Try to get token with fallback options
      let token: string | null = null;
      try {
        if (typeof window !== 'undefined') {
          // Try sessionStorage first
          token = sessionStorage.getItem('auth-token');
          // Fallback to localStorage
          if (!token) {
            token = localStorage.getItem('auth-token');
          }
          // Fallback to memory
          if (!token && (window as any).__authToken) {
            token = (window as any).__authToken;
            console.log('📦 Using in-memory token');
          }
        }
      } catch (error) {
        console.error('❌ Storage access blocked:', error);
      }

      if (!token) {
        console.log('🚫 AdminAuthGuard: No token found, redirecting to login');
        router.push('/auth/login');
        return;
      }

      console.log('🔑 AdminAuthGuard: Token found, length:', token.length);

      try {
        // Verify token with API
        console.log('📡 AdminAuthGuard: Verifying token with API...');
        const res = await fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await res.json();
        console.log('📥 AdminAuthGuard: API response:', { ok: res.ok, valid: data.valid });

        if (!res.ok || !data.valid) {
          console.log('❌ AdminAuthGuard: Invalid token, clearing and redirecting');
          sessionStorage.removeItem('auth-token');
          router.push('/auth/login');
          return;
        }

        console.log('✅ AdminAuthGuard: Authenticated as:', data.user.email);
        setUser(data.user);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('❌ AdminAuthGuard: Auth check failed:', error);
        sessionStorage.removeItem('auth-token');
        router.push('/auth/login');
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <Box
        minH="100vh"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        bg="bg.canvas"
      >
        <Spinner size="xl" color="cyan.400" thickness="4px" />
        <Text mt={4} color="text.secondary">
          Verifying authentication...
        </Text>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return null; // Router will redirect
  }

  return <>{children}</>;
}
