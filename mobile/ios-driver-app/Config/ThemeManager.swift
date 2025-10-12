import SwiftUI

/// Theme Manager - Unified Design System
/// Matches Web Driver Portal design language
struct ThemeManager {
    
    // MARK: - Spacing
    struct Spacing {
        static let xs: CGFloat = 4
        static let sm: CGFloat = 8
        static let md: CGFloat = 16
        static let lg: CGFloat = 24
        static let xl: CGFloat = 32
        static let xxl: CGFloat = 48
    }
    
    // MARK: - Corner Radius
    struct CornerRadius {
        static let sm: CGFloat = 8
        static let md: CGFloat = 12
        static let lg: CGFloat = 16
        static let xl: CGFloat = 24
        static let full: CGFloat = 999
    }
    
    // MARK: - Typography
    struct Typography {
        // Display
        static let displayLarge = Font.system(size: 57, weight: .bold)
        static let displayMedium = Font.system(size: 45, weight: .bold)
        static let displaySmall = Font.system(size: 36, weight: .bold)
        
        // Headline
        static let headlineLarge = Font.system(size: 32, weight: .semibold)
        static let headlineMedium = Font.system(size: 28, weight: .semibold)
        static let headlineSmall = Font.system(size: 24, weight: .semibold)
        
        // Title
        static let titleLarge = Font.system(size: 22, weight: .medium)
        static let titleMedium = Font.system(size: 16, weight: .medium)
        static let titleSmall = Font.system(size: 14, weight: .medium)
        
        // Body
        static let bodyLarge = Font.system(size: 16, weight: .regular)
        static let bodyMedium = Font.system(size: 14, weight: .regular)
        static let bodySmall = Font.system(size: 12, weight: .regular)
        
        // Label
        static let labelLarge = Font.system(size: 14, weight: .medium)
        static let labelMedium = Font.system(size: 12, weight: .medium)
        static let labelSmall = Font.system(size: 11, weight: .medium)
    }
    
    // MARK: - Button Styles
    struct ButtonStyle {
        static let height: CGFloat = 56
        static let cornerRadius: CGFloat = CornerRadius.full
        static let fontSize: CGFloat = 16
    }
    
    // MARK: - Card Styles
    struct CardStyle {
        static let cornerRadius: CGFloat = CornerRadius.lg
        static let padding: CGFloat = Spacing.md
        static let shadowRadius: CGFloat = 8
    }
    
    // MARK: - Animation
    struct Animation {
        static let fast = SwiftUI.Animation.easeInOut(duration: 0.2)
        static let medium = SwiftUI.Animation.easeInOut(duration: 0.3)
        static let slow = SwiftUI.Animation.easeInOut(duration: 0.5)
        static let spring = SwiftUI.Animation.spring(response: 0.3, dampingFraction: 0.7)
    }
}

// MARK: - Custom Button Styles

struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(ThemeManager.Typography.labelLarge)
            .fontWeight(.semibold)
            .foregroundColor(.darkBg)
            .frame(maxWidth: .infinity)
            .frame(height: ThemeManager.ButtonStyle.height)
            .background(Color.neonBlue)
            .cornerRadius(ThemeManager.ButtonStyle.cornerRadius)
            .neonGlow()
            .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
            .animation(ThemeManager.Animation.fast, value: configuration.isPressed)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(ThemeManager.Typography.labelLarge)
            .fontWeight(.semibold)
            .foregroundColor(.neonBlue)
            .frame(maxWidth: .infinity)
            .frame(height: ThemeManager.ButtonStyle.height)
            .background(Color.clear)
            .overlay(
                RoundedRectangle(cornerRadius: ThemeManager.ButtonStyle.cornerRadius)
                    .stroke(Color.neonBlue, lineWidth: 2)
            )
            .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
            .animation(ThemeManager.Animation.fast, value: configuration.isPressed)
    }
}

struct DestructiveButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(ThemeManager.Typography.labelLarge)
            .fontWeight(.semibold)
            .foregroundColor(.errorColor)
            .frame(maxWidth: .infinity)
            .frame(height: ThemeManager.ButtonStyle.height)
            .background(Color.clear)
            .overlay(
                RoundedRectangle(cornerRadius: ThemeManager.ButtonStyle.cornerRadius)
                    .stroke(Color.errorColor, lineWidth: 2)
            )
            .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
            .animation(ThemeManager.Animation.fast, value: configuration.isPressed)
    }
}

