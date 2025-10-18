import SwiftUI

@main
struct SpeedyVanDriverApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject private var authViewModel = AuthViewModel()
    @StateObject private var locationService = LocationService.shared
    @StateObject private var notificationHandler = NotificationHandler.shared
    
    var body: some Scene {
        WindowGroup {
            Group {
                if authViewModel.isLoading {
                    SplashView()
                } else if authViewModel.isAuthenticated {
                    DashboardView()
                        .environmentObject(authViewModel)
                        .environmentObject(locationService)
                        .environmentObject(notificationHandler)
                } else {
                    LoginView()
                        .environmentObject(authViewModel)
                }
            }
            .overlay {
                // In-app notification alert overlay
                if notificationHandler.showInAppAlert,
                   let payload = notificationHandler.currentNotification {
                    InAppNotificationView(
                        payload: payload,
                        onAction: { action in
                            notificationHandler.handleNotificationAction(action, payload: payload)
                        }
                    )
                    .transition(.move(edge: .bottom))
                    .animation(.spring(), value: notificationHandler.showInAppAlert)
                }
            }
            .onAppear {
                // Check for existing session on app launch
                authViewModel.checkSession()
            }
        }
    }
}

