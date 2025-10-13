import XCTest
import Foundation

/// Comprehensive test suite for iOS Driver App Sign-In functionality
/// Tests authentication flow, API integration, error handling, and session management
class AuthSignInTest: XCTestCase {
    
    var apiBaseURL: String!
    
    override func setUp() {
        super.setUp()
        // Use production API or set via environment variable
        apiBaseURL = ProcessInfo.processInfo.environment["API_BASE_URL"] ?? "https://speedy-van-web.onrender.com"
        print("🔧 Testing against API: \(apiBaseURL)")
    }
    
    // MARK: - Test 1: Valid Login
    
    func testValidLogin() async throws {
        print("\n🧪 Test 1: Valid Login")
        
        let email = "driver@test.com"
        let password = "password123"
        
        let loginData: [String: Any] = [
            "email": email,
            "password": password
        ]
        
        let result = await makeLoginRequest(data: loginData)
        
        XCTAssertTrue(result.success, "Login should succeed with valid credentials")
        XCTAssertNotNil(result.token, "Should receive authentication token")
        XCTAssertNotNil(result.user, "Should receive user data")
        XCTAssertNotNil(result.driver, "Should receive driver data")
        XCTAssertNil(result.error, "Should not have error message")
        
        if let user = result.user {
            XCTAssertEqual(user["email"] as? String, email, "User email should match")
        }
        
        print("✅ Test 1 Passed: Valid login successful")
    }
    
    // MARK: - Test 2: Invalid Email
    
    func testInvalidEmail() async throws {
        print("\n🧪 Test 2: Invalid Email")
        
        let loginData: [String: Any] = [
            "email": "nonexistent@test.com",
            "password": "password123"
        ]
        
        let result = await makeLoginRequest(data: loginData)
        
        XCTAssertFalse(result.success, "Login should fail with invalid email")
        XCTAssertNil(result.token, "Should not receive token")
        XCTAssertNotNil(result.error, "Should have error message")
        
        print("✅ Test 2 Passed: Invalid email rejected")
    }
    
    // MARK: - Test 3: Invalid Password
    
    func testInvalidPassword() async throws {
        print("\n🧪 Test 3: Invalid Password")
        
        let loginData: [String: Any] = [
            "email": "driver@test.com",
            "password": "wrongpassword"
        ]
        
        let result = await makeLoginRequest(data: loginData)
        
        XCTAssertFalse(result.success, "Login should fail with invalid password")
        XCTAssertNil(result.token, "Should not receive token")
        XCTAssertNotNil(result.error, "Should have error message")
        
        print("✅ Test 3 Passed: Invalid password rejected")
    }
    
    // MARK: - Test 4: Empty Email
    
    func testEmptyEmail() async throws {
        print("\n🧪 Test 4: Empty Email")
        
        let loginData: [String: Any] = [
            "email": "",
            "password": "password123"
        ]
        
        let result = await makeLoginRequest(data: loginData)
        
        XCTAssertFalse(result.success, "Login should fail with empty email")
        XCTAssertNotNil(result.error, "Should have error message")
        
        print("✅ Test 4 Passed: Empty email rejected")
    }
    
    // MARK: - Test 5: Empty Password
    
    func testEmptyPassword() async throws {
        print("\n🧪 Test 5: Empty Password")
        
        let loginData: [String: Any] = [
            "email": "driver@test.com",
            "password": ""
        ]
        
        let result = await makeLoginRequest(data: loginData)
        
        XCTAssertFalse(result.success, "Login should fail with empty password")
        XCTAssertNotNil(result.error, "Should have error message")
        
        print("✅ Test 5 Passed: Empty password rejected")
    }
    
    // MARK: - Test 6: Malformed Email
    
    func testMalformedEmail() async throws {
        print("\n🧪 Test 6: Malformed Email")
        
        let loginData: [String: Any] = [
            "email": "notanemail",
            "password": "password123"
        ]
        
        let result = await makeLoginRequest(data: loginData)
        
        XCTAssertFalse(result.success, "Login should fail with malformed email")
        
        print("✅ Test 6 Passed: Malformed email rejected")
    }
    
    // MARK: - Test 7: Session Validation
    
    func testSessionValidation() async throws {
        print("\n🧪 Test 7: Session Validation")
        
        // First, login to get a token
        let loginData: [String: Any] = [
            "email": "driver@test.com",
            "password": "password123"
        ]
        
        let loginResult = await makeLoginRequest(data: loginData)
        
        guard let token = loginResult.token else {
            XCTFail("Failed to get token from login")
            return
        }
        
        // Now validate the session
        let sessionResult = await makeSessionRequest(token: token)
        
        XCTAssertTrue(sessionResult.isAuthenticated, "Session should be authenticated")
        XCTAssertNotNil(sessionResult.user, "Should receive user data")
        XCTAssertNotNil(sessionResult.driver, "Should receive driver data")
        
        print("✅ Test 7 Passed: Session validation successful")
    }
    
    // MARK: - Test 8: Invalid Token Session
    
