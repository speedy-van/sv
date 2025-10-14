import Foundation

// MARK: - Settings Service (UPDATED)

class SettingsService {
    static let shared = SettingsService()
    private let network = NetworkService.shared
    
    private init() {}
    
    // MARK: - Profile
    
    func fetchProfile() async throws -> DriverProfile {
        struct ProfileResponse: Codable {
            let success: Bool
            let data: DriverProfile
        }
        
        let response: ProfileResponse = try await network.request(.profile)
        return response.data
    }
    
    func updateProfile(_ profile: DriverProfile) async throws {
        struct UpdateResponse: Codable {
            let success: Bool
            let message: String?
        }
        
        let _: UpdateResponse = try await network.request(
            .profile,
            method: .put,
            body: profile
        )
    }
    
    // MARK: - Notification Preferences
    
    func fetchNotificationPreferences() async throws -> NotificationPreferences {
        struct NotificationPreferencesResponse: Codable {
            let success: Bool
            let data: NotificationPreferences
        }
        
        let response: NotificationPreferencesResponse = try await network.request(
            .notificationPreferences
        )
        
        return response.data
    }
    
    func updateNotificationPreferences(_ preferences: NotificationPreferences) async throws {
        struct UpdateResponse: Codable {
            let success: Bool
            let message: String?
        }
        
        let _: UpdateResponse = try await network.request(
            .updateNotificationPreferences,
            method: .put,
            body: preferences
        )
    }
    
    // MARK: - Settings (General)
    
    func fetchSettings() async throws -> DriverSettings {
        struct SettingsResponse: Codable {
            let success: Bool
            let data: DriverSettings
        }
        
        let response: SettingsResponse = try await network.request(.settings)
        return response.data
    }
}

// MARK: - Driver Settings Model

struct DriverSettings: Codable {
    let profile: DriverProfile
    let notificationPreferences: NotificationPreferences
    let securitySettings: SecuritySettings?
}

struct SecuritySettings: Codable {
    let twoFactorEnabled: Bool
    let lastPasswordChange: Date?
}

