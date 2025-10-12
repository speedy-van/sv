import Foundation

// MARK: - Authentication Service

class AuthService {
    static let shared = AuthService()
    private let network = NetworkService.shared
    
    private init() {}
    
    // MARK: - Login
    
    func login(email: String, password: String) async throws -> LoginResponse {
        let request = LoginRequest(email: email, password: password)
        
        let response: LoginResponse = try await network.request(
            .login,
            method: .post,
            body: request,
            requiresAuth: false
        )
        
        // Check for errors
        if let error = response.error {
            throw AuthError.loginFailed(error)
        }
        
        // Save token and user data
        if let token = response.token {
            TokenStorage.saveToken(token)
        }
        
        if let user = response.user {
            TokenStorage.saveUser(user)
        }
        
        if let driver = response.driver {
            TokenStorage.saveDriver(driver)
        }
        
        return response
    }
    
    // MARK: - Logout
    
    func logout() async throws {
        // Clear local storage
        TokenStorage.clearAll()
        
        // Optionally call logout endpoint
        // let _: EmptyResponse = try await network.request(.logout, method: .post)
    }
    
    // MARK: - Session Check
    
    func checkSession() async throws -> SessionResponse {
        let response: SessionResponse = try await network.request(.session)
        
        // Update stored user data
        if let user = response.user {
            TokenStorage.saveUser(user)
        }
        
        if let driver = response.driver {
            TokenStorage.saveDriver(driver)
        }
        
        return response
    }
    
    // MARK: - Get Profile
    
    func getProfile() async throws -> DriverProfileResponse {
        return try await network.request(.profile)
    }
    
    // MARK: - Check Stored Session
    
    func hasStoredSession() -> Bool {
        return TokenStorage.getToken() != nil
    }
    
    func getStoredUser() -> User? {
        return TokenStorage.getUser()
    }
    
    func getStoredDriver() -> Driver? {
        return TokenStorage.getDriver()
    }
}

// MARK: - Auth Error

enum AuthError: LocalizedError {
    case loginFailed(String)
    case sessionExpired
    case notAuthenticated
    case notApproved
    
    var errorDescription: String? {
        switch self {
        case .loginFailed(let message):
            return message
        case .sessionExpired:
            return "Your session has expired. Please login again."
        case .notAuthenticated:
            return "You are not authenticated. Please login."
        case .notApproved:
            return "Your account is not yet approved. Please wait for admin approval."
        }
    }
}

// MARK: - Empty Response

struct EmptyResponse: Codable {}

