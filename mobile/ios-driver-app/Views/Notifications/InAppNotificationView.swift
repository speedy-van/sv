import SwiftUI

// MARK: - In-App Notification Alert View
// Displays when push notification arrives, with View Now and Accept actions

struct InAppNotificationView: View {
    let payload: NotificationPayload
    let onAction: (NotificationAction) -> Void
    
    @State private var isProcessing = false
    @State private var countdown: Int = 30 // Auto-dismiss after 30 seconds
    @State private var timer: Timer?
    
    var body: some View {
        VStack(spacing: 0) {
            Spacer()
            
            VStack(spacing: 20) {
                // Header with icon
                HStack {
                    Image(systemName: iconForType(payload.type))
                        .font(.system(size: 32))
                        .foregroundColor(.white)
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text(payload.title)
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.white)
                        
                        Text(payload.message)
                            .font(.system(size: 14))
                            .foregroundColor(.white.opacity(0.9))
                            .lineLimit(2)
                    }
                    
                    Spacer()
                    
                    // Countdown badge
                    ZStack {
                        Circle()
                            .fill(Color.white.opacity(0.2))
                            .frame(width: 36, height: 36)
                        
                        Text("\(countdown)")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.white)
                    }
                }
                .padding()
                .background(
                    LinearGradient(
                        gradient: Gradient(colors: [
                            Color.brandPrimary,
                            Color.brandPrimary.opacity(0.8)
                        ]),
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                
                // Action buttons
                VStack(spacing: 12) {
                    // View Now button
                    Button {
                        handleAction(.viewNow)
                    } label: {
                        HStack {
                            Image(systemName: "eye.fill")
                            Text("View Now")
                                .font(.system(size: 16, weight: .semibold))
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    .disabled(isProcessing)
                    
                    // Accept button
                    Button {
                        handleAction(.accept)
                    } label: {
                        HStack {
                            if isProcessing {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                Image(systemName: "checkmark.circle.fill")
                                Text("Accept")
                                    .font(.system(size: 16, weight: .semibold))
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.green)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    .disabled(isProcessing)
                    
                    // Dismiss button
                    Button {
                        handleAction(.dismiss)
                    } label: {
                        Text("Dismiss")
                            .font(.system(size: 14))
                            .foregroundColor(.secondary)
                    }
                    .disabled(isProcessing)
                }
                .padding()
            }
            .background(Color(.systemBackground))
            .cornerRadius(20, corners: [.topLeft, .topRight])
            .shadow(color: .black.opacity(0.3), radius: 20, x: 0, y: -5)
            .transition(.move(edge: .bottom))
        }
        .background(Color.black.opacity(0.4))
        .edgesIgnoringSafeArea(.all)
        .onAppear {
            startCountdown()
        }
        .onDisappear {
            stopCountdown()
        }
    }
    
    private func handleAction(_ action: NotificationAction) {
        if action == .accept {
            isProcessing = true
        }
        
        stopCountdown()
        onAction(action)
    }
    
    private func startCountdown() {
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
            if countdown > 0 {
                countdown -= 1
            } else {
                // Auto-dismiss
                handleAction(.dismiss)
            }
        }
    }
    
    private func stopCountdown() {
        timer?.invalidate()
        timer = nil
    }
    
    private func iconForType(_ type: NotificationType) -> String {
        switch type {
        case .newJob, .jobUpdate:
            return "shippingbox.fill"
        case .newRoute, .routeUpdate:
            return "map.fill"
        }
    }
}

// MARK: - Corner Radius Extension

extension View {
    func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape(RoundedCorner(radius: radius, corners: corners))
    }
}

struct RoundedCorner: Shape {
    var radius: CGFloat = .infinity
    var corners: UIRectCorner = .allCorners
    
    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(
            roundedRect: rect,
            byRoundingCorners: corners,
            cornerRadii: CGSize(width: radius, height: radius)
        )
        return Path(path.cgPath)
    }
}

#Preview {
    InAppNotificationView(
        payload: NotificationPayload(
            id: "test-1",
            type: .newJob,
            entityId: "job-123",
            title: "🚚 New Job Available",
            message: "From London to Manchester • 45.2 mi • £85.50",
            metadata: [:]
        ),
        onAction: { action in
            print("Action: \(action)")
        }
    )
}

