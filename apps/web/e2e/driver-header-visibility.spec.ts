import { test, expect } from '@playwright/test';

test.describe('Driver Header Visibility', () => {
  test('should show driver header after successful login', async ({ page }) => {
    // Navigate to driver login page
    await page.goto('/driver/login');

    // Fill in login form with valid credentials
    await page.fill(
      '[data-testid="email-input"]',
      'test-driver@speedy-van.co.uk'
    );
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');

    // Submit form
    await page.click('[data-testid="login-button"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/driver/dashboard');

    // Should show driver dashboard
    await expect(
      page.locator('[data-testid="driver-dashboard"]')
    ).toBeVisible();

    // Verify that the driver header is visible
    // The header should contain the "Speedy Van Driver" branding
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('header')).toContainText('Speedy Van Driver');

    // Verify navigation links are visible
    await expect(page.locator('header')).toContainText('Dashboard');
    await expect(page.locator('header')).toContainText('Jobs');
    await expect(page.locator('header')).toContainText('Available Jobs');
    await expect(page.locator('header')).toContainText('Active Jobs');
    await expect(page.locator('header')).toContainText('Schedule');
    await expect(page.locator('header')).toContainText('Earnings');
    await expect(page.locator('header')).toContainText('Payouts');
    await expect(page.locator('header')).toContainText('Documents');
    await expect(page.locator('header')).toContainText('Performance');
    await expect(page.locator('header')).toContainText('Notifications');
    await expect(page.locator('header')).toContainText('Settings');

    // Verify user info is visible in header
    await expect(page.locator('header')).toContainText(
      'test-driver@speedy-van.co.uk'
    );

    // Verify the header is sticky and properly positioned
    const header = page.locator('header');
    await expect(header).toHaveCSS('position', 'sticky');
    await expect(header).toHaveCSS('top', '0px');
    await expect(header).toHaveCSS('z-index', '10');
  });

  test('should maintain header visibility when navigating between driver pages', async ({
    page,
  }) => {
    // Login first
    await page.goto('/driver/login');
    await page.fill(
      '[data-testid="email-input"]',
      'test-driver@speedy-van.co.uk'
    );
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');

    // Wait for dashboard to load
    await expect(page).toHaveURL('/driver/dashboard');
    await expect(
      page.locator('[data-testid="driver-dashboard"]')
    ).toBeVisible();

    // Verify header is visible on dashboard
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('header')).toContainText('Speedy Van Driver');

    // Navigate to jobs page
    await page.click('header >> text=Jobs');
    await expect(page).toHaveURL('/driver/jobs');

    // Verify header is still visible on jobs page
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('header')).toContainText('Speedy Van Driver');

    // Navigate to settings page
    await page.click('header >> text=Settings');
    await expect(page).toHaveURL('/driver/settings');

    // Verify header is still visible on settings page
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('header')).toContainText('Speedy Van Driver');

    // Navigate back to dashboard
    await page.click('header >> text=Dashboard');
    await expect(page).toHaveURL('/driver/dashboard');

    // Verify header is still visible
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('header')).toContainText('Speedy Van Driver');
  });

  test('should show proper header styling and layout', async ({ page }) => {
    // Login first
    await page.goto('/driver/login');
    await page.fill(
      '[data-testid="email-input"]',
      'test-driver@speedy-van.co.uk'
    );
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');

    // Wait for dashboard to load
    await expect(page).toHaveURL('/driver/dashboard');

    // Verify header styling
    const header = page.locator('header');
    await expect(header).toHaveCSS('background-color', 'rgb(255, 255, 255)'); // white background
    await expect(header).toHaveCSS(
      'border-bottom',
      '1px solid rgb(237, 242, 247)'
    ); // gray border

    // Verify header content layout
    const headerContainer = header.locator('container');
    await expect(headerContainer).toHaveCSS('max-width', '1200px');

    // Verify navigation links are properly spaced
    const navLinks = header.locator('a[variant="nav"]');
    await expect(navLinks).toHaveCount(12); // Should have 12 navigation links

    // Verify user section is on the right
    const userSection = header.locator('text=test-driver@speedy-van.co.uk');
    await expect(userSection).toBeVisible();
  });
});
