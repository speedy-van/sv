/**
 * E2E Test: Multiple Drops Route Flow
 * 
 * Tests the complete flow of accepting and completing a multi-drop route
 * Verifies earnings calculation for routes with multiple stops
 */

import XCTest
@testable import SpeedyVanDriver

final class MultiDropRouteE2ETest: XCTestCase {
    
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
    
    // MARK: - Test Multi-Drop Route Flow
    
    func testMultiDropRouteCompleteFlow() throws {
        // 1. Login
        loginAsTestDriver()
        
        // 2. Navigate to Routes
        let routesTab = app.tabBars.buttons["Routes"]
        XCTAssertTrue(routesTab.waitForExistence(timeout: 5))
        routesTab.tap()
        
        // 3. Wait for routes to load
        let firstRouteCard = app.scrollViews.otherElements.containing(.staticText, identifier: "route-card").element
        XCTAssertTrue(firstRouteCard.waitForExistence(timeout: 10))
        
        // 4. Verify route info
        let dropsCountLabel = firstRouteCard.staticTexts.matching(identifier: "drops-count").element
        XCTAssertTrue(dropsCountLabel.exists)
        
        let dropsText = dropsCountLabel.label
        let dropsCount = extractNumber(from: dropsText) // e.g., "5 stops" → 5
        XCTAssertGreaterThan(dropsCount, 1, "Multi-drop route must have > 1 stop")
        
        // 5. Verify earnings (should include per-drop bonus)
        let earningsLabel = firstRouteCard.staticTexts.matching(identifier: "estimated-earnings").element
        XCTAssertTrue(earningsLabel.exists)
        
        let earningsText = earningsLabel.label
        XCTAssertFalse(earningsText.contains("%"), "Earnings should NOT show percentage")
        
        let routeEarnings = extractAmount(from: earningsText)
        XCTAssertGreaterThan(routeEarnings, 0, "Route earnings must be positive")
        
        // 6. Calculate expected minimum earnings
        // Formula: Base Fare + (Distance × £0.55) + (Duration × £0.15) + (Drops × £12)
        let expectedMinimum = 25.0 + (dropsCount * 12.0) // Base + per-drop bonus
        XCTAssertGreaterThanOrEqual(routeEarnings, expectedMinimum, 
                                   "Route earnings should include per-drop bonus (£12 × \(Int(dropsCount)))")
        
        // 7. Tap to view route details
        firstRouteCard.tap()
        
        // 8. Verify Route Detail Screen
        let routeDetailTitle = app.navigationBars["Route Details"]
        XCTAssertTrue(routeDetailTitle.waitForExistence(timeout: 5))
        
        // 9. Verify all drops are listed
        let dropsTable = app.tables["drops-list"]
        XCTAssertTrue(dropsTable.exists)
        
        let dropCells = dropsTable.cells
        XCTAssertEqual(dropCells.count, Int(dropsCount), "All drops should be listed")
        
        // 10. Verify earnings breakdown
        let baseFareLabel = app.staticTexts["Base Fare"]
        let mileageFeeLabel = app.staticTexts["Mileage Fee"]
        let timeFeeLabel = app.staticTexts["Time Fee"]
        let dropBonusLabel = app.staticTexts["Multi-Drop Bonus"]
        
        XCTAssertTrue(baseFareLabel.exists, "Base fare should be shown")
        XCTAssertTrue(mileageFeeLabel.exists, "Mileage fee should be shown")
        XCTAssertTrue(timeFeeLabel.exists, "Time fee should be shown")
        XCTAssertTrue(dropBonusLabel.exists, "Multi-drop bonus should be shown")
        
        // 11. Verify drop bonus amount
        let dropBonusAmount = extractAmount(from: app.staticTexts["drop-bonus-amount"].label)
        let expectedDropBonus = (dropsCount - 1) * 12.0 // £12 per additional drop
        XCTAssertEqual(dropBonusAmount, expectedDropBonus, accuracy: 0.01, 
                      "Drop bonus should be £12 × \(Int(dropsCount - 1)) = £\(expectedDropBonus)")
        
        // 12. Accept the route
        let acceptButton = app.buttons["Accept Route"]
        XCTAssertTrue(acceptButton.exists)
        acceptButton.tap()
        
        // 13. Confirm acceptance
        let confirmButton = app.alerts.buttons["Confirm"]
        if confirmButton.waitForExistence(timeout: 2) {
            confirmButton.tap()
        }
        
        // 14. Verify navigation to Active Routes
        let activeRoutesTab = app.tabBars.buttons["Active"]
        XCTAssertTrue(activeRoutesTab.waitForExistence(timeout: 5))
        activeRoutesTab.tap()
        
        // 15. Start the route
        let activeRouteCard = app.scrollViews.otherElements.containing(.staticText, identifier: "active-route-card").element
        XCTAssertTrue(activeRouteCard.waitForExistence(timeout: 5))
        activeRouteCard.tap()
        
        let startButton = app.buttons["Start Route"]
        XCTAssertTrue(startButton.exists)
        startButton.tap()
        
        // 16. Verify live tracking with multiple markers
        let mapView = app.otherElements["map-view"]
        XCTAssertTrue(mapView.waitForExistence(timeout: 5))
        
        let currentLocationMarker = app.otherElements["current-location-marker"]
        XCTAssertTrue(currentLocationMarker.exists, "Current location should be shown")
        
        // Verify all drop markers are shown
        for i in 1...Int(dropsCount) {
            let dropMarker = app.otherElements["drop-marker-\(i)"]
            XCTAssertTrue(dropMarker.exists, "Drop \(i) marker should be shown on map")
        }
        
        // 17. Complete each drop
        for dropIndex in 1...Int(dropsCount) {
            // Arrive at drop
            let arriveButton = app.buttons["Arrive at Drop \(dropIndex)"]
            XCTAssertTrue(arriveButton.waitForExistence(timeout: 10), 
                         "Arrive button for drop \(dropIndex) should appear")
            arriveButton.tap()
            
            // Complete drop
            let completeDropButton = app.buttons["Complete Drop \(dropIndex)"]
            XCTAssertTrue(completeDropButton.waitForExistence(timeout: 5))
            completeDropButton.tap()
            
            // Take photo (for each drop)
            let photoButton = app.buttons["Take Photo"]
            if photoButton.exists {
                photoButton.tap()
                
                let usePhotoButton = app.buttons["Use Photo"]
                if usePhotoButton.waitForExistence(timeout: 3) {
                    usePhotoButton.tap()
                }
            }
            
            // Confirm completion
            let confirmDropButton = app.buttons["Confirm"]
            if confirmDropButton.exists {
                confirmDropButton.tap()
            }
            
            // Verify drop is marked as completed
            let completedBadge = app.otherElements["drop-\(dropIndex)-completed"]
            XCTAssertTrue(completedBadge.waitForExistence(timeout: 3), 
                         "Drop \(dropIndex) should be marked as completed")
        }
        
        // 18. Complete entire route
        let completeRouteButton = app.buttons["Complete Route"]
        XCTAssertTrue(completeRouteButton.waitForExistence(timeout: 5))
        completeRouteButton.tap()
        
        // 19. Get final signature
        let signatureButton = app.buttons["Get Signature"]
        if signatureButton.exists {
            signatureButton.tap()
            
            let signatureCanvas = app.otherElements["signature-canvas"]
            signatureCanvas.swipeRight()
            
            let doneSignatureButton = app.buttons["Done"]
            doneSignatureButton.tap()
        }
        
        // 20. Submit completion
        let submitButton = app.buttons["Submit"]
        XCTAssertTrue(submitButton.exists)
        submitButton.tap()
        
        // 21. Verify earnings summary
        let earningSummaryTitle = app.staticTexts["Earnings Summary"]
        XCTAssertTrue(earningSummaryTitle.waitForExistence(timeout: 10))
        
        // 22. Verify final earnings
        let finalEarningsLabel = app.staticTexts.matching(identifier: "final-earnings").element
        XCTAssertTrue(finalEarningsLabel.exists)
        
        let finalEarningsText = finalEarningsLabel.label
        let finalAmount = extractAmount(from: finalEarningsText)
        
        // 23. Verify earnings are reasonable for multi-drop
        let minimumMultiDropEarnings = 50.0 // Base + multiple drops should be > £50
        XCTAssertGreaterThan(finalAmount, minimumMultiDropEarnings, 
                            "Multi-drop route earnings should be > £\(minimumMultiDropEarnings)")
        XCTAssertLessThan(finalAmount, 500.0, "Daily cap is £500")
        
        // 24. Verify breakdown includes multi-drop bonus
        let finalDropBonus = extractAmount(from: app.staticTexts["final-drop-bonus"].label)
        XCTAssertEqual(finalDropBonus, expectedDropBonus, accuracy: 0.01, 
                      "Final drop bonus should match expected")
        
        // 25. Verify no platform fee
        let platformFeeLabel = app.staticTexts["Platform Fee"]
        XCTAssertFalse(platformFeeLabel.exists, "Platform fee should NOT be shown")
        
        // 26. Done
        let doneButton = app.buttons["Done"]
        doneButton.tap()
        
        print("✅ Multi-Drop Route E2E Test Passed!")
        print("   Drops: \(Int(dropsCount))")
        print("   Final Earnings: £\(finalAmount)")
        print("   Drop Bonus: £\(finalDropBonus)")
    }
    
