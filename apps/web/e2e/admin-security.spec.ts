import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard Security Tests', () => {
  test('should require 2FA for admin access', async ({ page }) => {
    // Try to access admin without authentication
    await page.goto('/admin');

    // Should be redirected to login
    await expect(page).toHaveURL(/\/admin\/login/);

    // Login with admin credentials
    await page.fill('[data-testid="email-input"]', 'admin@speedy-van.co.uk');
    await page.fill('[data-testid="password-input"]', 'AdminPassword123!');
    await page.click('[data-testid="login-button"]');

    // Should prompt for 2FA
    await expect(page.locator('[data-testid="2fa-prompt"]')).toBeVisible();

    // Enter 2FA code
    await page.fill('[data-testid="2fa-code"]', '123456');
    await page.click('[data-testid="verify-2fa"]');

    // Should now access admin dashboard
    await expect(page).toHaveURL('/admin');
  });

  test('should enforce least-privilege roles', async ({ page }) => {
    // Login as admin with limited permissions
    await page.goto('/admin/login');
    await page.fill(
      '[data-testid="email-input"]',
      'limited-admin@speedy-van.co.uk'
    );
    await page.fill('[data-testid="password-input"]', 'LimitedPassword123!');
    await page.click('[data-testid="login-button"]');

    // Enter 2FA
    await page.fill('[data-testid="2fa-code"]', '123456');
    await page.click('[data-testid="verify-2fa"]');

    // Should access admin dashboard
    await expect(page).toHaveURL('/admin');

    // Test orders.read permission (should be visible)
    await page.goto('/admin/orders');
    await expect(page.locator('[data-testid="orders-table"]')).toBeVisible();

    // Test orders.write permission (should be hidden for limited admin)
    await expect(
      page.locator('[data-testid="bulk-assign-button"]')
    ).not.toBeVisible();

    // Test refunds.issue permission (should be hidden)
    await page.goto('/admin/finance/refunds');
    await expect(
      page.locator('[data-testid="issue-refund-button"]')
    ).not.toBeVisible();

    // Test drivers.approve permission (should be hidden)
    await page.goto('/admin/drivers/applications');
    await expect(
      page.locator('[data-testid="approve-application"]')
    ).not.toBeVisible();
  });

  test('should prevent SSRF attacks', async ({ page }) => {
    // Login as admin
    await page.goto('/admin/login');
    await page.fill('[data-testid="email-input"]', 'admin@speedy-van.co.uk');
    await page.fill('[data-testid="password-input"]', 'AdminPassword123!');
    await page.click('[data-testid="login-button"]');
    await page.fill('[data-testid="2fa-code"]', '123456');
    await page.click('[data-testid="verify-2fa"]');

    // Try to access internal URLs through admin interface
    await page.goto('/admin/orders');

    // Attempt SSRF through order details
    await page.locator('[data-testid="order-row"]').first().click();
    await page.locator('[data-testid="view-details"]').click();

    // Try to inject internal URL in address field
    await page
      .locator('[data-testid="pickup-address"]')
      .fill('http://localhost:3000/admin/internal');
    await page.locator('[data-testid="save-order"]').click();

    // Should not allow internal URL access
    await expect(page.locator('[data-testid="ssrf-error"]')).toBeVisible();
  });

  test('should prevent CSRF attacks', async ({ page }) => {
    // Create a malicious page that tries to perform admin actions
    await page.goto(
      'data:text/html,<html><body><form id="csrf-form" method="POST" action="http://localhost:3000/api/admin/orders/123/assign"><input type="hidden" name="driverId" value="malicious-driver"><input type="submit" value="Submit"></form><script>document.getElementById("csrf-form").submit();</script></body></html>'
    );

    // Should be blocked by CSRF protection
    await expect(
      page.locator('text=CSRF token missing or invalid')
    ).toBeVisible();
  });

  test('should not log secrets in audit trail', async ({ page }) => {
    // Login as admin
    await page.goto('/admin/login');
    await page.fill('[data-testid="email-input"]', 'admin@speedy-van.co.uk');
    await page.fill('[data-testid="password-input"]', 'AdminPassword123!');
    await page.click('[data-testid="login-button"]');
    await page.fill('[data-testid="2fa-code"]', '123456');
    await page.click('[data-testid="verify-2fa"]');

    // Perform an action that should be audited
    await page.goto('/admin/orders');
    const orderRow = page.locator('[data-testid="order-row"]').first();
    await orderRow.locator('[data-testid="edit-order"]').click();
    await page.locator('[data-testid="order-notes"]').fill('Test audit note');
    await page.locator('[data-testid="save-order"]').click();

    // Check audit log
    await page.goto('/admin/logs');
    await page.fill('[data-testid="audit-search"]', 'order edit');
    await page.click('[data-testid="search-audit"]');

    const auditEntry = page.locator('[data-testid="audit-entry"]').first();
    const auditDetails = await auditEntry
      .locator('[data-testid="audit-details"]')
      .textContent();

    // Verify no secrets are logged
    expect(auditDetails).not.toContain('AdminPassword123!');
    expect(auditDetails).not.toContain('sk_test_');
    expect(auditDetails).not.toContain('pk_test_');
    expect(auditDetails).not.toContain('pusher_key');
  });

  test('should enforce session timeout', async ({ page }) => {
    // Login as admin
    await page.goto('/admin/login');
    await page.fill('[data-testid="email-input"]', 'admin@speedy-van.co.uk');
    await page.fill('[data-testid="password-input"]', 'AdminPassword123!');
    await page.click('[data-testid="login-button"]');
    await page.fill('[data-testid="2fa-code"]', '123456');
    await page.click('[data-testid="verify-2fa"]');

    // Wait for session to expire (simulate by clearing session)
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Try to access admin page
    await page.goto('/admin/orders');

    // Should be redirected to login
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('should validate IP allowlist for high-risk actions', async ({
    page,
  }) => {
    // Login as admin
    await page.goto('/admin/login');
    await page.fill('[data-testid="email-input"]', 'admin@speedy-van.co.uk');
    await page.fill('[data-testid="password-input"]', 'AdminPassword123!');
    await page.click('[data-testid="login-button"]');
    await page.fill('[data-testid="2fa-code"]', '123456');
    await page.click('[data-testid="verify-2fa"]');

    // Try to perform high-risk action (refund)
    await page.goto('/admin/finance/refunds');
    const completedOrder = page
      .locator('[data-testid="completed-order"]')
      .first();
    await completedOrder.locator('[data-testid="issue-refund"]').click();
    await page.locator('[data-testid="refund-amount"]').fill('100.00');
    await page.locator('[data-testid="confirm-refund"]').click();

    // Should check IP allowlist
    await expect(
      page.locator('[data-testid="ip-allowlist-check"]')
    ).toBeVisible();
  });

  test('should prevent unauthorized API access', async ({ page }) => {
    // Try to access admin API without authentication
    const response = await page.request.get('/api/admin/orders');
    expect(response.status()).toBe(401);

    // Try to access admin API with invalid token
    const response2 = await page.request.get('/api/admin/orders', {
      headers: {
        Authorization: 'Bearer invalid-token',
      },
    });
    expect(response2.status()).toBe(401);
  });

  test('should sanitize user inputs', async ({ page }) => {
    // Login as admin
    await page.goto('/admin/login');
    await page.fill('[data-testid="email-input"]', 'admin@speedy-van.co.uk');
    await page.fill('[data-testid="password-input"]', 'AdminPassword123!');
    await page.click('[data-testid="login-button"]');
    await page.fill('[data-testid="2fa-code"]', '123456');
    await page.click('[data-testid="verify-2fa"]');

    // Try to inject XSS in order notes
    await page.goto('/admin/orders');
    const orderRow = page.locator('[data-testid="order-row"]').first();
    await orderRow.locator('[data-testid="edit-order"]').click();
    await page
      .locator('[data-testid="order-notes"]')
      .fill('<script>alert("xss")</script>');
    await page.locator('[data-testid="save-order"]').click();

    // Should sanitize the input
    await expect(page.locator('[data-testid="order-notes"]')).not.toContainText(
      '<script>'
    );

    // Try SQL injection in search
    await page
      .locator('[data-testid="search-orders"]')
      .fill("'; DROP TABLE orders; --");
    await page.keyboard.press('Enter');

    // Should handle safely
    await expect(page.locator('[data-testid="orders-table"]')).toBeVisible();
  });

  test('should enforce secure headers', async ({ page }) => {
    // Check security headers on admin pages
    const response = await page.request.get('/admin');
    const headers = response.headers();

    // Verify security headers are present
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-xss-protection']).toBe('1; mode=block');
    expect(headers['strict-transport-security']).toContain('max-age=');
  });

  test('should validate file uploads', async ({ page }) => {
    // Login as admin
    await page.goto('/admin/login');
    await page.fill('[data-testid="email-input"]', 'admin@speedy-van.co.uk');
    await page.fill('[data-testid="password-input"]', 'AdminPassword123!');
    await page.click('[data-testid="login-button"]');
    await page.fill('[data-testid="2fa-code"]', '123456');
    await page.click('[data-testid="verify-2fa"]');

    // Try to upload malicious file
    await page.goto('/admin/drivers/applications');
    const pendingApp = page
      .locator('[data-testid="pending-application"]')
      .first();
    await pendingApp.locator('[data-testid="upload-document"]').click();

    // Create a malicious file
    const maliciousFile = Buffer.from('malicious content');
    await page.setInputFiles('[data-testid="file-input"]', {
      name: 'malicious.php',
      mimeType: 'application/x-php',
      buffer: maliciousFile,
    });

    // Should reject malicious file
    await expect(
      page.locator('[data-testid="file-upload-error"]')
    ).toBeVisible();
  });
});
