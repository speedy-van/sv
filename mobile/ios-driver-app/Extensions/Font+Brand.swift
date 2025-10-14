import SwiftUI

// MARK: - Brand Typography Extension

extension Font {
    // MARK: - Headings
    
    /// H1 - Large heading (32pt, Bold)
    static let h1 = Font.system(size: 32, weight: .bold, design: .default)
    
    /// H2 - Medium heading (24pt, Semibold)
    static let h2 = Font.system(size: 24, weight: .semibold, design: .default)
    
    /// H3 - Small heading (18pt, Semibold)
    static let h3 = Font.system(size: 18, weight: .semibold, design: .default)
    
    /// H4 - Extra small heading (16pt, Semibold)
    static let h4 = Font.system(size: 16, weight: .semibold, design: .default)
    
    // MARK: - Body Text
    
    /// Body Large - Main content (16pt, Regular)
    static let bodyLarge = Font.system(size: 16, weight: .regular, design: .default)
    
    /// Body - Standard content (14pt, Regular)
    static let body = Font.system(size: 14, weight: .regular, design: .default)
    
    /// Body Small - Secondary content (12pt, Regular)
    static let bodySmall = Font.system(size: 12, weight: .regular, design: .default)
    
    // MARK: - Special Purpose
    
    /// Caption - Small labels (11pt, Medium)
    static let caption = Font.system(size: 11, weight: .medium, design: .default)
    
    /// Button - Button text (16pt, Semibold)
    static let button = Font.system(size: 16, weight: .semibold, design: .default)
    
    /// Button Small - Small button text (14pt, Semibold)
    static let buttonSmall = Font.system(size: 14, weight: .semibold, design: .default)
    
    /// Overline - All caps labels (12pt, Bold)
    static let overline = Font.system(size: 12, weight: .bold, design: .default)
    
    // MARK: - Numbers/Stats
    
    /// Large number display (28pt, Bold)
    static let numberLarge = Font.system(size: 28, weight: .bold, design: .rounded)
    
    /// Medium number display (20pt, Bold)
    static let numberMedium = Font.system(size: 20, weight: .bold, design: .rounded)
    
    /// Small number display (16pt, Semibold)
    static let numberSmall = Font.system(size: 16, weight: .semibold, design: .rounded)
}

// MARK: - Text Modifiers

extension View {
    /// Apply heading 1 style
    func h1Style() -> some View {
        self
            .font(.h1)
            .foregroundColor(.textPrimary)
    }
    
    /// Apply heading 2 style
    func h2Style() -> some View {
        self
            .font(.h2)
            .foregroundColor(.textPrimary)
    }
    
    /// Apply heading 3 style
    func h3Style() -> some View {
        self
            .font(.h3)
            .foregroundColor(.textPrimary)
    }
    
    /// Apply body text style
    func bodyStyle() -> some View {
        self
            .font(.body)
            .foregroundColor(.textPrimary)
    }
    
    /// Apply secondary text style
    func secondaryTextStyle() -> some View {
        self
            .font(.bodySmall)
            .foregroundColor(.textSecondary)
    }
    
    /// Apply caption style
    func captionStyle() -> some View {
        self
            .font(.caption)
            .foregroundColor(.textTertiary)
    }
}

