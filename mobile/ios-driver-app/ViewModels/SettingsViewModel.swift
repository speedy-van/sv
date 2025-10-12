import Foundation
import SwiftUI

@MainActor
class SettingsViewModel: ObservableObject {
    @Published var profile: DriverProfile?
    @Published var notificationPreferences: NotificationPreferences?
    @Published var isLoading = false
    @Published var isSaving = false
    @Published var errorMessage: String?
    @Published var successMessage: String?
    
    private let settingsService = SettingsService.shared
    
    // MARK: - Fetch Data
    
    func fetchData() async {
        isLoading = true
        errorMessage = nil
        
        do {
            async let profileData = settingsService.fetchProfile()
            async let prefsData = settingsService.fetchNotificationPreferences()
            
            profile = try await profileData
            notificationPreferences = try await prefsData
            
        } catch {
            errorMessage = error.localizedDescription
            print("❌ Error fetching settings: \(error)")
        }
        
        isLoading = false
    }
    
    // MARK: - Update Profile
    
    func updateProfile() async -> Bool {
        guard let profile = profile else { return false }
        
        isSaving = true
        errorMessage = nil
        successMessage = nil
        
        do {
            try await settingsService.updateProfile(profile)
            successMessage = "Profile updated successfully"
            isSaving = false
            return true
        } catch {
            errorMessage = "Failed to update profile: \(error.localizedDescription)"
            print("❌ Error updating profile: \(error)")
            isSaving = false
            return false
        }
    }
    
    // MARK: - Update Notification Preferences
    
    func updateNotificationPreferences() async -> Bool {
        guard let preferences = notificationPreferences else { return false }
        
        isSaving = true
        errorMessage = nil
        successMessage = nil
        
        do {
            try await settingsService.updateNotificationPreferences(preferences)
            successMessage = "Preferences updated successfully"
            isSaving = false
            return true
        } catch {
            errorMessage = "Failed to update preferences: \(error.localizedDescription)"
            print("❌ Error updating preferences: \(error)")
            isSaving = false
            return false
        }
    }
}

