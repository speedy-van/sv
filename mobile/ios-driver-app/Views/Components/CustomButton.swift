import SwiftUI

struct CustomButton: View {
    let title: String
    let icon: String?
    let style: ButtonStyle
    let isLoading: Bool
    let action: () -> Void
    
    enum ButtonStyle {
        case primary
        case secondary
        case success
        case danger
        case outline
        
        var backgroundColor: Color {
            switch self {
            case .primary: return .brandPrimary
            case .secondary: return .gray
            case .success: return .green
            case .danger: return .red
            case .outline: return .clear
            }
        }
        
        var foregroundColor: Color {
            switch self {
            case .outline: return .brandPrimary
            default: return .white
            }
        }
        
        var borderColor: Color? {
            switch self {
            case .outline: return .brandPrimary
            default: return nil
            }
        }
    }
    
    init(
        title: String,
        icon: String? = nil,
        style: ButtonStyle = .primary,
        isLoading: Bool = false,
        action: @escaping () -> Void
    ) {
        self.title = title
        self.icon = icon
        self.style = style
        self.isLoading = isLoading
        self.action = action
    }
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 10) {
                if isLoading {
                    ProgressView()
                        .tint(style.foregroundColor)
                } else {
                    if let icon = icon {
                        Image(systemName: icon)
                            .font(.system(size: 16, weight: .semibold))
                    }
                    
                    Text(title)
                        .font(.system(size: 16, weight: .semibold))
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 50)
            .background(style.backgroundColor)
            .foregroundColor(style.foregroundColor)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(style.borderColor ?? .clear, lineWidth: 2)
            )
        }
        .disabled(isLoading)
    }
}

#Preview {
    VStack(spacing: 20) {
        CustomButton(title: "Primary Button", icon: "checkmark.circle.fill", style: .primary) {
            print("Tapped")
        }
        
        CustomButton(title: "Success Button", icon: "checkmark.circle.fill", style: .success) {
            print("Tapped")
        }
        
        CustomButton(title: "Danger Button", icon: "xmark.circle.fill", style: .danger) {
            print("Tapped")
        }
        
        CustomButton(title: "Outline Button", icon: "arrow.right", style: .outline) {
            print("Tapped")
        }
        
        CustomButton(title: "Loading Button", style: .primary, isLoading: true) {
            print("Tapped")
        }
    }
    .padding()
}