    // MARK: - Test Route Earnings Calculation
    
    func testRouteEarningsCalculation() throws {
        loginAsTestDriver()
        
        // Navigate to Routes
        let routesTab = app.tabBars.buttons["Routes"]
        routesTab.tap()
        
        // Find test route with known parameters
        let testRouteCard = app.scrollViews.otherElements.containing(.staticText, identifier: "test-route-card").element
        XCTAssertTrue(testRouteCard.waitForExistence(timeout: 10))
        
        // Extract route details
        let dropsCount = extractNumber(from: app.staticTexts["drops-count"].label)
        let distance = extractNumber(from: app.staticTexts["distance"].label)
        let duration = extractNumber(from: app.staticTexts["duration"].label)
        let displayedEarnings = extractAmount(from: app.staticTexts["estimated-earnings"].label)
        
        // Calculate expected earnings
        let baseFare = 25.0
        let perMileFee = 0.55
        let perMinuteFee = 0.15
        let perDropBonus = 12.0
        
        let expectedEarnings = baseFare 
            + (distance * perMileFee) 
            + (duration * perMinuteFee)
            + ((dropsCount - 1) * perDropBonus) // First drop included in base, bonus for additional
        
        // Verify accuracy
        let tolerance = expectedEarnings * 0.01
        XCTAssertEqual(displayedEarnings, expectedEarnings, accuracy: tolerance, 
                      "Route earnings should match calculated earnings")
        
        print("✅ Route Earnings Calculation Test Passed!")
        print("   Drops: \(Int(dropsCount))")
        print("   Distance: \(distance) miles")
        print("   Duration: \(duration) minutes")
        print("   Expected: £\(expectedEarnings)")
        print("   Displayed: £\(displayedEarnings)")
    }
    
