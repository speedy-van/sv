import { telemetry } from '../telemetry';

// Mock fetch
global.fetch = jest.fn();

describe('Telemetry Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset telemetry state
    (telemetry as any).userId = undefined;
    (telemetry as any).sessionId = 'test-session';
    // Enable telemetry for testing
    (telemetry as any).isEnabled = true;
  });

  describe('Event Tracking', () => {
    it('should track basic events', () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({ ok: true } as Response);

      telemetry.trackEvent('test_event', { test: true });

      expect(mockFetch).toHaveBeenCalledWith('/api/telemetry/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('test_event'),
      });
    });

    it('should track driver-specific events', () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({ ok: true } as Response);

      telemetry.trackDriverLogin(true, 'email');

      expect(mockFetch).toHaveBeenCalledWith('/api/telemetry/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('driver_login'),
      });
    });

    it('should track job events', () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({ ok: true } as Response);

      telemetry.trackJobClaim('job-123', true);

      expect(mockFetch).toHaveBeenCalledWith('/api/telemetry/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('job_claim'),
      });
    });
  });

  describe('Performance Tracking', () => {
    it('should track performance metrics', () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({ ok: true } as Response);

      telemetry.trackPerformance({
        name: 'page_load_time',
        value: 1000,
        unit: 'milliseconds',
        tags: { page: '/test' },
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/telemetry/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('page_load_time'),
      });
    });
  });

  describe('Business Metrics', () => {
    it('should track business metrics', () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({ ok: true } as Response);

      telemetry.trackBusinessMetric({
        name: 'jobs_completed',
        value: 1,
        category: 'job',
        tags: { jobId: 'test-123' },
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/telemetry/business', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('jobs_completed'),
      });
    });
  });

  describe('Error Tracking', () => {
    it('should track errors', () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({ ok: true } as Response);

      const error = new Error('Test error');
      telemetry.trackError(error, { context: 'test' });

      expect(mockFetch).toHaveBeenCalledWith('/api/telemetry/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('error'),
      });
    });
  });

  describe('NPS Tracking', () => {
    it('should track NPS scores', () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({ ok: true } as Response);

      telemetry.trackNPS(9, 'Great experience!');

      expect(mockFetch).toHaveBeenCalledWith('/api/telemetry/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('nps_survey'),
      });
    });
  });

  describe('Feature Usage Tracking', () => {
    it('should track feature usage', () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({ ok: true } as Response);

      telemetry.trackFeatureUsage('offline_mode', 'enabled', true);

      expect(mockFetch).toHaveBeenCalledWith('/api/telemetry/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('feature_usage'),
      });
    });
  });

  describe('User Context', () => {
    it('should set user ID', () => {
      telemetry.setUserId('user-123');
      expect((telemetry as any).userId).toBe('user-123');
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Should not throw
      expect(() => {
        telemetry.trackEvent('test_event');
      }).not.toThrow();
    });
  });
});
