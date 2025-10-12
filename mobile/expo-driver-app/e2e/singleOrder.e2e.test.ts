/**
 * E2E Test: Single Order Flow (Android/Expo)
 * 
 * Tests the complete flow of accepting and completing a single order
 * Verifies earnings calculation matches driverEarningsService
 * 
 * Run with: detox test --configuration android.emu.debug
 */

import { device, element, by, expect as detoxExpect, waitFor } from 'detox';

describe('Single Order E2E Test', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { location: 'always', camera: 'YES', photos: 'YES' },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  // MARK: - Test Single Order Complete Flow

  it('should complete single order flow successfully', async () => {
    // 1. Login
    await loginAsTestDriver();

    // 2. Navigate to Available Jobs
    await element(by.id('tab-available')).tap();

    // 3. Wait for jobs to load
    await waitFor(element(by.id('job-card-0')))
      .toBeVisible()
      .withTimeout(10000);

    // 4. Verify earnings display (no percentage!)
    const earningsElement = element(by.id('job-earnings-0'));
    await detoxExpect(earningsElement).toBeVisible();

    // Get earnings text
    const earningsAttributes = await earningsElement.getAttributes();
    const earningsText = earningsAttributes.text || '';
    
    detoxExpect(earningsText).toContain('£');
    detoxExpect(earningsText).not.toContain('%');

    // Extract and verify amount
    const earningsAmount = extractAmount(earningsText);
    detoxExpect(earningsAmount).toBeGreaterThan(0);

    // 5. Tap to view job details
    await element(by.id('job-card-0')).tap();

    // 6. Verify Job Detail Screen
    await waitFor(element(by.text('Job Details')))
      .toBeVisible()
      .withTimeout(5000);

    // 7. Verify earnings breakdown
    await detoxExpect(element(by.text('Base Fare'))).toBeVisible();
    await detoxExpect(element(by.text('Mileage Fee'))).toBeVisible();
    await detoxExpect(element(by.text('Time Fee'))).toBeVisible();

    // 8. Accept the job
    await element(by.id('accept-job-button')).tap();

    // 9. Confirm acceptance
    await waitFor(element(by.text('Confirm')))
      .toBeVisible()
      .withTimeout(2000);
    await element(by.text('Confirm')).tap();

    // 10. Verify navigation to Active Jobs
    await waitFor(element(by.id('tab-active')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id('tab-active')).tap();

    // 11. Verify job appears in active list
    await waitFor(element(by.id('active-job-card-0')))
      .toBeVisible()
      .withTimeout(5000);

    // 12. Start the job
    await element(by.id('active-job-card-0')).tap();
    await element(by.id('start-job-button')).tap();

    // 13. Verify live tracking
    await waitFor(element(by.id('map-view')))
      .toBeVisible()
      .withTimeout(5000);
    await detoxExpect(element(by.id('current-location-marker'))).toBeVisible();

    // 14. Arrive at pickup
    await waitFor(element(by.id('arrive-pickup-button')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id('arrive-pickup-button')).tap();

    // 15. Start delivery
    await waitFor(element(by.id('start-delivery-button')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id('start-delivery-button')).tap();

    // 16. Arrive at dropoff
    await waitFor(element(by.id('arrive-dropoff-button')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id('arrive-dropoff-button')).tap();

    // 17. Complete delivery
    await waitFor(element(by.id('complete-delivery-button')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id('complete-delivery-button')).tap();

    // 18. Verify completion screen
    await waitFor(element(by.text('Job Completion')))
      .toBeVisible()
      .withTimeout(5000);

    // 19. Take photo proof
    await element(by.id('take-photo-button')).tap();
    
    // Simulate camera (in test, use mock)
    await waitFor(element(by.id('use-photo-button')))
      .toBeVisible()
      .withTimeout(3000);
    await element(by.id('use-photo-button')).tap();

    // 20. Get signature
    await element(by.id('get-signature-button')).tap();
    
    // Draw signature (simulate)
    await element(by.id('signature-canvas')).swipe('right', 'fast', 0.5);
    await element(by.id('done-signature-button')).tap();

    // 21. Submit completion
    await element(by.id('submit-completion-button')).tap();

    // 22. Verify earnings summary
    await waitFor(element(by.text('Earnings Summary')))
      .toBeVisible()
      .withTimeout(10000);

    // 23. Verify final earnings
    const finalEarningsElement = element(by.id('final-earnings'));
    await detoxExpect(finalEarningsElement).toBeVisible();

    const finalEarningsAttributes = await finalEarningsElement.getAttributes();
    const finalEarningsText = finalEarningsAttributes.text || '';
    const finalAmount = extractAmount(finalEarningsText);

    // 24. Verify earnings are reasonable
    detoxExpect(finalAmount).toBeGreaterThan(20.0);
    detoxExpect(finalAmount).toBeLessThan(500.0);

    // 25. Verify no platform fee shown
    await detoxExpect(element(by.text('Platform Fee'))).not.toBeVisible();

    // 26. Verify breakdown components
    const baseFareElement = element(by.id('base-fare-amount'));
    const mileageElement = element(by.id('mileage-amount'));
    const timeElement = element(by.id('time-amount'));

    await detoxExpect(baseFareElement).toBeVisible();
    await detoxExpect(mileageElement).toBeVisible();
    await detoxExpect(timeElement).toBeVisible();

    const baseFareAttrs = await baseFareElement.getAttributes();
    const mileageAttrs = await mileageElement.getAttributes();
    const timeAttrs = await timeElement.getAttributes();

    const baseFareAmount = extractAmount(baseFareAttrs.text || '');
    const mileageAmount = extractAmount(mileageAttrs.text || '');
    const timeAmount = extractAmount(timeAttrs.text || '');

    detoxExpect(baseFareAmount).toBeGreaterThan(0);
    detoxExpect(mileageAmount).toBeGreaterThanOrEqual(0);
    detoxExpect(timeAmount).toBeGreaterThanOrEqual(0);

    // 27. Verify total matches sum
    const calculatedTotal = baseFareAmount + mileageAmount + timeAmount;
    const tolerance = 0.01;
    detoxExpect(Math.abs(finalAmount - calculatedTotal)).toBeLessThan(tolerance);

    // 28. Done
    await element(by.id('done-button')).tap();

    // 29. Verify back to dashboard
    await waitFor(element(by.text('Dashboard')))
      .toBeVisible()
      .withTimeout(5000);

    console.log('✅ Single Order E2E Test Passed!');
  });

  // MARK: - Test Earnings Calculation Accuracy

  it('should calculate earnings accurately', async () => {
    await loginAsTestDriver();

    // Navigate to available jobs
    await element(by.id('tab-available')).tap();

    // Find test job with known parameters
    await waitFor(element(by.id('test-job-card')))
      .toBeVisible()
      .withTimeout(10000);

    // Extract job details
    const distanceElement = element(by.id('test-job-distance'));
    const durationElement = element(by.id('test-job-duration'));
    const earningsElement = element(by.id('test-job-earnings'));

    const distanceAttrs = await distanceElement.getAttributes();
    const durationAttrs = await durationElement.getAttributes();
    const earningsAttrs = await earningsElement.getAttributes();

    const distance = extractNumber(distanceAttrs.text || ''); // e.g., "12.5 miles"
    const duration = extractNumber(durationAttrs.text || ''); // e.g., "45 min"
    const displayedEarnings = extractAmount(earningsAttrs.text || '');

    // Calculate expected earnings
    const baseFare = 25.0;
    const perMileFee = 0.55;
    const perMinuteFee = 0.15;

    const expectedEarnings = baseFare + (distance * perMileFee) + (duration * perMinuteFee);

    // Verify accuracy (allow 1% tolerance)
    const tolerance = expectedEarnings * 0.01;
    detoxExpect(Math.abs(displayedEarnings - expectedEarnings)).toBeLessThan(tolerance);

    console.log('✅ Earnings Calculation Accuracy Test Passed!');
    console.log(`   Distance: ${distance} miles`);
    console.log(`   Duration: ${duration} minutes`);
    console.log(`   Expected: £${expectedEarnings.toFixed(2)}`);
    console.log(`   Displayed: £${displayedEarnings.toFixed(2)}`);
  });

  // MARK: - Test Daily Cap Enforcement

  it('should enforce daily cap of £500', async () => {
    await loginAsTestDriver();

    // Navigate to Earnings
    await element(by.id('tab-earnings')).tap();

    // Check today's total
    await waitFor(element(by.id('today-total')))
      .toBeVisible()
      .withTimeout(5000);

    const todayTotalElement = element(by.id('today-total'));
    const todayTotalAttrs = await todayTotalElement.getAttributes();
    const todayTotal = extractAmount(todayTotalAttrs.text || '');

    // Verify cap warning if approaching £500
    if (todayTotal >= 450.0) {
      await detoxExpect(element(by.id('cap-warning'))).toBeVisible();
    }

    // Verify cannot exceed £500
    detoxExpect(todayTotal).toBeLessThanOrEqual(500.0);

    console.log('✅ Daily Cap Enforcement Test Passed!');
    console.log(`   Today's Total: £${todayTotal.toFixed(2)}`);
  });

  // MARK: - Helper Functions

  async function loginAsTestDriver() {
    await element(by.id('email-input')).typeText('test.driver@speedyvan.co.uk');
    await element(by.id('password-input')).typeText('TestDriver123!');
    await element(by.id('login-button')).tap();

    await waitFor(element(by.text('Dashboard')))
      .toBeVisible()
      .withTimeout(10000);
  }

  function extractAmount(text: string): number {
    const match = text.match(/£([0-9]+\.?[0-9]*)/);
    return match ? parseFloat(match[1]) : 0.0;
  }

  function extractNumber(text: string): number {
    const match = text.match(/([0-9]+\.?[0-9]*)/);
    return match ? parseFloat(match[1]) : 0.0;
  }
});

