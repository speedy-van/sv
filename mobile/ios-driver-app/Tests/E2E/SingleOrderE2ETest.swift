/**
 * E2E Test: Single Order Flow
 * 
 * Tests the complete flow of accepting and completing a single order
 * Verifies earnings calculation matches driverEarningsService
 */

import XCTest
@testable import SpeedyVanDriver

final class SingleOrderE2ETest: XCTestCase {
    
    var app: XCUIApplication!
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["UI-Testing"]
        app.launch()
    }
    
    override func tearDownWithError() throws {
        app = nil
    }
    
    // MARK: - Test Single Order Flow
    
    func testSingleOrderCompleteFlow() throws {
        // 1. Login
        loginAsTestDriver()
        
        // 2. Navigate to Available Jobs
        let availableJobsTab = app.tabBars.buttons["Available"]
        XCTAssertTrue(availableJobsTab.waitForExistence(timeout: 5))
        availableJobsTab.tap()
        
        // 3. Wait for jobs to load
        let firstJobCard = app.scrollViews.otherElements.containing(.staticText, identifier: "job-card").element
        XCTAssertTrue(firstJobCard.waitForExistence(timeout: 10))
        
        // 4. Verify earnings display (no percentage!)
        let earningsLabel = firstJobCard.staticTexts.matching(identifier: "estimated-earnings").element
        XCTAssertTrue(earningsLabel.exists)
        
        let earningsText = earningsLabel.label
        XCTAssertTrue(earningsText.contains("£"))
        XCTAssertFalse(earningsText.contains("%"), "Earnings should NOT show percentage")
        
        // Extract earnings amount
        let earningsAmount = extractAmount(from: earningsText)
        XCTAssertGreaterThan(earningsAmount, 0, "Earnings must be positive")
        
        // 5. Tap to view job details
        firstJobCard.tap()
        
        // 6. Verify Job Detail Screen
        let jobDetailTitle = app.navigationBars["Job Details"]
        XCTAssertTrue(jobDetailTitle.waitForExistence(timeout: 5))
        
        // 7. Verify earnings breakdown
        let baseFareLabel = app.staticTexts["Base Fare"]
        let mileageFeeLabel = app.staticTexts["Mileage Fee"]
        let timeFeeLabel = app.staticTexts["Time Fee"]
        
        XCTAssertTrue(baseFareLabel.exists, "Base fare should be shown")
        XCTAssertTrue(mileageFeeLabel.exists, "Mileage fee should be shown")
        XCTAssertTrue(timeFeeLabel.exists, "Time fee should be shown")
        
        // 8. Accept the job
        let acceptButton = app.buttons["Accept Job"]
        XCTAssertTrue(acceptButton.exists)
        acceptButton.tap()
        
        // 9. Confirm acceptance
        let confirmButton = app.alerts.buttons["Confirm"]
        if confirmButton.waitForExistence(timeout: 2) {
            confirmButton.tap()
        }
        
        // 10. Verify navigation to Active Jobs
        let activeJobsTab = app.tabBars.buttons["Active"]
        XCTAssertTrue(activeJobsTab.waitForExistence(timeout: 5))
        activeJobsTab.tap()
        
        // 11. Verify job appears in active list
        let activeJobCard = app.scrollViews.otherElements.containing(.staticText, identifier: "active-job-card").element
        XCTAssertTrue(activeJobCard.waitForExistence(timeout: 5))
        
        // 12. Start the job
        activeJobCard.tap()
        let startButton = app.buttons["Start Job"]
        XCTAssertTrue(startButton.exists)
        startButton.tap()
        
        // 13. Verify live tracking
        let mapView = app.otherElements["map-view"]
        XCTAssertTrue(mapView.waitForExistence(timeout: 5))
        
        let currentLocationMarker = app.otherElements["current-location-marker"]
        XCTAssertTrue(currentLocationMarker.exists, "Current location should be shown on map")
        
        // 14. Arrive at pickup
        let arrivePickupButton = app.buttons["Arrive at Pickup"]
        XCTAssertTrue(arrivePickupButton.waitForExistence(timeout: 5))
        arrivePickupButton.tap()
        
        // 15. Start delivery
        let startDeliveryButton = app.buttons["Start Delivery"]
        XCTAssertTrue(startDeliveryButton.waitForExistence(timeout: 5))
        startDeliveryButton.tap()
        
        // 16. Arrive at dropoff
        let arriveDropoffButton = app.buttons["Arrive at Dropoff"]
        XCTAssertTrue(arriveDropoffButton.waitForExistence(timeout: 5))
        arriveDropoffButton.tap()
        
        // 17. Complete delivery
        let completeButton = app.buttons["Complete Delivery"]
        XCTAssertTrue(completeButton.waitForExistence(timeout: 5))
        completeButton.tap()
        
        // 18. Verify completion screen
        let completionTitle = app.navigationBars["Job Completion"]
        XCTAssertTrue(completionTitle.waitForExistence(timeout: 5))
        
        // 19. Take photo proof
        let photoButton = app.buttons["Take Photo"]
        XCTAssertTrue(photoButton.exists)
        photoButton.tap()
        
        // Simulate camera (in UI test, use mock)
        let usePhotoButton = app.buttons["Use Photo"]
        if usePhotoButton.waitForExistence(timeout: 3) {
            usePhotoButton.tap()
        }
        
        // 20. Get signature
        let signatureButton = app.buttons["Get Signature"]
        XCTAssertTrue(signatureButton.exists)
        signatureButton.tap()
        
        // Draw signature (simulate)
        let signatureCanvas = app.otherElements["signature-canvas"]
        XCTAssertTrue(signatureCanvas.exists)
        signatureCanvas.swipeRight()
        
        let doneSignatureButton = app.buttons["Done"]
        XCTAssertTrue(doneSignatureButton.exists)
        doneSignatureButton.tap()
        
        // 21. Submit completion
        let submitButton = app.buttons["Submit"]
        XCTAssertTrue(submitButton.exists)
        submitButton.tap()
        
        // 22. Verify earnings summary
        let earningSummaryTitle = app.staticTexts["Earnings Summary"]
        XCTAssertTrue(earningSummaryTitle.waitForExistence(timeout: 10))
        
        // 23. Verify final earnings
        let finalEarningsLabel = app.staticTexts.matching(identifier: "final-earnings").element
        XCTAssertTrue(finalEarningsLabel.exists)
        
        let finalEarningsText = finalEarningsLabel.label
        let finalAmount = extractAmount(from: finalEarningsText)
        
        // 24. Verify earnings are reasonable
        XCTAssertGreaterThan(finalAmount, 20.0, "Minimum earnings should be > £20")
        XCTAssertLessThan(finalAmount, 500.0, "Daily cap is £500")
        
        // 25. Verify no platform fee shown
        let platformFeeLabel = app.staticTexts["Platform Fee"]
        XCTAssertFalse(platformFeeLabel.exists, "Platform fee should NOT be shown")
        
        // 26. Verify breakdown components
        let baseFareAmount = extractAmount(from: app.staticTexts["base-fare-amount"].label)
        let mileageAmount = extractAmount(from: app.staticTexts["mileage-amount"].label)
        let timeAmount = extractAmount(from: app.staticTexts["time-amount"].label)
        
        XCTAssertGreaterThan(baseFareAmount, 0, "Base fare must be positive")
        XCTAssertGreaterThanOrEqual(mileageAmount, 0, "Mileage fee must be non-negative")
        XCTAssertGreaterThanOrEqual(timeAmount, 0, "Time fee must be non-negative")
        
        // 27. Verify total matches sum
        let calculatedTotal = baseFareAmount + mileageAmount + timeAmount
        XCTAssertEqual(finalAmount, calculatedTotal, accuracy: 0.01, "Total should match sum of components")
        
        // 28. Done
        let doneButton = app.buttons["Done"]
        XCTAssertTrue(doneButton.exists)
        doneButton.tap()
        
        // 29. Verify back to dashboard
        let dashboardTitle = app.navigationBars["Dashboard"]
        XCTAssertTrue(dashboardTitle.waitForExistence(timeout: 5))
        
        print("✅ Single Order E2E Test Passed!")
    }
    
    // MARK: - Test Earnings Calculation Accuracy
    
    func testEarningsCalculationAccuracy() throws {
        // This test verifies that the iOS app calculates earnings correctly
        // by comparing with the expected formula:
        // Earnings = Base Fare + (Distance × £0.55) + (Duration × £0.15) + Bonuses - Penalties
        
        loginAsTestDriver()
        
        // Navigate to a test job with known parameters
        let availableJobsTab = app.tabBars.buttons["Available"]
        availableJobsTab.tap()
        
        // Find test job (in UI test, we'd use a mock job with known values)
        let testJobCard = app.scrollViews.otherElements.containing(.staticText, identifier: "test-job-card").element
        XCTAssertTrue(testJobCard.waitForExistence(timeout: 10))
        
        // Extract job details
        let distanceLabel = testJobCard.staticTexts.matching(identifier: "distance").element
        let distanceText = distanceLabel.label
        let distance = extractNumber(from: distanceText) // e.g., "12.5 miles" → 12.5
        
        let durationLabel = testJobCard.staticTexts.matching(identifier: "duration").element
        let durationText = durationLabel.label
        let duration = extractNumber(from: durationText) // e.g., "45 min" → 45
        
        let earningsLabel = testJobCard.staticTexts.matching(identifier: "estimated-earnings").element
        let earningsText = earningsLabel.label
        let displayedEarnings = extractAmount(from: earningsText)
        
        // Calculate expected earnings
        let baseFare = 25.0
        let perMileFee = 0.55
        let perMinuteFee = 0.15
        
        let expectedEarnings = baseFare + (distance * perMileFee) + (duration * perMinuteFee)
        
        // Verify accuracy (allow 1% tolerance for rounding)
        let tolerance = expectedEarnings * 0.01
        XCTAssertEqual(displayedEarnings, expectedEarnings, accuracy: tolerance, 
                      "Displayed earnings should match calculated earnings")
        
        print("✅ Earnings Calculation Accuracy Test Passed!")
        print("   Distance: \(distance) miles")
        print("   Duration: \(duration) minutes")
        print("   Expected: £\(expectedEarnings)")
        print("   Displayed: £\(displayedEarnings)")
    }
    
    // MARK: - Test Daily Cap Enforcement
    
    func testDailyCap Enforcement() throws {
        loginAsTestDriver()
        
        // Navigate to Earnings
        let earningsTab = app.tabBars.buttons["Earnings"]
        earningsTab.tap()
        
        // Check today's total
        let todayTotalLabel = app.staticTexts["today-total"]
        XCTAssertTrue(todayTotalLabel.waitForExistence(timeout: 5))
        
        let todayTotal = extractAmount(from: todayTotalLabel.label)
        
        // Verify cap warning if approaching £500
        if todayTotal >= 450.0 {
            let capWarning = app.staticTexts["cap-warning"]
            XCTAssertTrue(capWarning.exists, "Warning should show when approaching daily cap")
        }
        
        // Verify cannot exceed £500
        XCTAssertLessThanOrEqual(todayTotal, 500.0, "Daily total cannot exceed £500")
        
        print("✅ Daily Cap Enforcement Test Passed!")
        print("   Today's Total: £\(todayTotal)")
    }
    
    // MARK: - Helper Methods
    
    private func loginAsTestDriver() {
        let emailField = app.textFields["email"]
        XCTAssertTrue(emailField.waitForExistence(timeout: 5))
        emailField.tap()
        emailField.typeText("test.driver@speedyvan.co.uk")
        
        let passwordField = app.secureTextFields["password"]
        passwordField.tap()
        passwordField.typeText("TestDriver123!")
        
        let loginButton = app.buttons["Login"]
        loginButton.tap()
        
        // Wait for dashboard
        let dashboardTitle = app.navigationBars["Dashboard"]
        XCTAssertTrue(dashboardTitle.waitForExistence(timeout: 10))
    }
    
    private func extractAmount(from text: String) -> Double {
        // Extract amount from text like "£45.50" or "Earnings: £45.50"
        let pattern = "£([0-9]+\\.?[0-9]*)"
        guard let regex = try? NSRegularExpression(pattern: pattern),
              let match = regex.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)),
              let range = Range(match.range(at: 1), in: text) else {
            return 0.0
        }
        return Double(text[range]) ?? 0.0
    }
    
    private func extractNumber(from text: String) -> Double {
        // Extract number from text like "12.5 miles" or "45 min"
        let pattern = "([0-9]+\\.?[0-9]*)"
        guard let regex = try? NSRegularExpression(pattern: pattern),
              let match = regex.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)),
              let range = Range(match.range(at: 1), in: text) else {
            return 0.0
        }
        return Double(text[range]) ?? 0.0
    }
}

