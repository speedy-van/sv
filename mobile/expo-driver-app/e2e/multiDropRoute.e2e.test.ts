/**
 * E2E Test: Multiple Drops Route Flow (Android/Expo)
 * 
 * Tests the complete flow of accepting and completing a multi-drop route
 * Verifies earnings calculation for routes with multiple stops
 * 
 * Run with: detox test --configuration android.emu.debug
 */

import { device, element, by, expect as detoxExpect, waitFor } from 'detox';

describe('Multi-Drop Route E2E Test', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { location: 'always', camera: 'YES', photos: 'YES' },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  // MARK: - Test Multi-Drop Route Complete Flow

  it('should complete multi-drop route flow successfully', async () => {
    // 1. Login
    await loginAsTestDriver();

    // 2. Navigate to Routes
    await element(by.id('tab-routes')).tap();

    // 3. Wait for routes to load
    await waitFor(element(by.id('route-card-0')))
      .toBeVisible()
      .withTimeout(10000);

    // 4. Verify route info
    const dropsCountElement = element(by.id('route-drops-count-0'));
    await detoxExpect(dropsCountElement).toBeVisible();

    const dropsCountAttrs = await dropsCountElement.getAttributes();
    const dropsText = dropsCountAttrs.text || '';
    const dropsCount = extractNumber(dropsText); // e.g., "5 stops"

    detoxExpect(dropsCount).toBeGreaterThan(1);

    // 5. Verify earnings (should include per-drop bonus)
    const earningsElement = element(by.id('route-earnings-0'));
    await detoxExpect(earningsElement).toBeVisible();

    const earningsAttrs = await earningsElement.getAttributes();
    const earningsText = earningsAttrs.text || '';
    
    detoxExpect(earningsText).not.toContain('%');

    const routeEarnings = extractAmount(earningsText);
    detoxExpect(routeEarnings).toBeGreaterThan(0);

    // 6. Calculate expected minimum earnings
    const expectedMinimum = 25.0 + (dropsCount * 12.0); // Base + per-drop bonus
    detoxExpect(routeEarnings).toBeGreaterThanOrEqual(expectedMinimum);

    // 7. Tap to view route details
    await element(by.id('route-card-0')).tap();

    // 8. Verify Route Detail Screen
    await waitFor(element(by.text('Route Details')))
      .toBeVisible()
      .withTimeout(5000);

    // 9. Verify all drops are listed
    for (let i = 0; i < dropsCount; i++) {
      await detoxExpect(element(by.id(`drop-item-${i}`))).toBeVisible();
    }

    // 10. Verify earnings breakdown
    await detoxExpect(element(by.text('Base Fare'))).toBeVisible();
    await detoxExpect(element(by.text('Mileage Fee'))).toBeVisible();
    await detoxExpect(element(by.text('Time Fee'))).toBeVisible();
    await detoxExpect(element(by.text('Multi-Drop Bonus'))).toBeVisible();

    // 11. Verify drop bonus amount
    const dropBonusElement = element(by.id('drop-bonus-amount'));
    const dropBonusAttrs = await dropBonusElement.getAttributes();
    const dropBonusAmount = extractAmount(dropBonusAttrs.text || '');

    const expectedDropBonus = (dropsCount - 1) * 12.0; // £12 per additional drop
    const tolerance = 0.01;
    detoxExpect(Math.abs(dropBonusAmount - expectedDropBonus)).toBeLessThan(tolerance);

    // 12. Accept the route
    await element(by.id('accept-route-button')).tap();

    // 13. Confirm acceptance
    await waitFor(element(by.text('Confirm')))
      .toBeVisible()
      .withTimeout(2000);
    await element(by.text('Confirm')).tap();

    // 14. Verify navigation to Active Routes
    await waitFor(element(by.id('tab-active')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id('tab-active')).tap();

    // 15. Start the route
    await waitFor(element(by.id('active-route-card-0')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id('active-route-card-0')).tap();

    await element(by.id('start-route-button')).tap();

    // 16. Verify live tracking with multiple markers
    await waitFor(element(by.id('map-view')))
      .toBeVisible()
      .withTimeout(5000);
    await detoxExpect(element(by.id('current-location-marker'))).toBeVisible();

    // Verify all drop markers are shown
    for (let i = 1; i <= dropsCount; i++) {
      await detoxExpect(element(by.id(`drop-marker-${i}`))).toBeVisible();
    }

    // 17. Complete each drop
    for (let dropIndex = 1; dropIndex <= dropsCount; dropIndex++) {
      // Arrive at drop
      await waitFor(element(by.id(`arrive-drop-${dropIndex}-button`)))
        .toBeVisible()
        .withTimeout(10000);
      await element(by.id(`arrive-drop-${dropIndex}-button`)).tap();

      // Complete drop
      await waitFor(element(by.id(`complete-drop-${dropIndex}-button`)))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.id(`complete-drop-${dropIndex}-button`)).tap();

      // Take photo (for each drop)
      const photoButton = element(by.id('take-photo-button'));
      const photoButtonExists = await photoButton.exists();
      
      if (photoButtonExists) {
        await photoButton.tap();

        await waitFor(element(by.id('use-photo-button')))
          .toBeVisible()
          .withTimeout(3000);
        await element(by.id('use-photo-button')).tap();
      }

      // Confirm completion
      const confirmButton = element(by.text('Confirm'));
      const confirmExists = await confirmButton.exists();
      
      if (confirmExists) {
        await confirmButton.tap();
      }

      // Verify drop is marked as completed
      await waitFor(element(by.id(`drop-${dropIndex}-completed`)))
        .toBeVisible()
        .withTimeout(3000);
    }

    // 18. Complete entire route
    await waitFor(element(by.id('complete-route-button')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id('complete-route-button')).tap();

    // 19. Get final signature
    const signatureButton = element(by.id('get-signature-button'));
    const signatureExists = await signatureButton.exists();
    
    if (signatureExists) {
      await signatureButton.tap();

      await element(by.id('signature-canvas')).swipe('right', 'fast', 0.5);
      await element(by.id('done-signature-button')).tap();
    }

    // 20. Submit completion
    await element(by.id('submit-button')).tap();

    // 21. Verify earnings summary
    await waitFor(element(by.text('Earnings Summary')))
      .toBeVisible()
      .withTimeout(10000);

    // 22. Verify final earnings
    const finalEarningsElement = element(by.id('final-earnings'));
    await detoxExpect(finalEarningsElement).toBeVisible();

    const finalEarningsAttrs = await finalEarningsElement.getAttributes();
    const finalEarningsText = finalEarningsAttrs.text || '';
    const finalAmount = extractAmount(finalEarningsText);

    // 23. Verify earnings are reasonable for multi-drop
    const minimumMultiDropEarnings = 50.0;
    detoxExpect(finalAmount).toBeGreaterThan(minimumMultiDropEarnings);
    detoxExpect(finalAmount).toBeLessThan(500.0);

    // 24. Verify breakdown includes multi-drop bonus
    const finalDropBonusElement = element(by.id('final-drop-bonus'));
    const finalDropBonusAttrs = await finalDropBonusElement.getAttributes();
    const finalDropBonus = extractAmount(finalDropBonusAttrs.text || '');

    detoxExpect(Math.abs(finalDropBonus - expectedDropBonus)).toBeLessThan(tolerance);

    // 25. Verify no platform fee
    await detoxExpect(element(by.text('Platform Fee'))).not.toBeVisible();

    // 26. Done
    await element(by.id('done-button')).tap();

    console.log('✅ Multi-Drop Route E2E Test Passed!');
    console.log(`   Drops: ${dropsCount}`);
    console.log(`   Final Earnings: £${finalAmount.toFixed(2)}`);
    console.log(`   Drop Bonus: £${finalDropBonus.toFixed(2)}`);
  });

  // MARK: - Test Route Earnings Calculation

  it('should calculate route earnings accurately', async () => {
    await loginAsTestDriver();

    // Navigate to Routes
    await element(by.id('tab-routes')).tap();

    // Find test route with known parameters
    await waitFor(element(by.id('test-route-card')))
      .toBeVisible()
      .withTimeout(10000);

    // Extract route details
    const dropsCountElement = element(by.id('test-route-drops-count'));
    const distanceElement = element(by.id('test-route-distance'));
    const durationElement = element(by.id('test-route-duration'));
    const earningsElement = element(by.id('test-route-earnings'));

    const dropsCountAttrs = await dropsCountElement.getAttributes();
    const distanceAttrs = await distanceElement.getAttributes();
    const durationAttrs = await durationElement.getAttributes();
    const earningsAttrs = await earningsElement.getAttributes();

    const dropsCount = extractNumber(dropsCountAttrs.text || '');
    const distance = extractNumber(distanceAttrs.text || '');
    const duration = extractNumber(durationAttrs.text || '');
    const displayedEarnings = extractAmount(earningsAttrs.text || '');

    // Calculate expected earnings
    const baseFare = 25.0;
    const perMileFee = 0.55;
    const perMinuteFee = 0.15;
    const perDropBonus = 12.0;

    const expectedEarnings = baseFare 
      + (distance * perMileFee) 
      + (duration * perMinuteFee)
      + ((dropsCount - 1) * perDropBonus);

    // Verify accuracy
    const tolerance = expectedEarnings * 0.01;
    detoxExpect(Math.abs(displayedEarnings - expectedEarnings)).toBeLessThan(tolerance);

    console.log('✅ Route Earnings Calculation Test Passed!');
    console.log(`   Drops: ${dropsCount}`);
    console.log(`   Distance: ${distance} miles`);
    console.log(`   Duration: ${duration} minutes`);
    console.log(`   Expected: £${expectedEarnings.toFixed(2)}`);
    console.log(`   Displayed: £${displayedEarnings.toFixed(2)}`);
  });

  // MARK: - Test Route Progress Tracking

  it('should track route progress correctly', async () => {
    await loginAsTestDriver();

    // Start a route
    await startTestRoute();

    // Verify progress bar
    const progressBar = element(by.id('route-progress'));
    await detoxExpect(progressBar).toBeVisible();

    // Initial progress should be 0%
    const initialProgressAttrs = await progressBar.getAttributes();
    const initialProgress = extractNumber(initialProgressAttrs.text || '0%');
    detoxExpect(initialProgress).toBe(0);

    // Complete first drop
    await completeNextDrop();

    // Progress should increase
    const progressAfterFirstAttrs = await progressBar.getAttributes();
    const progressAfterFirst = extractNumber(progressAfterFirstAttrs.text || '0%');
    detoxExpect(progressAfterFirst).toBeGreaterThan(0);

    console.log('✅ Route Progress Tracking Test Passed!');
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

  async function startTestRoute() {
    await element(by.id('tab-routes')).tap();

    await waitFor(element(by.id('test-route-card')))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.id('test-route-card')).tap();

    await element(by.id('accept-route-button')).tap();

    const confirmButton = element(by.text('Confirm'));
    const confirmExists = await confirmButton.exists();
    if (confirmExists) {
      await confirmButton.tap();
    }

    await element(by.id('tab-active')).tap();

    await waitFor(element(by.id('active-route-card-0')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id('active-route-card-0')).tap();

    await element(by.id('start-route-button')).tap();
  }

  async function completeNextDrop() {
    const arriveButton = element(by.id('arrive-drop-1-button'));
    await arriveButton.tap();

    const completeButton = element(by.id('complete-drop-1-button'));
    await completeButton.tap();

    const photoButton = element(by.id('take-photo-button'));
    const photoExists = await photoButton.exists();
    if (photoExists) {
      await photoButton.tap();
      await waitFor(element(by.id('use-photo-button')))
        .toBeVisible()
        .withTimeout(2000);
      await element(by.id('use-photo-button')).tap();
    }

    const confirmButton = element(by.text('Confirm'));
    const confirmExists = await confirmButton.exists();
    if (confirmExists) {
      await confirmButton.tap();
    }
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

