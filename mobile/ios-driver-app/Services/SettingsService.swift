import Foundation

class SettingsService {
    static let shared = SettingsService()
    private let networkService = NetworkService.shared
    
    private init() {}
    
    // MARK: - Profile
    
    func fetchProfile() async throws -> DriverProfile {
        let response: ProfileResponse = try await networkService.request(
            endpoint: "/api/driver/profile",
            method: "GET"
        )
        
        guard response.success else {
            throw NetworkError.serverError("Failed to fetch profile")
        }
        
        return response.data
    }
    
    func updateProfile(_ profile: DriverProfile) async throws {
        let _: UpdateResponse = try await networkService.request(
            endpoint: "/api/driver/profile",
            method: "PUT",
            body: profile
        )
    }
    
    // MARK: - Notification Preferences
    
    func fetchNotificationPreferences() async throws -> NotificationPreferences {
        let response: NotificationPreferencesResponse = try await networkService.request(
            endpoint: "/api/driver/settings/notification-preferences",
            method: "GET"
        )
        
        guard response.success else {
            throw NetworkError.serverError("Failed to fetch notification preferences")
        }
        
        return response.data
    }
    
    func updateNotificationPreferences(_ preferences: NotificationPreferences) async throws {
        let _: UpdateResponse = try await networkService.request(
            endpoint: "/api/driver/settings/notification-preferences",
            method: "PUT",
            body: preferences
        )
    }
}

