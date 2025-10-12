import { test, expect } from '@playwright/test';

test.describe('Debug Admin Access', () => {
  test('should authenticate admin user successfully', async ({ page }) => {
    // Clear browser storage to avoid JWT token conflicts
    await page.context().clearCookies();

    // Listen for console messages
    page.on('console', msg => {
      console.log('Browser console:', msg.text());
    });

    // Listen for network requests to debug API calls
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log('🌐 API Request:', request.method(), request.url());
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log('🌐 API Response:', response.status(), response.url());
      }
    });

    // Go to login page
    await page.goto('/auth/login');
    console.log('✅ Navigated to login page');

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');

    // Fill in credentials
    await page.fill('[data-testid="email-input"]', 'admin@speedy-van.co.uk');
    await page.fill('[data-testid="password-input"]', 'AdminPassword123!');
    console.log('✅ Filled in credentials');

    // Click login button
    await page.click('[data-testid="login-button"]');
    console.log('✅ Clicked login button');

    // Wait for authentication response
    console.log('⏳ Waiting for authentication response...');

    try {
      // Wait for the credentials callback response
      const authResponse = await page.waitForResponse(
        response => response.url().includes('/api/auth/callback/credentials'),
        { timeout: 15000 }
      );

      console.log('🔐 Authentication response received:', {
        status: authResponse.status(),
        url: authResponse.url(),
        ok: authResponse.ok(),
      });

      if (authResponse.ok()) {
        console.log('✅ Authentication successful');

        // Wait for session to be established
        await page.waitForTimeout(2000);

        // Check if we're redirected or still on login page
        const currentUrl = page.url();
        console.log('Current URL after authentication:', currentUrl);

        if (currentUrl.includes('/auth/login')) {
          console.log('🔄 Still on login page, checking for error messages...');

          // Check for error messages
          const errorElement = page.locator('p[style*="crimson"]');
          if (await errorElement.isVisible()) {
            const errorText = await errorElement.textContent();
            console.log('❌ Login error:', errorText);
          } else {
            console.log('✅ No error message found');
          }

          // Wait longer for session to be fully established
          console.log('⏳ Waiting longer for session establishment...');
          await page.waitForTimeout(5000);

          // Check cookies to see if session is set
          const cookies = await page.context().cookies();
          const sessionCookie = cookies.find(c => c.name.includes('next-auth'));
          console.log('🍪 Session cookie found:', sessionCookie ? 'Yes' : 'No');
          if (sessionCookie) {
            console.log('🍪 Session cookie details:', {
              name: sessionCookie.name,
              value: sessionCookie.value.substring(0, 50) + '...',
              domain: sessionCookie.domain,
              path: sessionCookie.path,
            });
          }

          // Try to access admin page directly
          console.log('🔄 Attempting direct admin access...');
          await page.goto('/admin');

          // Wait for page load
          await page.waitForLoadState('domcontentloaded');

          const adminUrl = page.url();
          console.log('Admin page URL:', adminUrl);

          if (adminUrl.includes('/admin')) {
            console.log('✅ Successfully accessed admin page');

            // Wait a bit more for the page to fully render
            await page.waitForTimeout(2000);

            // Check for admin content
            const adminContent = page.locator('text=Today Revenue');
            if (await adminContent.isVisible()) {
              console.log('✅ Admin dashboard content is visible');
            } else {
              console.log('❌ Admin dashboard content not visible');

              // Take a screenshot for debugging
              await page.screenshot({
                path: 'debug-admin-content-missing.png',
              });
            }
          } else {
            console.log('❌ Redirected away from admin page');

            // Take a screenshot to see where we ended up
            await page.screenshot({ path: 'debug-admin-redirect.png' });
          }
        } else {
          console.log('✅ Successfully redirected from login page');
        }
      } else {
        console.log('❌ Authentication failed');

        // Try to get error details
        try {
          const errorData = await authResponse.json();
          console.log('❌ Authentication error details:', errorData);
        } catch (e) {
          console.log('❌ Could not parse error response');
        }
      }
    } catch (error) {
      console.log('❌ Authentication timeout or error:', error);

      // Take a screenshot for debugging
      await page.screenshot({ path: 'debug-auth-timeout.png' });
    }

    // Take final screenshot
    await page.screenshot({ path: 'debug-auth-final.png' });
  });
});
