import { test, expect } from '@playwright/test';

test.describe('Debug NextAuth API', () => {
  test('should check NextAuth API endpoints', async ({ page }) => {
    // Clear browser storage to avoid JWT token conflicts
    await page.context().clearCookies();

    // Check if NextAuth is responding
    console.log('🔍 Testing NextAuth API endpoints...');

    // Test CSRF endpoint
    try {
      const csrfResponse = await page.request.get('/api/auth/csrf');
      console.log('CSRF endpoint status:', csrfResponse.status());
      if (csrfResponse.ok()) {
        const csrfData = await csrfResponse.json();
        console.log('CSRF data:', csrfData);
      }
    } catch (error) {
      console.log('❌ CSRF endpoint error:', error);
    }

    // Test session endpoint
    try {
      const sessionResponse = await page.request.get('/api/auth/session');
      console.log('Session endpoint status:', sessionResponse.status());
      if (sessionResponse.ok()) {
        const sessionData = await sessionResponse.json();
        console.log('Session data:', sessionData);
      }
    } catch (error) {
      console.log('❌ Session endpoint error:', error);
    }

    // Test providers endpoint
    try {
      const providersResponse = await page.request.get('/api/auth/providers');
      console.log('Providers endpoint status:', providersResponse.status());
      if (providersResponse.ok()) {
        const providersData = await providersResponse.json();
        console.log('Providers data:', providersData);
      }
    } catch (error) {
      console.log('❌ Providers endpoint error:', error);
    }

    // Go to login page to see if it loads
    await page.goto('/auth/login');
    console.log('✅ Login page loaded');

    // Check if the page has the expected elements
    const emailInput = page.locator('[data-testid="email-input"]');
    const passwordInput = page.locator('[data-testid="password-input"]');
    const loginButton = page.locator('[data-testid="login-button"]');

    console.log('Email input visible:', await emailInput.isVisible());
    console.log('Password input visible:', await passwordInput.isVisible());
    console.log('Login button visible:', await loginButton.isVisible());

    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-nextauth.png' });
  });
});
