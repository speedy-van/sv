import Foundation

struct AppConfig {
    // MARK: - API Configuration
    
    /// Base URL for API requests
    /// Production: https://api.speedy-van.co.uk
    /// Development: http://localhost:3000
    #if DEBUG
    static let apiBaseURL = "http://localhost:3000"
    #else
    static let apiBaseURL = "https://api.speedy-van.co.uk"
    #endif
    
    /// API timeout in seconds
    static let requestTimeout: TimeInterval = 30.0
    
    // MARK: - App Information
    
    static let appName = "Speedy Van Driver"
    static let appVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
    static let appBuild = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1"
    
    // MARK: - Company Information
    
    static let companyName = "Speedy Van"
    static let supportEmail = "support@speedy-van.co.uk"
    static let supportPhone = "07901846297"
    static let companyAddress = "Office 2.18 1 Barrack St, Hamilton ML3 0HS, Scotland"
    
    // MARK: - Location Tracking
    
    /// How often to send location updates (in seconds)
    static let locationUpdateInterval: TimeInterval = 30.0
    
    /// Minimum distance change to trigger update (in meters)
    static let minimumDistanceFilter: Double = 50.0
    
    /// Background location tracking enabled
    static let backgroundLocationEnabled = true
    
    // MARK: - Feature Flags
    
    static let enablePushNotifications = true
    static let enableBackgroundTracking = true
    static let enableAnalytics = false // Disable analytics for privacy
    
    // MARK: - Debug
    
    #if DEBUG
    static let isDebug = true
    static let enableLogging = true
    #else
    static let isDebug = false
    static let enableLogging = false
    #endif
}

// MARK: - API Endpoints

extension AppConfig {
    enum Endpoint {
        // Authentication
        case login
        case logout
        case session
        
        // Driver
        case profile
        case availability
        case updateAvailability
        
        // Jobs
        case jobs
        case jobDetail(String)
        case acceptJob(String)
        case declineJob(String)
        case updateJobProgress(String)
        
        // Tracking
        case sendLocation
        case trackingHistory
        
        // Notifications
        case registerDevice
        
        var path: String {
            switch self {
            // Auth
            case .login: return "/api/driver/auth/login"
            case .logout: return "/api/driver/auth/logout"
            case .session: return "/api/driver/session"
            
            // Driver
            case .profile: return "/api/driver/profile"
            case .availability: return "/api/driver/availability"
            case .updateAvailability: return "/api/driver/availability"
            
            // Jobs
            case .jobs: return "/api/driver/jobs"
            case .jobDetail(let id): return "/api/driver/jobs/\(id)"
            case .acceptJob(let id): return "/api/driver/jobs/\(id)/accept"
            case .declineJob(let id): return "/api/driver/jobs/\(id)/decline"
            case .updateJobProgress(let id): return "/api/driver/jobs/\(id)/progress"
            
            // Tracking
            case .sendLocation: return "/api/driver/tracking"
            case .trackingHistory: return "/api/driver/tracking"
            
            // Notifications
            case .registerDevice: return "/api/driver/notifications/register"
            }
        }
        
        var url: URL {
            URL(string: AppConfig.apiBaseURL + path)!
        }
    }
}

