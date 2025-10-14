import SwiftUI

// MARK: - Brand Colors Extension

extension Color {
    // MARK: - Primary Brand Colors
    
    /// Vibrant Orange - Primary brand color
    static let brandPrimary = Color(hex: "#FF6B35")
    
    /// Deep Blue - Secondary brand color
    static let brandSecondary = Color(hex: "#004E89")
    
    /// Gold - Accent color for premium touches
    static let brandAccent = Color(hex: "#FFD23F")
    
    // MARK: - Neutral Colors
    
    /// Primary text color - Dark gray
    static let textPrimary = Color(hex: "#1A1A1A")
    
    /// Secondary text color - Medium gray
    static let textSecondary = Color(hex: "#6B6B6B")
    
    /// Tertiary text color - Light gray
    static let textTertiary = Color(hex: "#9B9B9B")
    
    // MARK: - Background Colors
    
    /// Primary background - Pure white
    static let bgPrimary = Color(hex: "#FFFFFF")
    
    /// Secondary background - Light gray
    static let bgSecondary = Color(hex: "#F8F9FA")
    
    /// Tertiary background - Lighter gray
    static let bgTertiary = Color(hex: "#E9ECEF")
    
    // MARK: - Status Colors
    
    /// Success state - Green
    static let statusSuccess = Color(hex: "#10B981")
    
    /// Warning state - Amber
    static let statusWarning = Color(hex: "#F59E0B")
    
    /// Error state - Red
    static let statusError = Color(hex: "#EF4444")
    
    /// Info state - Blue
    static let statusInfo = Color(hex: "#3B82F6")
    
    // MARK: - Job Status Colors
    
    /// Pending job status - Amber
    static let statusPending = Color(hex: "#F59E0B")
    
    /// Active job status - Green
    static let statusActive = Color(hex: "#10B981")
    
    /// Completed job status - Indigo
    static let statusCompleted = Color(hex: "#6366F1")
    
    /// Cancelled job status - Red
    static let statusCancelled = Color(hex: "#EF4444")
    
    // MARK: - Helper Initializer
    
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// MARK: - Gradient Presets

extension LinearGradient {
    /// Primary brand gradient (Orange to lighter orange)
    static let brandPrimary = LinearGradient(
        colors: [Color.brandPrimary, Color.brandPrimary.opacity(0.8)],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    
    /// Success gradient (Green shades)
    static let success = LinearGradient(
        colors: [Color.statusSuccess, Color.statusSuccess.opacity(0.8)],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    
    /// Premium gold gradient
    static let premium = LinearGradient(
        colors: [Color.brandAccent, Color.brandAccent.opacity(0.7)],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}

