import Foundation

// MARK: - User Model

struct User: Codable, Identifiable {
    let id: String
    let email: String
    let name: String?
    let role: UserRole
    let createdAt: Date?
    let lastLogin: Date?
    
    enum CodingKeys: String, CodingKey {
        case id, email, name, role, createdAt, lastLogin
    }
}

enum UserRole: String, Codable {
    case driver = "driver"
    case customer = "customer"
    case admin = "admin"
}

// MARK: - Driver Model

struct Driver: Codable, Identifiable {
    let id: String
    let userId: String
    let status: DriverStatus
    let onboardingStatus: OnboardingStatus
    let basePostcode: String?
    let vehicleType: String?
    let rating: Double?
    let strikes: Int
    let availability: DriverAvailability?
    
    enum CodingKeys: String, CodingKey {
        case id, userId, status, onboardingStatus, basePostcode, vehicleType, rating, strikes, availability
    }
}

enum DriverStatus: String, Codable {
    case active = "active"
    case inactive = "inactive"
    case suspended = "suspended"
}

enum OnboardingStatus: String, Codable {
    case applied = "applied"
    case docsPending = "docs_pending"
    case underReview = "under_review"
    case approved = "approved"
    case rejected = "rejected"
}

// MARK: - Driver Profile Response

struct DriverProfileResponse: Codable {
    let user: User?
    let driver: Driver?
    let availability: DriverAvailability?
    let stats: DriverStats?
}

struct DriverStats: Codable {
    let totalJobs: Int
    let completedJobs: Int
    let totalEarnings: Double
    let averageRating: Double
    let onTimeRate: Double
    
    enum CodingKeys: String, CodingKey {
        case totalJobs, completedJobs, totalEarnings, averageRating, onTimeRate
    }
}

// MARK: - Auth Models

struct LoginRequest: Codable {
    let email: String
    let password: String
}

struct LoginResponse: Codable {
    let success: Bool
    let user: User?
    let driver: Driver?
    let token: String?
    let message: String?
    let error: String?
    let onboardingStatus: String?
}

struct SessionResponse: Codable {
    let isAuthenticated: Bool
    let user: User?
    let driver: Driver?
}

// MARK: - Token Storage

class TokenStorage {
    private static let tokenKey = "auth_token"
    private static let userKey = "current_user"
    private static let driverKey = "current_driver"
    
    static func saveToken(_ token: String) {
        UserDefaults.standard.set(token, forKey: tokenKey)
    }
    
    static func getToken() -> String? {
        return UserDefaults.standard.string(forKey: tokenKey)
    }
    
    static func removeToken() {
        UserDefaults.standard.removeObject(forKey: tokenKey)
    }
    
    static func saveUser(_ user: User) {
        if let encoded = try? JSONEncoder().encode(user) {
            UserDefaults.standard.set(encoded, forKey: userKey)
        }
    }
    
    static func getUser() -> User? {
        guard let data = UserDefaults.standard.data(forKey: userKey) else { return nil }
        return try? JSONDecoder().decode(User.self, from: data)
    }
    
    static func removeUser() {
        UserDefaults.standard.removeObject(forKey: userKey)
    }
    
    static func saveDriver(_ driver: Driver) {
        if let encoded = try? JSONEncoder().encode(driver) {
            UserDefaults.standard.set(encoded, forKey: driverKey)
        }
    }
    
    static func getDriver() -> Driver? {
        guard let data = UserDefaults.standard.data(forKey: driverKey) else { return nil }
        return try? JSONDecoder().decode(Driver.self, from: data)
    }
    
    static func removeDriver() {
        UserDefaults.standard.removeObject(forKey: driverKey)
    }
    
    static func clearAll() {
        removeToken()
        removeUser()
        removeDriver()
    }
}