    // MARK: - Test Route Progress Tracking
    
    func testRouteProgressTracking() throws {
        loginAsTestDriver()
        
        // Start a route (use helper method)
        startTestRoute()
        
        // Verify progress bar
        let progressBar = app.progressIndicators["route-progress"]
        XCTAssertTrue(progressBar.exists)
        
        // Initial progress should be 0%
        let initialProgress = progressBar.value as? String ?? "0%"
        XCTAssertTrue(initialProgress.contains("0"), "Initial progress should be 0%")
        
        // Complete first drop
        completeNextDrop()
        
        // Progress should increase
        let progressAfterFirstDrop = progressBar.value as? String ?? "0%"
        let progressValue = extractNumber(from: progressAfterFirstDrop)
        XCTAssertGreaterThan(progressValue, 0, "Progress should increase after completing a drop")
        
        print("✅ Route Progress Tracking Test Passed!")
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
        
        let dashboardTitle = app.navigationBars["Dashboard"]
        XCTAssertTrue(dashboardTitle.waitForExistence(timeout: 10))
    }
    
    private func startTestRoute() {
        let routesTab = app.tabBars.buttons["Routes"]
        routesTab.tap()
        
        let testRouteCard = app.scrollViews.otherElements.containing(.staticText, identifier: "test-route-card").element
        testRouteCard.tap()
        
        let acceptButton = app.buttons["Accept Route"]
        acceptButton.tap()
        
        if app.alerts.buttons["Confirm"].exists {
            app.alerts.buttons["Confirm"].tap()
        }
        
        let activeRoutesTab = app.tabBars.buttons["Active"]
        activeRoutesTab.tap()
        
        let activeRouteCard = app.scrollViews.otherElements.first
        activeRouteCard.tap()
        
        let startButton = app.buttons["Start Route"]
        startButton.tap()
    }
    
    private func completeNextDrop() {
        let arriveButton = app.buttons.matching(NSPredicate(format: "label BEGINSWITH 'Arrive at Drop'")).element
        arriveButton.tap()
        
        let completeButton = app.buttons.matching(NSPredicate(format: "label BEGINSWITH 'Complete Drop'")).element
        completeButton.tap()
        
        if app.buttons["Take Photo"].exists {
            app.buttons["Take Photo"].tap()
            if app.buttons["Use Photo"].waitForExistence(timeout: 2) {
                app.buttons["Use Photo"].tap()
            }
        }
        
        if app.buttons["Confirm"].exists {
            app.buttons["Confirm"].tap()
        }
    }
    
    private func extractAmount(from text: String) -> Double {
        let pattern = "£([0-9]+\\.?[0-9]*)"
        guard let regex = try? NSRegularExpression(pattern: pattern),
              let match = regex.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)),
              let range = Range(match.range(at: 1), in: text) else {
            return 0.0
        }
        return Double(text[range]) ?? 0.0
    }
    
    private func extractNumber(from text: String) -> Double {
        let pattern = "([0-9]+\\.?[0-9]*)"
        guard let regex = try? NSRegularExpression(pattern: pattern),
              let match = regex.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)),
              let range = Range(match.range(at: 1), in: text) else {
            return 0.0
        }
        return Double(text[range]) ?? 0.0
    }
}

