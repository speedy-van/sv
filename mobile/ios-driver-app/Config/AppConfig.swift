import Foundation

struct AppConfig {
    // MARK: - API Configuration
    
    /// Base URL for API requests
    /// Production: https://speedy-van.co.uk
    /// Development: Use ngrok tunnel or local IP address
    /// IMPORTANT: For production builds, ALWAYS use HTTPS URL
    #if DEBUG
    // For development: Use your computer's IP or ngrok tunnel
    // Example: "http://192.168.1.100:3000" or "https://your-tunnel.ngrok.io"
    // NEVER use localhost in iOS builds - it won't work!
    static let apiBaseURL = "https://speedy-van.co.uk" // Changed to production URL for all builds
    #else
    static let apiBaseURL = "https://speedy-van.co.uk"
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
        case activeJobs
        case availableJobs
        case jobDetail(String)
        case acceptJob(String)
        case declineJob(String)
        case startJob(String)
        case completeJob(String)
        case updateJobProgress(String)
        
        // Routes (Multi-Drop)
        case routes
        case routeDetail(String)
        case acceptRoute(String)
        case declineRoute(String)
        case completeRouteDrop(String)
        
        // Schedule
        case schedule
        case scheduleJobs
        case scheduleStats
        case scheduleExport
        
        // Earnings
        case earnings
        case payouts
        case tips
        
        // Dashboard
        case dashboard
        
        // Settings
        case settings
        case notificationPreferences
        case updateNotificationPreferences
        
        // Tracking
        case sendLocation
        case trackingHistory
        
        // Notifications
        case registerDevice
        case notifications
        case markNotificationRead
        
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
            case .activeJobs: return "/api/driver/jobs/active"
            case .availableJobs: return "/api/driver/jobs/available"
            case .jobDetail(let id): return "/api/driver/jobs/\(id)"
            case .acceptJob(let id): return "/api/driver/jobs/\(id)/accept"
            case .declineJob(let id): return "/api/driver/jobs/\(id)/decline"
            case .startJob(let id): return "/api/driver/jobs/\(id)/start"
            case .completeJob(let id): return "/api/driver/jobs/\(id)/complete"
            case .updateJobProgress(let id): return "/api/driver/jobs/\(id)/progress"
            
            // Routes
            case .routes: return "/api/driver/routes"
            case .routeDetail(let id): return "/api/driver/routes/\(id)"
            case .acceptRoute(let id): return "/api/driver/routes/\(id)/accept"
            case .declineRoute(let id): return "/api/driver/routes/\(id)/decline"
            case .completeRouteDrop(let id): return "/api/driver/routes/\(id)/complete-drop"
            
            // Schedule
            case .schedule: return "/api/driver/schedule"
            case .scheduleJobs: return "/api/driver/schedule/jobs"
            case .scheduleStats: return "/api/driver/schedule/stats"
            case .scheduleExport: return "/api/driver/schedule/export"
            
            // Earnings
            case .earnings: return "/api/driver/earnings"
            case .payouts: return "/api/driver/payouts"
            case .tips: return "/api/driver/tips"
            
            // Dashboard
            case .dashboard: return "/api/driver/dashboard"
            
            // Settings
            case .settings: return "/api/driver/settings"
            case .notificationPreferences: return "/api/driver/settings/notification-preferences"
            case .updateNotificationPreferences: return "/api/driver/settings/notification-preferences"
            
            // Tracking
            case .sendLocation: return "/api/driver/tracking"
            case .trackingHistory: return "/api/driver/tracking"
            
            // Notifications
            case .registerDevice: return "/api/driver/notifications/register"
            case .notifications: return "/api/driver/notifications"
            case .markNotificationRead: return "/api/driver/notifications/read"
            }
        }
        
        var url: URL {
            URL(string: AppConfig.apiBaseURL + path)!
        }
    }
}

