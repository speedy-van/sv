import { test, expect } from '@playwright/test';

test.describe('Debug Authentication', () => {
  test('should debug login process step by step', async ({ page }) => {
    // Navigate to driver login page
    await page.goto('/driver/login');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if we're on the login page
    console.log('Current URL:', page.url());
    await expect(page.locator('text=Driver Login')).toBeVisible();

    // Fill in login form
    await page.fill(
      '[data-testid="email-input"]',
      'test-driver@speedy-van.co.uk'
    );
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');

    // Check if form fields have values
    const emailValue = await page
      .locator('[data-testid="email-input"]')
      .inputValue();
    const passwordValue = await page
      .locator('[data-testid="password-input"]')
      .inputValue();
    console.log('Email field value:', emailValue);
    console.log('Password field value:', passwordValue);

    // Listen for network responses
    const responses: any[] = [];
    page.on('response', response => {
      if (response.url().includes('/api/auth/callback/credentials')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
        });
      }
    });

    // Submit form
    console.log('Submitting form...');
    await page.click('[data-testid="login-button"]');

    // Wait for network response
    await page.waitForTimeout(5000);

    // Check authentication response
    if (responses.length > 0) {
      console.log('Authentication responses:', responses);

      // Get the actual response body
      for (const response of responses) {
        console.log(
          `Response ${response.url}: ${response.status} ${response.statusText}`
        );
      }
    } else {
      console.log('No authentication responses captured');
    }

    // Check current URL after submission
    console.log('URL after form submission:', page.url());

    // Check if there are any error messages
    const errorElement = page.locator('[data-testid="error-message"]');
    if (await errorElement.isVisible()) {
      const errorText = await errorElement.textContent();
      console.log('Error message displayed:', errorText);
    } else {
      console.log('No error message displayed');
    }

    // Check if we're still on login page
    const stillOnLogin = page.url().includes('/driver/login');
    console.log('Still on login page:', stillOnLogin);

    // Check if there are any console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Wait a bit more to capture any console errors
    await page.waitForTimeout(2000);

    if (consoleErrors.length > 0) {
      console.log('Console errors:', consoleErrors);
    } else {
      console.log('No console errors');
    }

    // Check network requests
    const requests: string[] = [];
    page.on('request', request => {
      requests.push(`${request.method()} ${request.url()}`);
    });

    // Wait for any network activity
    await page.waitForTimeout(2000);

    if (requests.length > 0) {
      console.log('Network requests:', requests);
    } else {
      console.log('No network requests');
    }

    // Check if there are any cookies set
    const cookies = await page.context().cookies();
    console.log('Cookies after login attempt:', cookies);

    // Check if there's a session cookie
    const sessionCookie = cookies.find(cookie =>
      cookie.name.includes('next-auth')
    );
    if (sessionCookie) {
      console.log('Session cookie found:', sessionCookie);
    } else {
      console.log('No session cookie found');
    }
  });
});
