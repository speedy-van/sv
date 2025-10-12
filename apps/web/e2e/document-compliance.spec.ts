import { test, expect } from '@playwright/test';

test.describe('Document Compliance & Blocking', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test driver
    await page.goto('/driver/login');
    await page.fill(
      '[data-testid="email-input"]',
      'test-driver@speedy-van.co.uk'
    );
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');

    // Wait for dashboard to load
    await expect(page).toHaveURL('/driver/dashboard');
  });

  test('should block job claiming with expired documents', async ({ page }) => {
    // Navigate to documents page
    await page.goto('/driver/documents');

    // Check if any documents are expired
    const expiredDocs = page.locator('[data-testid="expired-document"]');
    const expiredCount = await expiredDocs.count();

    if (expiredCount > 0) {
      // Try to claim a job
      await page.goto('/driver/jobs/available');

      // Should show blocking banner
      await expect(
        page.locator('[data-testid="document-blocking-banner"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="document-blocking-banner"]')
      ).toContainText('Expired documents');

      // Claim button should be disabled
      await expect(
        page.locator('[data-testid="claim-job-button"]').first()
      ).toBeDisabled();

      // Click on banner should navigate to documents
      await page.click('[data-testid="document-blocking-banner"]');
      await expect(page).toHaveURL('/driver/documents');
    } else {
      // No expired documents, should be able to claim jobs
      await page.goto('/driver/jobs/available');
      await expect(
        page.locator('[data-testid="claim-job-button"]').first()
      ).toBeEnabled();
    }
  });

  test('should show document expiry warnings', async ({ page }) => {
    // Navigate to documents page
    await page.goto('/driver/documents');

    // Check for documents expiring soon (within 30 days)
    const expiringSoonDocs = page.locator(
      '[data-testid="expiring-soon-document"]'
    );
    const expiringCount = await expiringSoonDocs.count();

    if (expiringCount > 0) {
      // Should show warning banner
      await expect(
        page.locator('[data-testid="document-warning-banner"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="document-warning-banner"]')
      ).toContainText('expiring soon');
    }
  });

  test('should allow document upload and renewal', async ({ page }) => {
    // Navigate to documents page
    await page.goto('/driver/documents');

    // Click on upload button for license
    await page.click('[data-testid="upload-license-button"]');

    // Should open upload modal
    await expect(
      page.locator('[data-testid="document-upload-modal"]')
    ).toBeVisible();

    // Fill in document details
    await page.fill('[data-testid="document-number-input"]', 'NEW123456');
    await page.fill('[data-testid="document-expiry-input"]', '2035-01-01');

    // Upload file (mock)
    const fileInput = page.locator('[data-testid="document-file-input"]');
    await fileInput.setInputFiles('test-files/license.pdf');

    // Submit upload
    await page.click('[data-testid="submit-document-button"]');

    // Should show success message
    await expect(
      page.locator('[data-testid="upload-success-message"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="upload-success-message"]')
    ).toContainText('Document uploaded successfully');
  });

  test('should handle document review status', async ({ page }) => {
    // Navigate to documents page
    await page.goto('/driver/documents');

    // Check for pending review documents
    const pendingDocs = page.locator('[data-testid="pending-review-document"]');
    const pendingCount = await pendingDocs.count();

    if (pendingCount > 0) {
      // Should show pending status
      await expect(
        page.locator('[data-testid="pending-status-badge"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="pending-status-badge"]')
      ).toContainText('Pending Review');
    }
  });

  test('should show document audit trail', async ({ page }) => {
    // Navigate to documents page
    await page.goto('/driver/documents');

    // Click on a document to view details
    await page.locator('[data-testid="document-item"]').first().click();

    // Should show document details modal
    await expect(
      page.locator('[data-testid="document-details-modal"]')
    ).toBeVisible();

    // Should show audit trail
    await expect(
      page.locator('[data-testid="document-audit-trail"]')
    ).toBeVisible();

    // Should show upload date, review date, etc.
    await expect(page.locator('[data-testid="upload-date"]')).toBeVisible();
    await expect(page.locator('[data-testid="review-date"]')).toBeVisible();
  });

  test('should handle document rejection', async ({ page }) => {
    // Navigate to documents page
    await page.goto('/driver/documents');

    // Check for rejected documents
    const rejectedDocs = page.locator('[data-testid="rejected-document"]');
    const rejectedCount = await rejectedDocs.count();

    if (rejectedCount > 0) {
      // Should show rejection reason
      await expect(
        page.locator('[data-testid="rejection-reason"]')
      ).toBeVisible();

      // Should show resubmit button
      await expect(
        page.locator('[data-testid="resubmit-document-button"]')
      ).toBeVisible();

      // Click resubmit
      await page.click('[data-testid="resubmit-document-button"]');

      // Should open upload modal
      await expect(
        page.locator('[data-testid="document-upload-modal"]')
      ).toBeVisible();
    }
  });

  test('should block access with missing required documents', async ({
    page,
  }) => {
    // Navigate to documents page
    await page.goto('/driver/documents');

    // Check for missing required documents
    const missingDocs = page.locator('[data-testid="missing-document"]');
    const missingCount = await missingDocs.count();

    if (missingCount > 0) {
      // Should show missing documents warning
      await expect(
        page.locator('[data-testid="missing-documents-warning"]')
      ).toBeVisible();

      // Try to access jobs
      await page.goto('/driver/jobs/available');

      // Should show blocking message
      await expect(
        page.locator('[data-testid="missing-documents-block"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="missing-documents-block"]')
      ).toContainText('Required documents missing');
    }
  });

  test('should send document expiry notifications', async ({ page }) => {
    // Navigate to notifications page
    await page.goto('/driver/notifications');

    // Check for document expiry notifications
    const docNotifications = page.locator(
      '[data-testid="document-expiry-notification"]'
    );
    const notificationCount = await docNotifications.count();

    if (notificationCount > 0) {
      // Should show notification about expiring documents
      await expect(
        page.locator('[data-testid="document-expiry-notification"]').first()
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="document-expiry-notification"]').first()
      ).toContainText('expiring');

      // Click notification should navigate to documents
      await page
        .locator('[data-testid="document-expiry-notification"]')
        .first()
        .click();
      await expect(page).toHaveURL('/driver/documents');
    }
  });
});
