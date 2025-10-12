import { test, expect } from '@playwright/test';

test.describe('Role-Based Redirect After Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we're signed out before each test
    await page.goto('/');
    // Clear any existing session
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should automatically redirect driver to driver dashboard after sign in', async ({
    page,
  }) => {
    // Go to home page and open auth modal manually
    await page.goto('/');
    await page.click('text=Sign in');

    // Auth modal should be open
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Sign in with driver credentials
    await page.fill(
      '[data-testid="signin-email"]',
      'test-driver@speedy-van.co.uk'
    );
    await page.fill('[data-testid="signin-password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Should automatically redirect to driver dashboard
    await expect(page).toHaveURL('/driver/dashboard');

    // Should show driver dashboard content
    await expect(
      page.locator('[data-testid="driver-dashboard"]')
    ).toBeVisible();

    // URL should be cleaned up (no auth parameters)
    await expect(page).not.toHaveURL(/returnTo|showAuth/);
  });

  test('should automatically redirect customer to customer portal after sign in', async ({
    page,
  }) => {
    // Go to home page and open auth modal manually
    await page.goto('/');
    await page.click('text=Sign in');

    // Auth modal should be open
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Sign in with customer credentials
    await page.fill(
      '[data-testid="signin-email"]',
      'customer@speedy-van.co.uk'
    );
    await page.fill('[data-testid="signin-password"]', 'CustomerPassword123!');
    await page.click('button[type="submit"]');

    // Should automatically redirect to customer portal
    await expect(page).toHaveURL('/customer-portal');

    // URL should be cleaned up (no auth parameters)
    await expect(page).not.toHaveURL(/returnTo|showAuth/);
  });

  test('should automatically redirect admin to admin panel after sign in', async ({
    page,
  }) => {
    // Go to home page and open auth modal manually
    await page.goto('/');
    await page.click('text=Sign in');

    // Auth modal should be open
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Sign in with admin credentials
    await page.fill('[data-testid="signin-email"]', 'admin@speedy-van.co.uk');
    await page.fill('[data-testid="signin-password"]', 'AdminPassword123!');
    await page.click('button[type="submit"]');

    // Should automatically redirect to admin panel
    await expect(page).toHaveURL('/admin');

    // URL should be cleaned up (no auth parameters)
    await expect(page).not.toHaveURL(/returnTo|showAuth/);
  });

  test('should redirect driver from driver login page to dashboard after authentication', async ({
    page,
  }) => {
    // Go directly to driver login page
    await page.goto('/driver/login');

    // Should show driver login form
    await expect(page.locator('form')).toBeVisible();

    // Sign in with driver credentials
    await page.fill(
      '[data-testid="signin-email"]',
      'test-driver@speedy-van.co.uk'
    );
    await page.fill('[data-testid="signin-password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Should automatically redirect to driver dashboard
    await expect(page).toHaveURL('/driver/dashboard');

    // Should show driver dashboard content
    await expect(
      page.locator('[data-testid="driver-dashboard"]')
    ).toBeVisible();
  });

  test('should redirect driver from driver portal login to dashboard after authentication', async ({
    page,
  }) => {
    // Go directly to driver portal login page
    await page.goto('/(driver-portal)/login');

    // Should show driver login form
    await expect(page.locator('form')).toBeVisible();

    // Sign in with driver credentials
    await page.fill(
      '[data-testid="signin-email"]',
      'test-driver@speedy-van.co.uk'
    );
    await page.fill('[data-testid="signin-password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Should automatically redirect to driver dashboard
    await expect(page).toHaveURL('/driver/dashboard');

    // Should show driver dashboard content
    await expect(
      page.locator('[data-testid="driver-dashboard"]')
    ).toBeVisible();
  });

  test('should not redirect driver when already on driver portal', async ({
    page,
  }) => {
    // First sign in as driver
    await page.goto('/');
    await page.click('text=Sign in');

    await page.fill(
      '[data-testid="signin-email"]',
      'test-driver@speedy-van.co.uk'
    );
    await page.fill('[data-testid="signin-password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Should be on driver dashboard
    await expect(page).toHaveURL('/driver/dashboard');

    // Navigate to another driver portal page
    await page.goto('/driver/onboarding');

    // Should stay on the driver portal page (no infinite redirect)
    await expect(page).toHaveURL('/driver/onboarding');
  });

  test('should handle role-based redirect without browser refresh', async ({
    page,
  }) => {
    // Go to home page and open auth modal
    await page.goto('/');
    await page.click('text=Sign in');

    // Sign in with driver credentials
    await page.fill(
      '[data-testid="signin-email"]',
      'test-driver@speedy-van.co.uk'
    );
    await page.fill('[data-testid="signin-password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Should redirect to driver dashboard without page refresh
    await expect(page).toHaveURL('/driver/dashboard');

    // Verify the redirect happened smoothly (no loading states or flashes)
    await expect(
      page.locator('[data-testid="driver-dashboard"]')
    ).toBeVisible();

    // Check that the navigation was smooth (no full page reload)
    const navigationTiming = await page.evaluate(() => {
      return performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
    });

    // The redirect should be fast and smooth
    expect(
      navigationTiming.loadEventEnd - navigationTiming.loadEventStart
    ).toBeLessThan(1000);
  });
});
