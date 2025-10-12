import { test, expect } from '@playwright/test';

test.describe('Customer Portal Observability & QA', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');
  });

  test('Login modal → portal redirect works', async ({ page }) => {
    // Click sign in button in header
    await page.click('[data-testid="sign-in-button"]');

    // Wait for auth modal to appear
    await expect(page.locator('[data-testid="auth-modal"]')).toBeVisible();

    // Fill in login credentials
    await page.fill('[data-testid="email-input"]', 'customer@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');

    // Submit login form
    await page.click('[data-testid="sign-in-submit"]');

    // Should redirect to customer portal
    await expect(page).toHaveURL(/\/customer-portal/);

    // Should show customer dashboard
    await expect(
      page.locator('[data-testid="customer-dashboard"]')
    ).toBeVisible();
  });

  test('Deep-link to track page while signed out → login → lands on track page', async ({
    page,
  }) => {
    // Try to access a protected track page while signed out
    await page.goto('/customer-portal/track/123');

    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/login/);

    // Login
    await page.fill('[data-testid="email-input"]', 'customer@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="sign-in-submit"]');

    // Should redirect back to the original track page
    await expect(page).toHaveURL(/\/customer-portal\/track\/123/);

    // Should show tracking interface
    await expect(page.locator('[data-testid="tracking-map"]')).toBeVisible();
  });

  test('Unauthorized role (driver/admin) cannot access customer portal', async ({
    page,
  }) => {
    // Login as driver
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'driver@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="sign-in-submit"]');

    // Try to access customer portal
    await page.goto('/customer-portal');

    // Should be redirected to unauthorized page or driver portal
    await expect(page).not.toHaveURL(/\/customer-portal/);

    // Should show appropriate error or redirect to driver portal
    await expect(
      page.locator('[data-testid="unauthorized-message"]')
    ).toBeVisible();
  });

  test('Portal load time metrics are tracked', async ({ page }) => {
    // Enable performance monitoring
    await page.addInitScript(() => {
      window.performance.mark = jest.fn();
      window.performance.measure = jest.fn();
    });

    // Login and navigate to portal
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'customer@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="sign-in-submit"]');

    // Wait for portal to load
    await expect(
      page.locator('[data-testid="customer-dashboard"]')
    ).toBeVisible();

    // Check that performance metrics were tracked
    const metrics = await page.evaluate(() => {
      return window.performance.getEntriesByType('measure');
    });

    expect(metrics.length).toBeGreaterThan(0);
  });

  test('Sign-in success rate is tracked', async ({ page }) => {
    // Click sign in button
    await page.click('[data-testid="sign-in-button"]');

    // Fill in valid credentials
    await page.fill('[data-testid="email-input"]', 'customer@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="sign-in-submit"]');

    // Wait for successful redirect
    await expect(page).toHaveURL(/\/customer-portal/);

    // Check that success event was tracked
    const events = await page.evaluate(() => {
      return (window as any).telemetryEvents || [];
    });

    expect(events).toContainEqual(
      expect.objectContaining({
        event: 'auth_sign_in_success',
        properties: expect.objectContaining({
          method: 'credentials',
          role: 'customer',
        }),
      })
    );
  });

  test('API error rate is tracked', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'customer@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="sign-in-submit"]');

    // Navigate to orders page
    await page.goto('/customer-portal/orders');

    // Mock a failed API call
    await page.route('/api/customer/orders', route => {
      route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    // Trigger an action that calls the API
    await page.click('[data-testid="refresh-orders"]');

    // Wait for error to be displayed
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();

    // Check that error was tracked
    const events = await page.evaluate(() => {
      return (window as any).telemetryEvents || [];
    });

    expect(events).toContainEqual(
      expect.objectContaining({
        event: 'api_error',
        properties: expect.objectContaining({
          endpoint: '/api/customer/orders',
          status: 500,
        }),
      })
    );
  });

  test('Time-to-first-content is measured', async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'customer@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="sign-in-submit"]');

    // Navigate to portal and measure load time
    const startTime = Date.now();
    await page.goto('/customer-portal');

    // Wait for first content to appear
    await expect(
      page.locator('[data-testid="customer-dashboard"]')
    ).toBeVisible();

    const loadTime = Date.now() - startTime;

    // Should load within 1 second on good network
    expect(loadTime).toBeLessThan(1000);

    // Check that metric was tracked
    const metrics = await page.evaluate(() => {
      return (window as any).performanceMetrics || [];
    });

    expect(metrics).toContainEqual(
      expect.objectContaining({
        name: 'time_to_first_content',
        value: expect.any(Number),
        unit: 'milliseconds',
      })
    );
  });

  test('Skeleton loading states are shown while fetching', async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'customer@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="sign-in-submit"]');

    // Navigate to orders page
    await page.goto('/customer-portal/orders');

    // Should show skeleton loading state
    await expect(page.locator('[data-testid="orders-skeleton"]')).toBeVisible();

    // Wait for content to load
    await expect(page.locator('[data-testid="orders-list"]')).toBeVisible();

    // Skeleton should be hidden
    await expect(
      page.locator('[data-testid="orders-skeleton"]')
    ).not.toBeVisible();
  });
});
