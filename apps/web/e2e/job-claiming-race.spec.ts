import { test, expect } from '@playwright/test';

test.describe('Job Claiming Race Conditions & Stepper Flow', () => {
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

  test('should handle job claiming race condition', async ({
    page,
    context,
  }) => {
    // Navigate to available jobs
    await page.goto('/driver/jobs/available');

    // Wait for jobs to load
    await expect(
      page.locator('[data-testid="available-jobs-list"]')
    ).toBeVisible();

    // Get the first available job
    const firstJob = page.locator('[data-testid="job-card"]').first();
    const jobId = await firstJob.getAttribute('data-job-id');

    // Create a second browser context to simulate another driver
    const context2 = await context.browser()?.newContext();
    const page2 = await context2?.newPage();

    if (page2) {
      // Login as same driver in second context
      await page2.goto('/driver/login');
      await page2.fill(
        '[data-testid="email-input"]',
        'test-driver@speedy-van.co.uk'
      );
      await page2.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page2.click('[data-testid="login-button"]');
      await page2.goto('/driver/jobs/available');

      // Both drivers try to claim the same job simultaneously
      const claimPromises = [
        page.click(`[data-testid="claim-job-button"][data-job-id="${jobId}"]`),
        page2.click(`[data-testid="claim-job-button"][data-job-id="${jobId}"]`),
      ];

      await Promise.all(claimPromises);

      // One should succeed, one should fail
      const successCount = await page
        .locator('[data-testid="claim-success-message"]')
        .count();
      const failureCount = await page
        .locator('[data-testid="claim-failed-message"]')
        .count();

      expect(successCount + failureCount).toBe(2);
      expect(successCount).toBe(1);
      expect(failureCount).toBe(1);

      await context2?.close();
    }
  });

  test('should complete job stepper flow', async ({ page }) => {
    // First claim a job
    await page.goto('/driver/jobs/available');
    await page.locator('[data-testid="claim-job-button"]').first().click();

    // Should redirect to active job
    await expect(page).toHaveURL(/\/driver\/jobs\/active/);

    // Step 1: Navigate to pickup
    await expect(
      page.locator('[data-testid="step-navigate-pickup"]')
    ).toBeVisible();
    await page.click('[data-testid="start-navigation-button"]');

    // Step 2: Arrived at pickup
    await page.click('[data-testid="arrived-pickup-button"]');
    await expect(
      page.locator('[data-testid="step-arrived-pickup"]')
    ).toHaveClass(/completed/);

    // Step 3: Load items
    await expect(page.locator('[data-testid="step-load-items"]')).toBeVisible();
    await page.fill('[data-testid="item-count-input"]', '5');
    await page.click('[data-testid="upload-photo-button"]');
    // Note: File upload would be handled differently in real test
    await page.click('[data-testid="load-complete-button"]');

    // Step 4: En route to dropoff
    await expect(page.locator('[data-testid="step-en-route"]')).toBeVisible();
    await page.click('[data-testid="start-dropoff-navigation-button"]');

    // Step 5: Arrived at dropoff
    await page.click('[data-testid="arrived-dropoff-button"]');
    await expect(
      page.locator('[data-testid="step-arrived-dropoff"]')
    ).toHaveClass(/completed/);

    // Step 6: Unload items
    await expect(
      page.locator('[data-testid="step-unload-items"]')
    ).toBeVisible();
    await page.fill('[data-testid="final-item-count-input"]', '5');
    await page.click('[data-testid="upload-unload-photo-button"]');
    await page.click('[data-testid="unload-complete-button"]');

    // Step 7: Complete job
    await expect(page.locator('[data-testid="step-complete"]')).toBeVisible();
    await page.fill('[data-testid="customer-signature-input"]', 'John Doe');
    await page.click('[data-testid="complete-job-button"]');

    // Should show completion message
    await expect(
      page.locator('[data-testid="job-complete-message"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="job-complete-message"]')
    ).toContainText('Job completed successfully');
  });

  test('should prevent skipping steps', async ({ page }) => {
    // Claim a job
    await page.goto('/driver/jobs/available');
    await page.locator('[data-testid="claim-job-button"]').first().click();

    // Try to skip to step 3 without completing step 2
    await page.click('[data-testid="step-load-items"]');

    // Should show error message
    await expect(
      page.locator('[data-testid="step-error-message"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="step-error-message"]')
    ).toContainText('Complete previous steps first');
  });

  test('should require required proofs for completion', async ({ page }) => {
    // Claim a job
    await page.goto('/driver/jobs/available');
    await page.locator('[data-testid="claim-job-button"]').first().click();

    // Complete all steps but skip required photo
    await page.click('[data-testid="arrived-pickup-button"]');
    await page.click('[data-testid="load-complete-button"]'); // Without photo
    await page.click('[data-testid="start-dropoff-navigation-button"]');
    await page.click('[data-testid="arrived-dropoff-button"]');
    await page.click('[data-testid="unload-complete-button"]'); // Without photo
    await page.click('[data-testid="complete-job-button"]');

    // Should show error about missing required proofs
    await expect(
      page.locator('[data-testid="proof-error-message"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="proof-error-message"]')
    ).toContainText('Required photos missing');
  });

  test('should handle job cancellation', async ({ page }) => {
    // Claim a job
    await page.goto('/driver/jobs/available');
    await page.locator('[data-testid="claim-job-button"]').first().click();

    // Cancel the job
    await page.click('[data-testid="cancel-job-button"]');

    // Should show confirmation dialog
    await expect(
      page.locator('[data-testid="cancel-confirmation-dialog"]')
    ).toBeVisible();
    await page.click('[data-testid="confirm-cancel-button"]');

    // Should redirect back to available jobs
    await expect(page).toHaveURL('/driver/jobs/available');

    // Should show cancellation message
    await expect(
      page.locator('[data-testid="job-cancelled-message"]')
    ).toBeVisible();
  });
});
