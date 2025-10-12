import SwiftUI

extension Color {
    // MARK: - Neon Dark Design Language - Speedy Van
    // Unified with Web Driver Portal
    
    // MARK: - Core Neon Colors
    static let neonBlue = Color(hex: "00C2FF")        // Primary neon blue
    static let neonPurple = Color(hex: "B026FF")      // Neon purple for gradients
    static let neonBlue50 = Color(hex: "E6F7FF")
    static let neonBlue100 = Color(hex: "B3E5FF")
    static let neonBlue200 = Color(hex: "80D4FF")
    static let neonBlue300 = Color(hex: "4DC2FF")
    static let neonBlue400 = Color(hex: "1AB0FF")
    static let neonBlue500 = Color(hex: "00C2FF")     // Primary
    static let neonBlue600 = Color(hex: "0099CC")
    static let neonBlue700 = Color(hex: "007099")
    static let neonBlue800 = Color(hex: "004766")
    static let neonBlue900 = Color(hex: "001E33")
    
    // MARK: - Brand Colors (Speedy Van Green)
    static let brandGreen = Color(hex: "00D18F")      // Primary brand green
    static let brandGreen50 = Color(hex: "E6FFF7")
    static let brandGreen100 = Color(hex: "B3FFE5")
    static let brandGreen200 = Color(hex: "80FFD4")
    static let brandGreen300 = Color(hex: "4DFFC2")
    static let brandGreen400 = Color(hex: "1AFFB0")
    static let brandGreen500 = Color(hex: "00D18F")
    static let brandGreen600 = Color(hex: "00B385")
    static let brandGreen700 = Color(hex: "009973")
    static let brandGreen800 = Color(hex: "007F61")
    static let brandGreen900 = Color(hex: "00654F")
    
    // MARK: - Dark Surface Colors
    static let darkBg = Color(hex: "0D0D0D")          // Primary dark background
    static let darkSurface = Color(hex: "1A1A1A")     // Surface color
    static let darkElevated = Color(hex: "262626")    // Elevated surface
    static let darkHover = Color(hex: "333333")       // Hover state
    static let darkBorder = Color(hex: "404040")      // Border color
    
    // MARK: - Semantic Colors (Unified)
    static let successColor = Color(hex: "22C55E")
    static let warningColor = Color(hex: "F59E0B")
    static let errorColor = Color(hex: "EF4444")
    static let infoColor = Color(hex: "3B82F6")
    
    // MARK: - Text Colors
    static let textPrimary = Color(hex: "FFFFFF")
    static let textSecondary = Color(hex: "E5E5E5")
    static let textTertiary = Color(hex: "A3A3A3")
    static let textDisabled = Color(hex: "737373")
    
    // MARK: - Legacy Aliases (for backward compatibility)
    static let brandPrimary = neonBlue
    static let brandSecondary = brandGreen
    static let brandAccent = brandGreen
    static let brandWarning = warningColor
    static let brandDanger = errorColor
    
    // MARK: - Semantic Aliases
    static let success = successColor
    static let error = errorColor
    static let warning = warningColor
    static let info = infoColor
    
    // MARK: - Background Aliases (Dark Mode)
    static let backgroundPrimary = darkBg
    static let backgroundSecondary = darkSurface
    static let backgroundTertiary = darkElevated
    
    // MARK: - Gradient Helpers
    static var neonGradient: LinearGradient {
        LinearGradient(
            gradient: Gradient(colors: [neonBlue, neonPurple]),
            startPoint: .leading,
            endPoint: .trailing
        )
    }
    
    static var brandGradient: LinearGradient {
        LinearGradient(
            gradient: Gradient(colors: [brandGreen, neonBlue]),
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
    
    static var darkGradient: LinearGradient {
        LinearGradient(
            gradient: Gradient(colors: [darkBg, darkSurface, darkBg]),
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
    
    // MARK: - Hex Initializer
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

// MARK: - Shadow Extensions
extension View {
    func neonGlow(color: Color = .neonBlue, radius: CGFloat = 20) -> some View {
        self.shadow(color: color.opacity(0.3), radius: radius, x: 0, y: 0)
    }
    
    func brandGlow(radius: CGFloat = 20) -> some View {
        self.shadow(color: Color.brandGreen.opacity(0.3), radius: radius, x: 0, y: 0)
    }
    
    func darkShadow(radius: CGFloat = 8) -> some View {
        self.shadow(color: Color.black.opacity(0.5), radius: radius, x: 0, y: 4)
    }
}

