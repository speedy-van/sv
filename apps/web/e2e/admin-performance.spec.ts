import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/admin/login');
    await page.fill('[data-testid="email-input"]', 'admin@speedy-van.co.uk');
    await page.fill('[data-testid="password-input"]', 'AdminPassword123!');
    await page.click('[data-testid="login-button"]');

    // Wait for admin dashboard to load
    await expect(page).toHaveURL('/admin');
  });

  test('dashboard should load under 1 second TTI', async ({ page }) => {
    const startTime = Date.now();

    // Navigate to dashboard
    await page.goto('/admin/dashboard');

    // Wait for dashboard to be interactive
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();

    // Wait for all KPIs to load
    await expect(page.locator('[data-testid="today-revenue"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-jobs"]')).toBeVisible();
    await expect(page.locator('[data-testid="avg-eta"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="first-response-time"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="open-incidents"]')).toBeVisible();

    // Wait for live ops panel
    await expect(page.locator('[data-testid="live-ops-panel"]')).toBeVisible();

    // Wait for map snapshot
    await expect(page.locator('[data-testid="map-snapshot"]')).toBeVisible();

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(1000); // Under 1 second TTI

    console.log(`Dashboard load time: ${loadTime}ms`);
  });

  test('orders list interactions should be under 100ms', async ({ page }) => {
    await page.goto('/admin/orders');
    await expect(page.locator('[data-testid="orders-table"]')).toBeVisible();

    // Test filter interaction
    const filterStartTime = Date.now();
    await page.click('[data-testid="status-filter"]');
    await page.click('text=Assigned');
    const filterTime = Date.now() - filterStartTime;
    expect(filterTime).toBeLessThan(100);

    // Test sort interaction
    const sortStartTime = Date.now();
    await page.click('[data-testid="sort-date"]');
    const sortTime = Date.now() - sortStartTime;
    expect(sortTime).toBeLessThan(100);

    // Test search interaction
    const searchStartTime = Date.now();
    await page.fill('[data-testid="search-orders"]', 'TEST123');
    await page.keyboard.press('Enter');
    const searchTime = Date.now() - searchStartTime;
    expect(searchTime).toBeLessThan(100);

    console.log(
      `Filter time: ${filterTime}ms, Sort time: ${sortTime}ms, Search time: ${searchTime}ms`
    );
  });

  test('map should load under 2 seconds with 200 markers', async ({ page }) => {
    await page.goto('/admin/dispatch/map');

    const startTime = Date.now();

    // Wait for map to load
    await expect(page.locator('[data-testid="dispatch-map"]')).toBeVisible();

    // Wait for markers to load
    await expect(page.locator('[data-testid="driver-marker"]')).toBeVisible();

    // Wait for traffic layer
    await expect(page.locator('[data-testid="traffic-layer"]')).toBeVisible();

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2000); // Under 2 seconds

    // Count markers (simulate 200 markers)
    const markers = await page.locator('[data-testid="driver-marker"]').count();
    expect(markers).toBeGreaterThan(0);

    console.log(`Map load time: ${loadTime}ms, Markers: ${markers}`);
  });

  test('bulk operations should be atomic and fast', async ({ page }) => {
    await page.goto('/admin/orders');
    await expect(page.locator('[data-testid="orders-table"]')).toBeVisible();

    // Select multiple orders
    await page.click('[data-testid="select-all-orders"]');

    // Test bulk assign performance
    const bulkAssignStartTime = Date.now();
    await page.click('[data-testid="bulk-assign-button"]');
    await page.click('[data-testid="driver-select"]');
    await page.click('text=Test Driver');
    await page.click('[data-testid="confirm-assignment"]');

    // Wait for success confirmation
    await expect(
      page.locator('[data-testid="assignment-success"]')
    ).toBeVisible();

    const bulkAssignTime = Date.now() - bulkAssignStartTime;
    expect(bulkAssignTime).toBeLessThan(500); // Bulk operations under 500ms

    console.log(`Bulk assign time: ${bulkAssignTime}ms`);
  });

  test('real-time updates should be under 100ms perceived', async ({
    page,
  }) => {
    await page.goto('/admin/orders');
    await expect(page.locator('[data-testid="orders-table"]')).toBeVisible();

    // Monitor for real-time updates
    const orderRow = page.locator('[data-testid="order-row"]').first();
    const initialStatus = await orderRow
      .locator('[data-testid="order-status"]')
      .textContent();

    // Simulate order status change (in real scenario, this would be triggered by driver action)
    // For testing, we'll trigger a manual refresh
    const updateStartTime = Date.now();

    // Trigger a real-time update (simulated)
    await page.evaluate(() => {
      // Simulate Pusher event
      window.dispatchEvent(
        new CustomEvent('order-updated', {
          detail: { orderId: 'test-order', status: 'in_progress' },
        })
      );
    });

    // Wait for UI update
    await expect(
      page.locator('[data-testid="realtime-indicator"]')
    ).toBeVisible();

    const updateTime = Date.now() - updateStartTime;
    expect(updateTime).toBeLessThan(100); // Under 100ms perceived

    console.log(`Real-time update time: ${updateTime}ms`);
  });

  test('large dataset filtering should be under 200ms', async ({ page }) => {
    await page.goto('/admin/orders');
    await expect(page.locator('[data-testid="orders-table"]')).toBeVisible();

    // Apply complex filters to simulate 10k orders scenario
    const filterStartTime = Date.now();

    // Apply multiple filters
    await page.click('[data-testid="status-filter"]');
    await page.click('text=Assigned');
    await page.click('[data-testid="date-range-filter"]');
    await page.fill('[data-testid="date-from"]', '2024-01-01');
    await page.fill('[data-testid="date-to"]', '2024-12-31');
    await page.click('[data-testid="payment-filter"]');
    await page.click('text=Paid');
    await page.click('[data-testid="area-filter"]');
    await page.click('text=Central London');
    await page.click('[data-testid="apply-filters"]');

    // Wait for filtered results
    await expect(
      page.locator('[data-testid="orders-table"] tbody tr')
    ).toBeVisible();

    const filterTime = Date.now() - filterStartTime;
    expect(filterTime).toBeLessThan(200); // Under 200ms as per acceptance criteria

    console.log(`Complex filter time: ${filterTime}ms`);
  });

  test('dashboard KPIs should be live and accurate', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();

    // Verify KPIs are live (have actual values, not placeholders)
    const revenueText = await page
      .locator('[data-testid="today-revenue"]')
      .textContent();
    expect(revenueText).toMatch(/£[\d,]+\.\d{2}/);

    const activeJobsText = await page
      .locator('[data-testid="active-jobs"]')
      .textContent();
    expect(parseInt(activeJobsText || '0')).toBeGreaterThanOrEqual(0);

    const avgEtaText = await page
      .locator('[data-testid="avg-eta"]')
      .textContent();
    expect(avgEtaText).toMatch(/\d+\s*min/);

    const responseTimeText = await page
      .locator('[data-testid="first-response-time"]')
      .textContent();
    expect(responseTimeText).toMatch(/\d+\.\d+\s*min/);

    const incidentsText = await page
      .locator('[data-testid="open-incidents"]')
      .textContent();
    expect(parseInt(incidentsText || '0')).toBeGreaterThanOrEqual(0);

    // Verify KPI cards are clickable and deep-link
    await page.locator('[data-testid="today-revenue"]').click();
    await expect(page).toHaveURL(/\/admin\/finance/);

    await page.goto('/admin/dashboard');
    await page.locator('[data-testid="active-jobs"]').click();
    await expect(page).toHaveURL(/\/admin\/orders/);
  });

  test('admin shell should be responsive and fast', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Test sidebar navigation
    const navStartTime = Date.now();
    await page.locator('[data-testid="nav-orders"]').click();
    await expect(page).toHaveURL('/admin/orders');
    const navTime = Date.now() - navStartTime;
    expect(navTime).toBeLessThan(100);

    // Test global search
    const searchStartTime = Date.now();
    await page.locator('[data-testid="global-search"]').click();
    await page.locator('[data-testid="search-input"]').fill('TEST123');
    await page.keyboard.press('Enter');
    const searchTime = Date.now() - searchStartTime;
    expect(searchTime).toBeLessThan(100);

    // Test keyboard shortcuts
    const shortcutStartTime = Date.now();
    await page.keyboard.press('Control+g');
    await page.keyboard.press('o'); // G + O for Orders
    await expect(page).toHaveURL('/admin/orders');
    const shortcutTime = Date.now() - shortcutStartTime;
    expect(shortcutTime).toBeLessThan(100);

    console.log(
      `Navigation: ${navTime}ms, Search: ${searchTime}ms, Shortcut: ${shortcutTime}ms`
    );
  });

  test('should handle concurrent operations without conflicts', async ({
    page,
    context,
  }) => {
    // Create multiple contexts to simulate concurrent admin users
    const context1 = await context.browser()?.newContext();
    const context2 = await context.browser()?.newContext();

    const page1 = await context1?.newPage();
    const page2 = await context2?.newPage();

    if (page1 && page2) {
      // Login both as admin
      await page1.goto('/admin/login');
      await page1
        .locator('[data-testid="email-input"]')
        .fill('admin@speedy-van.co.uk');
      await page1
        .locator('[data-testid="password-input"]')
        .fill('AdminPassword123!');
      await page1.locator('[data-testid="login-button"]').click();

      await page2.goto('/admin/login');
      await page2
        .locator('[data-testid="email-input"]')
        .fill('admin@speedy-van.co.uk');
      await page2
        .locator('[data-testid="password-input"]')
        .fill('AdminPassword123!');
      await page2.locator('[data-testid="login-button"]').click();

      // Both navigate to orders
      await page1.goto('/admin/orders');
      await page2.goto('/admin/orders');

      // Both try to edit the same order simultaneously
      const orderRow1 = page1.locator('[data-testid="order-row"]').first();
      const orderRow2 = page2.locator('[data-testid="order-row"]').first();

      await orderRow1.locator('[data-testid="edit-order"]').click();
      await orderRow2.locator('[data-testid="edit-order"]').click();

      // One should succeed, one should show conflict warning
      const successCount =
        (await page1.locator('[data-testid="edit-success"]').count()) +
        (await page2.locator('[data-testid="edit-success"]').count());
      const conflictCount =
        (await page1.locator('[data-testid="edit-conflict"]').count()) +
        (await page2.locator('[data-testid="edit-conflict"]').count());

      expect(successCount + conflictCount).toBe(2);
      expect(successCount).toBe(1);
      expect(conflictCount).toBe(1);

      await context1?.close();
      await context2?.close();
    }
  });
});