// MARK: - Custom Card Style

struct CardModifier: ViewModifier {
    var backgroundColor: Color = .darkSurface
    var padding: CGFloat = ThemeManager.Spacing.md
    
    func body(content: Content) -> some View {
        content
            .padding(padding)
            .background(backgroundColor)
            .cornerRadius(ThemeManager.CardStyle.cornerRadius)
            .darkShadow()
    }
}

extension View {
    func cardStyle(backgroundColor: Color = .darkSurface, padding: CGFloat = ThemeManager.Spacing.md) -> some View {
        self.modifier(CardModifier(backgroundColor: backgroundColor, padding: padding))
    }
}

// MARK: - Loading Indicator

struct LoadingView: View {
    var message: String = "Loading..."
    
    var body: some View {
        VStack(spacing: ThemeManager.Spacing.md) {
            ProgressView()
                .progressViewStyle(CircularProgressViewStyle(tint: .neonBlue))
                .scaleEffect(1.5)
            
            Text(message)
                .font(ThemeManager.Typography.bodyMedium)
                .foregroundColor(.textSecondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.darkBg.ignoresSafeArea())
    }
}

// MARK: - Empty State View

struct EmptyStateView: View {
    var icon: String
    var title: String
    var message: String
    var actionTitle: String?
    var action: (() -> Void)?
    
    var body: some View {
        VStack(spacing: ThemeManager.Spacing.lg) {
            Image(systemName: icon)
                .font(.system(size: 64))
                .foregroundColor(.textTertiary)
            
            VStack(spacing: ThemeManager.Spacing.sm) {
                Text(title)
                    .font(ThemeManager.Typography.headlineSmall)
                    .foregroundColor(.textPrimary)
                
                Text(message)
                    .font(ThemeManager.Typography.bodyMedium)
                    .foregroundColor(.textSecondary)
                    .multilineTextAlignment(.center)
            }
            
            if let actionTitle = actionTitle, let action = action {
                Button(action: action) {
                    Text(actionTitle)
                }
                .buttonStyle(PrimaryButtonStyle())
                .padding(.horizontal, ThemeManager.Spacing.xl)
            }
        }
        .padding(ThemeManager.Spacing.xl)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.darkBg.ignoresSafeArea())
    }
}

// MARK: - Status Badge

struct StatusBadge: View {
    var text: String
    var color: Color
    
    var body: some View {
        Text(text)
            .font(ThemeManager.Typography.labelSmall)
            .fontWeight(.semibold)
            .foregroundColor(.white)
            .padding(.horizontal, ThemeManager.Spacing.md)
            .padding(.vertical, ThemeManager.Spacing.xs)
            .background(color)
            .cornerRadius(ThemeManager.CornerRadius.full)
    }
}

// MARK: - Earnings Display

struct EarningsDisplay: View {
    var amount: Double
    var currency: String = "GBP"
    var size: EarningsSize = .medium
    
    enum EarningsSize {
        case small, medium, large
        
        var font: Font {
            switch self {
            case .small: return ThemeManager.Typography.titleMedium
            case .medium: return ThemeManager.Typography.headlineSmall
            case .large: return ThemeManager.Typography.displaySmall
            }
        }
    }
    
    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 4) {
            Text("£")
                .font(size.font)
                .fontWeight(.bold)
                .foregroundColor(.brandGreen)
            
            Text(String(format: "%.2f", amount))
                .font(size.font)
                .fontWeight(.bold)
                .foregroundColor(.textPrimary)
        }
    }
}

// MARK: - Haptic Feedback Manager

class HapticManager {
    static let shared = HapticManager()
    
    private init() {}
    
    func impact(_ style: UIImpactFeedbackGenerator.FeedbackStyle) {
        let generator = UIImpactFeedbackGenerator(style: style)
        generator.impactOccurred()
    }
    
    func notification(_ type: UINotificationFeedbackGenerator.FeedbackType) {
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(type)
    }
    
    func selection() {
        let generator = UISelectionFeedbackGenerator()
        generator.selectionChanged()
    }
    
    // Convenience methods
    func success() {
        notification(.success)
    }
    
    func error() {
        notification(.error)
    }
    
    func warning() {
        notification(.warning)
    }
    
    func light() {
        impact(.light)
    }
    
    func medium() {
        impact(.medium)
    }
    
    func heavy() {
        impact(.heavy)
    }
}

