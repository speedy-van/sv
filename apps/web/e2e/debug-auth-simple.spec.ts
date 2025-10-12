import { test, expect } from '@playwright/test';

test.describe('Debug Authentication', () => {
  test('should debug login form submission', async ({ page }) => {
    // Navigate to driver login page
    await page.goto('/driver/login');

    // Wait for page to load
    await expect(page.locator('h2')).toContainText('Driver Login');

    // Fill in login form with valid credentials
    await page.fill(
      '[data-testid="email-input"]',
      'test-driver@speedy-van.co.uk'
    );
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');

    // Check if form is ready
    const submitButton = page.locator('[data-testid="login-button"]');
    await expect(submitButton).toBeEnabled();
    await expect(submitButton).toContainText('Sign In');

    // Enable console logging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    // Submit form
    await submitButton.click();

    // Wait a bit to see what happens
    await page.waitForTimeout(2000);

    // Check button state
    const buttonAfterClick = page.locator('[data-testid="login-button"]');
    console.log(
      'Button text after click:',
      await buttonAfterClick.textContent()
    );
    console.log('Button disabled state:', await buttonAfterClick.isDisabled());

    // Check for any error messages
    const errorMessage = page.locator('[data-testid="error-message"]');
    if (await errorMessage.isVisible()) {
      console.log('Error message:', await errorMessage.textContent());
    }

    // Check current URL
    console.log('Current URL:', page.url());

    // Wait longer to see if redirect happens
    await page.waitForTimeout(5000);
    console.log('Final URL:', page.url());
  });
});
