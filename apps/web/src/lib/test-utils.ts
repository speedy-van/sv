import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionProvider } from 'next-auth/react';
import { ChakraProvider } from '@chakra-ui/react';
import { theme } from '../theme';
import '@testing-library/jest-dom';

// Test utilities for the Speedy Van application

// Mock session data
export const mockSession = {
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'customer' as const,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

export const mockDriverSession = {
  user: {
    id: 'test-driver-id',
    name: 'Test Driver',
    email: 'driver@example.com',
    role: 'driver' as const,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

export const mockAdminSession = {
  user: {
    id: 'test-admin-id',
    name: 'Test Admin',
    email: 'admin@example.com',
    role: 'admin' as const,
    adminRole: 'ops' as const,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

export const mockUnauthenticatedSession = null;

// Custom render function with providers
export function renderWithProviders(
  ui: React.ReactElement,
  { session = mockSession, ...renderOptions } = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(SessionProvider, {
      session,
      children: React.createElement(ChakraProvider, {
        theme,
        children: children,
      }),
    });
  }

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// Mock API responses
export const mockApiResponses = {
  orders: {
    list: {
      items: [
        {
          id: 'order-1',
          reference: 'ABC123',
          status: 'pending',
          pickupAddress: '123 Main St',
          dropoffAddress: '456 Oak Ave',
          totalGBP: 2500,
          createdAt: new Date().toISOString(),
          customer: {
            id: 'customer-1',
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      ],
      pagination: {
        total: 1,
        page: 1,
        limit: 10,
        pages: 1,
        hasNext: false,
        hasPrev: false,
      },
    },
  },
  drivers: {
    list: {
      items: [
        {
          id: 'driver-1',
          user: {
            id: 'driver-user-1',
            name: 'Jane Driver',
            email: 'jane@example.com',
          },
          status: 'approved',
          vehicleType: 'van',
          rating: 4.8,
        },
      ],
      pagination: {
        total: 1,
        page: 1,
        limit: 10,
        pages: 1,
        hasNext: false,
        hasPrev: false,
      },
    },
  },
  customers: {
    list: {
      items: [
        {
          id: 'customer-1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          createdAt: new Date().toISOString(),
          totalOrders: 5,
          totalSpent: 12500,
        },
      ],
      pagination: {
        total: 1,
        page: 1,
        limit: 10,
        pages: 1,
        hasNext: false,
        hasPrev: false,
      },
    },
  },
};

// Mock fetch function
export function createMockFetch(responses: Record<string, any> = {}) {
  return jest.fn().mockImplementation((url: string, options?: RequestInit) => {
    const responseKey = Object.keys(responses).find(key => url.includes(key));

    if (responseKey) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(responses[responseKey]),
      });
    }

    // Default response
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });
  });
}

// Test data generators
export const testData = {
  createOrder: (overrides: any = {}) => ({
    id: `order-${Date.now()}`,
    reference: `ABC${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    status: 'pending',
    pickupAddress: '123 Main St, London',
    dropoffAddress: '456 Oak Ave, London',
    totalGBP: 2500,
    createdAt: new Date().toISOString(),
    customer: {
      id: 'customer-1',
      name: 'John Doe',
      email: 'john@example.com',
    },
    ...overrides,
  }),

  createDriver: (overrides: any = {}) => ({
    id: `driver-${Date.now()}`,
    user: {
      id: `driver-user-${Date.now()}`,
      name: 'Jane Driver',
      email: 'jane@example.com',
    },
    status: 'approved',
    vehicleType: 'van',
    rating: 4.8,
    ...overrides,
  }),

  createCustomer: (overrides: any = {}) => ({
    id: `customer-${Date.now()}`,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    createdAt: new Date().toISOString(),
    totalOrders: 5,
    totalSpent: 12500,
    ...overrides,
  }),
};

// Custom matchers for testing
export const customMatchers = {
  toBeInTheDocument: (element: HTMLElement) => {
    return element !== null && element !== undefined;
  },

  toHaveTextContent: (element: HTMLElement, text: string) => {
    return element.textContent?.includes(text) || false;
  },

  toBeVisible: (element: HTMLElement) => {
    const style = window.getComputedStyle(element);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0'
    );
  },
};

// Async utilities
export const asyncUtils = {
  waitForElementToBeRemoved: async (element: HTMLElement) => {
    await waitFor(() => {
      expect(element).not.toBeInTheDocument();
    });
  },

  waitForLoadingToFinish: async () => {
    await waitFor(() => {
      const loadingElements = screen.queryAllByText(/loading/i);
      expect(loadingElements).toHaveLength(0);
    });
  },

  waitForErrorToAppear: async (errorMessage: string) => {
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  },
};

// Form testing utilities
export const formUtils = {
  fillForm: async (user: any, formData: Record<string, string>) => {
    for (const [field, value] of Object.entries(formData)) {
      const input = screen.getByLabelText(new RegExp(field, 'i'));
      await user.type(input, value);
    }
  },

  submitForm: async (user: any, submitButtonText: string = 'Submit') => {
    const submitButton = screen.getByRole('button', {
      name: new RegExp(submitButtonText, 'i'),
    });
    await user.click(submitButton);
  },

  expectFormError: (errorMessage: string) => {
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  },
};

// Navigation testing utilities
export const navigationUtils = {
  clickLink: async (user: any, linkText: string) => {
    const link = screen.getByRole('link', { name: new RegExp(linkText, 'i') });
    await user.click(link);
  },

  clickButton: async (user: any, buttonText: string) => {
    const button = screen.getByRole('button', {
      name: new RegExp(buttonText, 'i'),
    });
    await user.click(button);
  },

  expectPageTitle: (title: string) => {
    expect(
      screen.getByRole('heading', { name: new RegExp(title, 'i') })
    ).toBeInTheDocument();
  },
};

// Mock environment variables
export const mockEnv = {
  NODE_ENV: 'test',
  NEXT_PUBLIC_APP_ENV: 'test',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  NEXTAUTH_SECRET: 'test-secret',
  NEXTAUTH_URL: 'http://localhost:3000',
};

// Setup test environment
export function setupTestEnvironment() {
  // Mock environment variables
  Object.entries(mockEnv).forEach(([key, value]) => {
    process.env[key] = value;
  });

  // Mock fetch globally
  global.fetch = createMockFetch();

  // Mock console methods to reduce noise in tests
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
}

// Cleanup test environment
export function cleanupTestEnvironment() {
  jest.restoreAllMocks();
  delete (global as any).fetch;
}

// Test hooks
export const testHooks = {
  useMockSession: (session = mockSession) => {
    return {
      data: session,
      status: session ? 'authenticated' : 'unauthenticated',
    };
  },

  useMockApi: (responses: Record<string, any> = {}) => {
    return {
      fetch: createMockFetch(responses),
    };
  },
};

// Performance testing utilities
export const performanceUtils = {
  measureRenderTime: async (component: React.ReactElement) => {
    const startTime = performance.now();
    renderWithProviders(component);
    const endTime = performance.now();
    return endTime - startTime;
  },

  expectRenderTime: async (component: React.ReactElement, maxTime: number) => {
    const renderTime = await performanceUtils.measureRenderTime(component);
    expect(renderTime).toBeLessThan(maxTime);
  },
};

// Accessibility testing utilities
export const accessibilityUtils = {
  expectToBeAccessible: async (component: React.ReactElement) => {
    renderWithProviders(component);

    // Check for proper heading structure
    const headings = screen.getAllByRole('heading');
    if (headings.length > 1) {
      const headingLevels = headings.map(h => parseInt(h.tagName.charAt(1)));
      for (let i = 1; i < headingLevels.length; i++) {
        expect(headingLevels[i] - headingLevels[i - 1]).toBeLessThanOrEqual(1);
      }
    }

    // Check for proper form labels
    const inputs = screen.getAllByRole('textbox');
    inputs.forEach(input => {
      const label =
        input.getAttribute('aria-label') ||
        input.getAttribute('aria-labelledby');
      expect(label).toBeTruthy();
    });
  },
};
