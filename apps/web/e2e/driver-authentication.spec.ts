import { test, expect } from '@playwright/test';

test.describe('Driver Authentication & Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to driver login page
    await page.goto('/driver/login');
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Fill in login form
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
  });

  test('should show error with invalid credentials', async ({ page }) => {
    // Fill in login form with invalid credentials
    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');

    // Submit form
    await page.click('[data-testid="login-button"]');

    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Invalid credentials'
    );
  });

  test('should navigate to forgot password page', async ({ page }) => {
    // Click forgot password link
    await page.click('[data-testid="forgot-password-link"]');

    // Should navigate to forgot password page
    await expect(page).toHaveURL('/driver/forgot');

    // Should show forgot password form
    await expect(
      page.locator('[data-testid="forgot-password-form"]')
    ).toBeVisible();
  });

  test('should handle password reset flow', async ({ page }) => {
    // Navigate to forgot password page
    await page.goto('/driver/forgot');

    // Fill in email
    await page.fill(
      '[data-testid="email-input"]',
      'test-driver@speedy-van.co.uk'
    );

    // Submit form
    await page.click('[data-testid="submit-button"]');

    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText(
      'Reset link sent'
    );
  });

  test('should redirect to onboarding for incomplete profile', async ({
    page,
  }) => {
    // Login with test driver
    await page.fill(
      '[data-testid="email-input"]',
      'test-driver@speedy-van.co.uk'
    );
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');

    // If profile is incomplete, should redirect to onboarding
    const currentUrl = page.url();
    if (currentUrl.includes('/driver/onboarding')) {
      await expect(
        page.locator('[data-testid="onboarding-wizard"]')
      ).toBeVisible();
    } else {
      // Profile is complete, should be on dashboard
      await expect(page).toHaveURL('/driver/dashboard');
    }
  });

  test('should complete onboarding wizard', async ({ page }) => {
    // Navigate to onboarding
    await page.goto('/driver/onboarding');

    // Step 1: Personal Information
    await page.fill('[data-testid="first-name-input"]', 'John');
    await page.fill('[data-testid="last-name-input"]', 'Doe');
    await page.fill('[data-testid="phone-input"]', '+447700900001');
    await page.fill(
      '[data-testid="address-input"]',
      '123 Test Street, London, UK'
    );
    await page.click('[data-testid="next-step-button"]');

    // Step 2: Vehicle Information
    await page.selectOption('[data-testid="vehicle-type-select"]', 'van');
    await page.fill('[data-testid="license-number-input"]', 'TEST123456');
    await page.fill('[data-testid="license-expiry-input"]', '2030-01-01');
    await page.click('[data-testid="next-step-button"]');

    // Step 3: Documents
    await page.click('[data-testid="upload-license-button"]');
    // Note: File upload would be handled differently in real test
    await page.click('[data-testid="next-step-button"]');

    // Step 4: Review and Submit
    await page.click('[data-testid="submit-onboarding-button"]');

    // Should redirect to dashboard after completion
    await expect(page).toHaveURL('/driver/dashboard');
    await expect(
      page.locator('[data-testid="onboarding-complete-message"]')
    ).toBeVisible();
  });
});