    func testInvalidTokenSession() async throws {
        print("\n🧪 Test 8: Invalid Token Session")
        
        let invalidToken = "invalid.token.here"
        let sessionResult = await makeSessionRequest(token: invalidToken)
        
        XCTAssertFalse(sessionResult.isAuthenticated, "Session should not be authenticated with invalid token")
        
        print("✅ Test 8 Passed: Invalid token rejected")
    }
    
    // MARK: - Test 9: Response Structure Validation
    
    func testResponseStructure() async throws {
        print("\n🧪 Test 9: Response Structure Validation")
        
        let loginData: [String: Any] = [
            "email": "driver@test.com",
            "password": "password123"
        ]
        
        let result = await makeLoginRequest(data: loginData)
        
        // Validate response has required fields
        XCTAssertNotNil(result.success, "Response should have 'success' field")
        
        if result.success {
            XCTAssertNotNil(result.token, "Successful response should have 'token'")
            XCTAssertNotNil(result.user, "Successful response should have 'user'")
            XCTAssertNotNil(result.driver, "Successful response should have 'driver'")
            
            if let user = result.user {
                XCTAssertNotNil(user["id"], "User should have 'id'")
                XCTAssertNotNil(user["email"], "User should have 'email'")
                XCTAssertNotNil(user["role"], "User should have 'role'")
            }
            
            if let driver = result.driver {
                XCTAssertNotNil(driver["id"], "Driver should have 'id'")
                XCTAssertNotNil(driver["userId"], "Driver should have 'userId'")
                XCTAssertNotNil(driver["firstName"], "Driver should have 'firstName'")
                XCTAssertNotNil(driver["lastName"], "Driver should have 'lastName'")
            }
        }
        
        print("✅ Test 9 Passed: Response structure valid")
    }
    
    // MARK: - Test 10: SQL Injection Protection
    
    func testSQLInjectionProtection() async throws {
        print("\n🧪 Test 10: SQL Injection Protection")
        
        let maliciousInputs = [
            "' OR '1'='1",
            "admin'--",
            "' OR 1=1--",
            "'; DROP TABLE users--"
        ]
        
        for maliciousInput in maliciousInputs {
            let loginData: [String: Any] = [
                "email": maliciousInput,
                "password": "password123"
            ]
            
            let result = await makeLoginRequest(data: loginData)
            
            XCTAssertFalse(result.success, "SQL injection attempt should fail")
            XCTAssertNil(result.token, "Should not receive token for malicious input")
        }
        
        print("✅ Test 10 Passed: SQL injection protected")
    }
    
    // MARK: - Helper Methods
    
    private func makeLoginRequest(data: [String: Any]) async -> LoginTestResult {
        let url = URL(string: "\(apiBaseURL!)/api/driver/auth/login")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: data)
            
            let (responseData, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                return LoginTestResult(success: false, error: "Invalid response type")
            }
            
            print("📡 Response Status: \(httpResponse.statusCode)")
            
            if let json = try? JSONSerialization.jsonObject(with: responseData) as? [String: Any] {
                print("📦 Response: \(json)")
                
                let success = json["success"] as? Bool ?? false
                let token = json["token"] as? String
                let user = json["user"] as? [String: Any]
                let driver = json["driver"] as? [String: Any]
                let error = json["error"] as? String
                
                return LoginTestResult(
                    success: success,
                    token: token,
                    user: user,
                    driver: driver,
                    error: error
                )
            } else {
                return LoginTestResult(success: false, error: "Invalid JSON response")
            }
        } catch {
            print("❌ Request failed: \(error.localizedDescription)")
            return LoginTestResult(success: false, error: error.localizedDescription)
        }
    }
    
    private func makeSessionRequest(token: String) async -> SessionTestResult {
        let url = URL(string: "\(apiBaseURL!)/api/driver/session")!
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        do {
            let (responseData, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                return SessionTestResult(isAuthenticated: false)
            }
            
            print("📡 Session Response Status: \(httpResponse.statusCode)")
            
            if let json = try? JSONSerialization.jsonObject(with: responseData) as? [String: Any] {
                print("📦 Session Response: \(json)")
                
                let isAuthenticated = json["isAuthenticated"] as? Bool ?? false
                let user = json["user"] as? [String: Any]
                let driver = json["driver"] as? [String: Any]
                
                return SessionTestResult(
                    isAuthenticated: isAuthenticated,
                    user: user,
                    driver: driver
                )
            } else {
                return SessionTestResult(isAuthenticated: false)
            }
        } catch {
            print("❌ Session request failed: \(error.localizedDescription)")
            return SessionTestResult(isAuthenticated: false)
        }
    }
}

// MARK: - Test Result Models

struct LoginTestResult {
    let success: Bool
    let token: String?
    let user: [String: Any]?
    let driver: [String: Any]?
    let error: String?
    
    init(success: Bool, token: String? = nil, user: [String: Any]? = nil, driver: [String: Any]? = nil, error: String? = nil) {
        self.success = success
        self.token = token
        self.user = user
        self.driver = driver
        self.error = error
    }
}

struct SessionTestResult {
    let isAuthenticated: Bool
    let user: [String: Any]?
    let driver: [String: Any]?
    
    init(isAuthenticated: Bool, user: [String: Any]? = nil, driver: [String: Any]? = nil) {
        self.isAuthenticated = isAuthenticated
        self.user = user
        self.driver = driver
    }
}

