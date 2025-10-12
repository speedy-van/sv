import { test, expect } from '@playwright/test';

test.describe('Auth Redirect Logic (Deep-linking)', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we're signed out before each test
    await page.goto('/');
    // Clear any existing session
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should redirect to protected route after sign in from home', async ({
    page,
  }) => {
    // Try to access a protected route (driver dashboard)
    await page.goto('/driver/dashboard');

    // Should be redirected to home with auth parameters
    await expect(page).toHaveURL(
      /\/\?returnTo=%2Fdriver%2Fdashboard&showAuth=true/
    );

    // Auth modal should be open
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Sign in with valid credentials
    await page.fill(
      '[data-testid="signin-email"]',
      'test-driver@speedy-van.co.uk'
    );
    await page.fill('[data-testid="signin-password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Should redirect to the original protected route
    await expect(page).toHaveURL('/driver/dashboard');

    // URL should be cleaned up (no auth parameters)
    await expect(page).not.toHaveURL(/returnTo|showAuth/);
  });

  test('should redirect to admin route after sign in with admin credentials', async ({
    page,
  }) => {
    // Try to access admin route
    await page.goto('/admin');

    // Should be redirected to home with auth parameters
    await expect(page).toHaveURL(/\/\?returnTo=%2Fadmin&showAuth=true/);

    // Auth modal should be open
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Sign in with admin credentials
    await page.fill('[data-testid="signin-email"]', 'admin@speedy-van.co.uk');
    await page.fill('[data-testid="signin-password"]', 'AdminPassword123!');
    await page.click('button[type="submit"]');

    // Should redirect to admin dashboard
    await expect(page).toHaveURL('/admin');
  });

  test('should redirect to customer portal after sign in with customer credentials', async ({
    page,
  }) => {
    // Try to access customer portal
    await page.goto('/customer-portal');

    // Should be redirected to home with auth parameters
    await expect(page).toHaveURL(
      /\/\?returnTo=%2Fcustomer-portal&showAuth=true/
    );

    // Auth modal should be open
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Sign in with customer credentials
    await page.fill(
      '[data-testid="signin-email"]',
      'customer@speedy-van.co.uk'
    );
    await page.fill('[data-testid="signin-password"]', 'CustomerPassword123!');
    await page.click('button[type="submit"]');

    // Should redirect to customer portal
    await expect(page).toHaveURL('/customer-portal');
  });

  test('should stay on home and scroll to book section when no returnTo', async ({
    page,
  }) => {
    // Go to home page and open auth modal manually
    await page.goto('/');
    await page.click('text=Sign in');

    // Auth modal should be open
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Sign in with valid credentials
    await page.fill(
      '[data-testid="signin-email"]',
      'test-driver@speedy-van.co.uk'
    );
    await page.fill('[data-testid="signin-password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Should stay on home page
    await expect(page).toHaveURL('/#book');

    // Should scroll to book section
    await expect(page.locator('#book')).toBeInViewport();
  });

  test('should handle OAuth redirects correctly', async ({ page }) => {
    // Try to access protected route
    await page.goto('/driver/dashboard');

    // Should be redirected to home with auth parameters
    await expect(page).toHaveURL(
      /\/\?returnTo=%2Fdriver%2Fdashboard&showAuth=true/
    );

    // Auth modal should be open
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Click Google OAuth button (this would normally redirect to OAuth provider)
    await page.click('text=Continue with Google');

    // Note: In a real test, this would handle the OAuth flow
    // For now, we'll just verify the button is present and clickable
    await expect(page.locator('text=Continue with Google')).toBeVisible();
  });

  test('should handle invalid returnTo URLs securely', async ({ page }) => {
    // Try to access a URL with a malicious returnTo parameter
    await page.goto('/?returnTo=https://malicious-site.com&showAuth=true');

    // Auth modal should be open
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Sign in with valid credentials
    await page.fill(
      '[data-testid="signin-email"]',
      'test-driver@speedy-van.co.uk'
    );
    await page.fill('[data-testid="signin-password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Should redirect to home (not the malicious site)
    await expect(page).toHaveURL('/#book');
  });

  test('should handle role-based access control correctly', async ({
    page,
  }) => {
    // Sign in as a driver
    await page.goto('/');
    await page.click('text=Sign in');
    await page.fill(
      '[data-testid="signin-email"]',
      'test-driver@speedy-van.co.uk'
    );
    await page.fill('[data-testid="signin-password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Try to access admin route
    await page.goto('/admin');

    // Should be redirected back to home with auth parameters (insufficient permissions)
    await expect(page).toHaveURL(/\/\?returnTo=%2Fadmin&showAuth=true/);
  });

  test('should handle sign up flow with redirects', async ({ page }) => {
    // Try to access protected route
    await page.goto('/driver/dashboard');

    // Should be redirected to home with auth parameters
    await expect(page).toHaveURL(
      /\/\?returnTo=%2Fdriver%2Fdashboard&showAuth=true/
    );

    // Auth modal should be open
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Switch to sign up tab
    await page.click('text=Create Account');

    // Fill in sign up form
    await page.fill('[data-testid="signup-name"]', 'New User');
    await page.fill('[data-testid="signup-email"]', 'newuser@example.com');
    await page.fill('[data-testid="signup-password"]', 'NewPassword123!');
    await page.fill(
      '[data-testid="signup-confirm-password"]',
      'NewPassword123!'
    );
    await page.click('button[type="submit"]');

    // Should redirect to the original protected route after successful sign up
    await expect(page).toHaveURL('/driver/dashboard');
  });

  test('should clean up URL parameters after successful auth', async ({
    page,
  }) => {
    // Try to access protected route
    await page.goto('/driver/dashboard');

    // Should be redirected to home with auth parameters
    await expect(page).toHaveURL(
      /\/\?returnTo=%2Fdriver%2Fdashboard&showAuth=true/
    );

    // Sign in
    await page.fill(
      '[data-testid="signin-email"]',
      'test-driver@speedy-van.co.uk'
    );
    await page.fill('[data-testid="signin-password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Should redirect to protected route
    await expect(page).toHaveURL('/driver/dashboard');

    // URL should be clean (no auth parameters)
    await expect(page).not.toHaveURL(/returnTo|showAuth/);
  });

  test('should handle browser back/forward navigation correctly', async ({
    page,
  }) => {
    // Go to home page
    await page.goto('/');

    // Try to access protected route
    await page.goto('/driver/dashboard');

    // Should be redirected to home with auth parameters
    await expect(page).toHaveURL(
      /\/\?returnTo=%2Fdriver%2Fdashboard&showAuth=true/
    );

    // Go back
    await page.goBack();

    // Should be back on home page without auth parameters
    await expect(page).toHaveURL('/');

    // Go forward
    await page.goForward();

    // Should be back on home with auth parameters
    await expect(page).toHaveURL(
      /\/\?returnTo=%2Fdriver%2Fdashboard&showAuth=true/
    );
  });
});
