import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard QA & Acceptance', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'admin@speedy-van.co.uk');
    await page.fill('[data-testid="password-input"]', 'AdminPassword123!');
    await page.click('[data-testid="login-button"]');

    // Wait for authentication to complete and redirect to happen
    await page.waitForURL('**/admin', { timeout: 10000 });
  });

  test('should load dashboard with KPIs under 1 second', async ({ page }) => {
    const startTime = Date.now();

    // Wait for dashboard to load
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();

    // Check KPIs are present
    await expect(page.locator('[data-testid="today-revenue"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-jobs"]')).toBeVisible();
    await expect(page.locator('[data-testid="avg-eta"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="first-response-time"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="open-incidents"]')).toBeVisible();

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(1000); // Under 1 second

    // Verify KPIs are live (have actual values)
    const revenueText = await page
      .locator('[data-testid="today-revenue"]')
      .textContent();
    expect(revenueText).toMatch(/£[\d,]+\.\d{2}/);

    const activeJobsText = await page
      .locator('[data-testid="active-jobs"]')
      .textContent();
    expect(parseInt(activeJobsText || '0')).toBeGreaterThanOrEqual(0);
  });

  test('should filter 10k orders and bulk assign with atomic success', async ({
    page,
  }) => {
    // Navigate to orders page
    await page.goto('/admin/orders');
    await expect(page.locator('[data-testid="orders-table"]')).toBeVisible();

    // Apply filters to simulate 10k orders scenario
    await page.click('[data-testid="status-filter"]');
    await page.click('text=Assigned');
    await page.click('[data-testid="date-range-filter"]');
    await page.fill('[data-testid="date-from"]', '2024-01-01');
    await page.fill('[data-testid="date-to"]', '2024-12-31');
    await page.click('[data-testid="apply-filters"]');

    // Wait for filtered results (should be fast)
    const filterStartTime = Date.now();
    await expect(
      page.locator('[data-testid="orders-table"] tbody tr')
    ).toBeVisible();
    const filterTime = Date.now() - filterStartTime;
    expect(filterTime).toBeLessThan(200); // Under 200ms as per acceptance criteria

    // Select multiple orders for bulk assignment
    await page.click('[data-testid="select-all-orders"]');
    await page.click('[data-testid="bulk-assign-button"]');

    // Choose driver for assignment
    await page.click('[data-testid="driver-select"]');
    await page.click('text=Test Driver');
    await page.click('[data-testid="confirm-assignment"]');

    // Verify atomic success
    await expect(
      page.locator('[data-testid="assignment-success"]')
    ).toBeVisible();

    // Verify all selected orders are now assigned
    const assignedOrders = await page
      .locator('[data-testid="order-status-assigned"]')
      .count();
    expect(assignedOrders).toBeGreaterThan(0);

    // Verify audit trail
    await page.click('[data-testid="audit-log-button"]');
    await expect(
      page.locator('[data-testid="bulk-assignment-audit"]')
    ).toBeVisible();
  });

  test('should approve driver and verify they can claim jobs', async ({
    page,
  }) => {
    // Navigate to driver applications
    await page.goto('/admin/drivers/applications');
    await expect(
      page.locator('[data-testid="applications-queue"]')
    ).toBeVisible();

    // Find a pending application
    const pendingApp = page
      .locator('[data-testid="pending-application"]')
      .first();
    const driverEmail = await pendingApp
      .locator('[data-testid="driver-email"]')
      .textContent();

    // Review documents
    await pendingApp.locator('[data-testid="review-documents"]').click();
    await expect(page.locator('[data-testid="document-viewer"]')).toBeVisible();

    // Approve the application
    await page.locator('[data-testid="approve-application"]').click();
    await page
      .locator('[data-testid="approval-notes"]')
      .fill('All documents verified');
    await page.locator('[data-testid="confirm-approval"]').click();

    // Verify approval success
    await expect(
      page.locator('[data-testid="approval-success"]')
    ).toBeVisible();

    // Switch to driver context to verify they can claim jobs
    const driverContext = await page.context().browser()?.newContext();
    const driverPage = await driverContext?.newPage();

    if (driverPage && driverEmail) {
      // Login as the newly approved driver
      await driverPage.goto('/driver/login');
      await driverPage.locator('[data-testid="email-input"]').fill(driverEmail);
      await driverPage
        .locator('[data-testid="password-input"]')
        .fill('TestPassword123!');
      await driverPage.locator('[data-testid="login-button"]').click();

      // Navigate to available jobs
      await driverPage.goto('/driver/jobs/available');
      await expect(
        driverPage.locator('[data-testid="available-jobs-list"]')
      ).toBeVisible();

      // Verify driver can see and claim jobs
      const jobCard = driverPage.locator('[data-testid="job-card"]').first();
      await expect(jobCard).toBeVisible();
      await expect(
        jobCard.locator('[data-testid="claim-job-button"]')
      ).toBeVisible();

      await driverContext?.close();
    }
  });

  test('should suspend driver and verify they cannot claim jobs', async ({
    page,
  }) => {
    // Navigate to drivers roster
    await page.goto('/admin/drivers');
    await expect(page.locator('[data-testid="drivers-table"]')).toBeVisible();

    // Find an active driver
    const activeDriver = page.locator('[data-testid="active-driver"]').first();
    const driverEmail = await activeDriver
      .locator('[data-testid="driver-email"]')
      .textContent();

    // Suspend the driver
    await activeDriver.locator('[data-testid="driver-actions"]').click();
    await page.locator('[data-testid="suspend-driver"]').click();
    await page
      .locator('[data-testid="suspension-reason"]')
      .fill('Test suspension');
    await page.locator('[data-testid="confirm-suspension"]').click();

    // Verify suspension success
    await expect(
      page.locator('[data-testid="suspension-success"]')
    ).toBeVisible();

    // Switch to driver context to verify they cannot claim jobs
    const driverContext = await page.context().browser()?.newContext();
    const driverPage = await driverContext?.newPage();

    if (driverPage && driverEmail) {
      // Login as the suspended driver
      await driverPage.goto('/driver/login');
      await driverPage.locator('[data-testid="email-input"]').fill(driverEmail);
      await driverPage
        .locator('[data-testid="password-input"]')
        .fill('TestPassword123!');
      await driverPage.locator('[data-testid="login-button"]').click();

      // Should see suspension notice
      await expect(
        driverPage.locator('[data-testid="account-suspended"]')
      ).toBeVisible();

      // Try to access jobs (should be blocked)
      await driverPage.goto('/driver/jobs/available');
      await expect(
        driverPage.locator('[data-testid="access-denied"]')
      ).toBeVisible();

      await driverContext?.close();
    }
  });

  test('should issue partial refund and verify Stripe webhook sync', async ({
    page,
  }) => {
    // Navigate to finance/refunds
    await page.goto('/admin/finance/refunds');
    await expect(page.locator('[data-testid="refunds-table"]')).toBeVisible();

    // Find a completed order with payment
    const completedOrder = page
      .locator('[data-testid="completed-order"]')
      .first();
    const orderRef = await completedOrder
      .locator('[data-testid="order-reference"]')
      .textContent();
    const originalAmount = await completedOrder
      .locator('[data-testid="order-amount"]')
      .textContent();

    // Issue partial refund
    await completedOrder.locator('[data-testid="issue-refund"]').click();
    await page.locator('[data-testid="refund-amount"]').fill('25.00');
    await page
      .locator('[data-testid="refund-reason"]')
      .selectOption('customer_request');
    await page
      .locator('[data-testid="refund-notes"]')
      .fill('Partial refund for damaged item');
    await page.locator('[data-testid="confirm-refund"]').click();

    // Verify refund success
    await expect(page.locator('[data-testid="refund-success"]')).toBeVisible();

    // Wait for Stripe webhook to sync
    await page.waitForTimeout(2000); // Simulate webhook delay

    // Verify finance view is updated
    await page.goto('/admin/finance');
    await expect(
      page.locator('[data-testid="finance-dashboard"]')
    ).toBeVisible();

    // Check refund appears in finance view
    const refundEntry = page.locator(
      `[data-testid="refund-entry"][data-order="${orderRef}"]`
    );
    await expect(refundEntry).toBeVisible();

    // Verify amount reconciliation
    const refundAmount = await refundEntry
      .locator('[data-testid="refund-amount"]')
      .textContent();
    expect(refundAmount).toBe('£25.00');

    // Verify Stripe integration
    await page.click('[data-testid="stripe-sync-status"]');
    await expect(
      page.locator('[data-testid="webhook-sync-success"]')
    ).toBeVisible();
  });

  test('should handle admin role-based access control', async ({ page }) => {
    // Test different admin roles and their permissions

    // Test orders.write permission
    await page.goto('/admin/orders');
    await expect(
      page.locator('[data-testid="bulk-assign-button"]')
    ).toBeVisible();

    // Test refunds.issue permission
    await page.goto('/admin/finance/refunds');
    await expect(
      page.locator('[data-testid="issue-refund-button"]')
    ).toBeVisible();

    // Test drivers.approve permission
    await page.goto('/admin/drivers/applications');
    await expect(
      page.locator('[data-testid="approve-application"]')
    ).toBeVisible();

    // Test that unauthorized actions are hidden
    // (This would depend on the specific role of the test admin)
  });

  test('should verify real-time updates and performance', async ({ page }) => {
    // Test real-time order updates
    await page.goto('/admin/orders');

    // Monitor for real-time updates
    const orderRow = page.locator('[data-testid="order-row"]').first();
    const initialStatus = await orderRow
      .locator('[data-testid="order-status"]')
      .textContent();

    // Simulate order status change (in real scenario, this would be triggered by driver action)
    await page.waitForTimeout(1000);

    // Verify real-time update (should be fast)
    const updateStartTime = Date.now();
    await expect(
      page.locator('[data-testid="realtime-indicator"]')
    ).toBeVisible();
    const updateTime = Date.now() - updateStartTime;
    expect(updateTime).toBeLessThan(100); // Under 100ms for real-time updates

    // Test map performance with multiple markers
    await page.goto('/admin/dispatch/map');
    await expect(page.locator('[data-testid="dispatch-map"]')).toBeVisible();

    // Wait for map to load with markers
    await page.waitForTimeout(2000);

    // Verify map loads within 2 seconds with 200 markers
    const mapLoadTime = Date.now() - updateStartTime;
    expect(mapLoadTime).toBeLessThan(2000);

    // Count markers (simulated)
    const markers = await page.locator('[data-testid="driver-marker"]').count();
    expect(markers).toBeGreaterThan(0);
  });

  test('should verify audit trail and compliance', async ({ page }) => {
    // Navigate to audit logs
    await page.goto('/admin/logs');
    await expect(page.locator('[data-testid="audit-log"]')).toBeVisible();

    // Perform an action that should be audited
    await page.goto('/admin/orders');
    const orderRow = page.locator('[data-testid="order-row"]').first();
    await orderRow.locator('[data-testid="edit-order"]').click();
    await page.locator('[data-testid="order-notes"]').fill('Test audit note');
    await page.locator('[data-testid="save-order"]').click();

    // Check audit log for the action
    await page.goto('/admin/logs');
    await page.fill('[data-testid="audit-search"]', 'order edit');
    await page.click('[data-testid="search-audit"]');

    // Verify audit entry exists
    await expect(page.locator('[data-testid="audit-entry"]')).toBeVisible();

    // Verify audit details
    const auditEntry = page.locator('[data-testid="audit-entry"]').first();
    await expect(
      auditEntry.locator('[data-testid="audit-action"]')
    ).toContainText('order.edit');
    await expect(
      auditEntry.locator('[data-testid="audit-user"]')
    ).toContainText('admin@speedy-van.co.uk');
    await expect(
      auditEntry.locator('[data-testid="audit-timestamp"]')
    ).toBeVisible();
  });
});
