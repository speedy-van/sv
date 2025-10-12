import { renderHook } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useRoleBasedRedirect } from '../useRoleBasedRedirect';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock window.location
const mockLocation = {
  pathname: '/',
  href: 'http://localhost:3000/',
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

const mockUseSession = useSession as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;

describe('useRoleBasedRedirect', () => {
  const mockRouter = {
    replace: jest.fn(),
    push: jest.fn(),
  };

  beforeEach(() => {
    mockUseRouter.mockReturnValue(mockRouter);
    jest.clearAllMocks();
    // Reset window.location.pathname
    Object.defineProperty(window.location, 'pathname', {
      value: '/',
      writable: true,
    });
  });

  it('should not redirect when session is loading', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
    });

    renderHook(() => useRoleBasedRedirect());

    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('should not redirect when user is not authenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    renderHook(() => useRoleBasedRedirect());

    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('should redirect driver to driver dashboard when on home page', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'driver@test.com',
          role: 'driver',
        },
      },
      status: 'authenticated',
    });

    Object.defineProperty(window.location, 'pathname', {
      value: '/',
      writable: true,
    });

    renderHook(() => useRoleBasedRedirect());

    expect(mockRouter.replace).toHaveBeenCalledWith('/driver/dashboard');
  });

  it('should not redirect driver when already on driver portal', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'driver@test.com',
          role: 'driver',
        },
      },
      status: 'authenticated',
    });

    Object.defineProperty(window.location, 'pathname', {
      value: '/driver/dashboard',
      writable: true,
    });

    renderHook(() => useRoleBasedRedirect());

    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('should redirect customer to customer portal when on home page', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '2',
          email: 'customer@test.com',
          role: 'customer',
        },
      },
      status: 'authenticated',
    });

    Object.defineProperty(window.location, 'pathname', {
      value: '/',
      writable: true,
    });

    renderHook(() => useRoleBasedRedirect());

    expect(mockRouter.replace).toHaveBeenCalledWith('/customer-portal');
  });

  it('should redirect admin to admin panel when on home page', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '3',
          email: 'admin@test.com',
          role: 'admin',
        },
      },
      status: 'authenticated',
    });

    Object.defineProperty(window.location, 'pathname', {
      value: '/',
      writable: true,
    });

    renderHook(() => useRoleBasedRedirect());

    expect(mockRouter.replace).toHaveBeenCalledWith('/admin');
  });

  it('should return session and user role information', () => {
    const mockSession = {
      user: {
        id: '1',
        email: 'driver@test.com',
        role: 'driver',
      },
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });

    const { result } = renderHook(() => useRoleBasedRedirect());

    expect(result.current.user).toEqual(mockSession.user);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.role).toBe('driver');
  });
});
