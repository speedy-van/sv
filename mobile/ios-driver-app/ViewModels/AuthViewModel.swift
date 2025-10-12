import Foundation
import SwiftUI

@MainActor
class AuthViewModel: ObservableObject {
    @Published var isAuthenticated = false
    @Published var isLoading = true
    @Published var errorMessage: String?
    @Published var currentUser: User?
    @Published var currentDriver: Driver?
    
    private let authService = AuthService.shared
    
    init() {
        checkStoredSession()
    }
    
    // MARK: - Session Check
    
    func checkStoredSession() {
        // Check for stored token
        if authService.hasStoredSession() {
            currentUser = authService.getStoredUser()
            currentDriver = authService.getStoredDriver()
            isAuthenticated = true
        }
        isLoading = false
    }
    
    func checkSession() {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                let response = try await authService.checkSession()
                
                if response.isAuthenticated {
                    currentUser = response.user
                    currentDriver = response.driver
                    isAuthenticated = true
                } else {
                    isAuthenticated = false
                    TokenStorage.clearAll()
                }
            } catch {
                print("❌ Session check failed: \(error.localizedDescription)")
                isAuthenticated = false
                TokenStorage.clearAll()
            }
            
            isLoading = false
        }
    }
    
    // MARK: - Login
    
    func login(email: String, password: String) async {
        isLoading = true
        errorMessage = nil
        
        do {
            let response = try await authService.login(email: email, password: password)
            
            if response.success {
                currentUser = response.user
                currentDriver = response.driver
                isAuthenticated = true
                print("✅ Login successful")
            } else if let error = response.error {
                errorMessage = error
                print("❌ Login failed: \(error)")
            }
        } catch {
            errorMessage = error.localizedDescription
            print("❌ Login error: \(error.localizedDescription)")
        }
        
        isLoading = false
    }
    
    // MARK: - Logout
    
    func logout() async {
        isLoading = true
        
        do {
            try await authService.logout()
            currentUser = nil
            currentDriver = nil
            isAuthenticated = false
            print("✅ Logout successful")
        } catch {
            print("❌ Logout error: \(error.localizedDescription)")
        }
        
        isLoading = false
    }
    
    // MARK: - Profile
    
    func fetchProfile() async {
        do {
            let profile = try await authService.getProfile()
            currentUser = profile.user
            currentDriver = profile.driver
        } catch {
            print("❌ Failed to fetch profile: \(error.localizedDescription)")
        }
    }
}

