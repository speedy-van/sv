import Foundation
import SwiftUI
import UserNotifications

// MARK: - Notification Handler
// Handles push notification → in-app flow for route/order alerts

class NotificationHandler: ObservableObject {
    static let shared = NotificationHandler()
    
    @Published var showInAppAlert = false
    @Published var currentNotification: NotificationPayload?
    @Published var notificationAction: NotificationAction?
    
    private let network = NetworkService.shared
    private var processingNotifications = Set<String>()
    
    private init() {}
    
    // MARK: - Notification Processing
    
    func handlePushNotification(_ userInfo: [AnyHashable: Any]) {
        print("📬 Processing push notification: \(userInfo)")
        
        guard let payload = parseNotificationPayload(userInfo) else {
            print("❌ Failed to parse notification payload")
            return
        }
        
        // Prevent duplicate processing
        guard !processingNotifications.contains(payload.id) else {
            print("⚠️ Notification already being processed: \(payload.id)")
            return
        }
        
        processingNotifications.insert(payload.id)
        
        DispatchQueue.main.async {
            self.currentNotification = payload
            self.showInAppAlert = true
        }
        
        // Log notification receipt
        Task {
            await logNotificationEvent(payload: payload, event: "received")
        }
    }
    
    func handleNotificationAction(_ action: NotificationAction, payload: NotificationPayload) {
        Task {
            await logNotificationEvent(payload: payload, event: "action_\(action.rawValue)")
            
            switch action {
            case .viewNow:
                await handleViewNow(payload: payload)
            case .accept:
                await handleAccept(payload: payload)
            case .dismiss:
                await handleDismiss(payload: payload)
            }
            
            // Remove from processing set
            DispatchQueue.main.async {
                self.processingNotifications.remove(payload.id)
                self.showInAppAlert = false
                self.currentNotification = nil
            }
        }
    }
    
    // MARK: - Action Handlers
    
    private func handleViewNow(payload: NotificationPayload) async {
        print("👁️ View Now tapped for \(payload.type): \(payload.entityId)")
        
        // Navigate to the appropriate screen
        DispatchQueue.main.async {
            self.notificationAction = .viewNow
            
            switch payload.type {
            case .newJob, .jobUpdate:
                NotificationCenter.default.post(
                    name: NSNotification.Name("OpenJob"),
                    object: nil,
                    userInfo: ["jobId": payload.entityId]
                )
            case .newRoute, .routeUpdate:
                NotificationCenter.default.post(
                    name: NSNotification.Name("OpenRoute"),
                    object: nil,
                    userInfo: ["routeId": payload.entityId]
                )
            case .routeCancelled:
                // Remove route from app immediately
                NotificationCenter.default.post(
                    name: NSNotification.Name("RemoveRoute"),
                    object: nil,
                    userInfo: ["routeId": payload.entityId]
                )
            case .dropRemoved:
                // Refresh route details
                NotificationCenter.default.post(
                    name: NSNotification.Name("RefreshRoute"),
                    object: nil,
                    userInfo: ["routeId": payload.entityId]
                )
            }
        }
    }
    
    private func handleAccept(payload: NotificationPayload) async {
        print("✅ Accept tapped for \(payload.type): \(payload.entityId)")
        
        // Implement idempotent accept with retry logic
        let success = await acceptWithRetry(payload: payload, maxRetries: 3)
        
        if success {
            print("✅ Successfully accepted \(payload.type): \(payload.entityId)")
            
            // Navigate to progress view
            DispatchQueue.main.async {
                self.notificationAction = .accept
                
                switch payload.type {
                case .newJob, .jobUpdate:
                    NotificationCenter.default.post(
                        name: NSNotification.Name("JobAccepted"),
                        object: nil,
                        userInfo: ["jobId": payload.entityId]
                    )
                case .newRoute, .routeUpdate:
                    NotificationCenter.default.post(
                        name: NSNotification.Name("RouteAccepted"),
                        object: nil,
                        userInfo: ["routeId": payload.entityId]
                    )
                }
            }
        } else {
            print("❌ Failed to accept \(payload.type): \(payload.entityId)")
            
            // Show error alert
            DispatchQueue.main.async {
                NotificationCenter.default.post(
                    name: NSNotification.Name("ShowError"),
                    object: nil,
                    userInfo: ["message": "Failed to accept. Please try again."]
                )
            }
        }
    }
    
    private func handleDismiss(payload: NotificationPayload) async {
        print("❌ Dismiss tapped for \(payload.type): \(payload.entityId)")
        // Just log and close
    }
    
    // MARK: - Accept with Retry (Idempotent)
    
    private func acceptWithRetry(payload: NotificationPayload, maxRetries: Int) async -> Bool {
        var attempt = 0
        var lastError: Error?
        
        while attempt < maxRetries {
            attempt += 1
            
            do {
                // Generate idempotency key based on notification ID
                let idempotencyKey = "accept_\(payload.entityId)_\(payload.id)"
                
                switch payload.type {
                case .newJob, .jobUpdate:
                    try await acceptJob(jobId: payload.entityId, idempotencyKey: idempotencyKey)
                case .newRoute, .routeUpdate:
                    try await acceptRoute(routeId: payload.entityId, idempotencyKey: idempotencyKey)
                }
                
                return true
                
            } catch {
                lastError = error
                print("❌ Accept attempt \(attempt) failed: \(error.localizedDescription)")
                
                // Exponential backoff with jitter
                if attempt < maxRetries {
                    let baseDelay = pow(2.0, Double(attempt)) // 2, 4, 8 seconds
                    let jitter = Double.random(in: 0...1.0)
                    let delay = baseDelay + jitter
                    
                    print("⏳ Retrying in \(String(format: "%.1f", delay))s...")
                    try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
                }
            }
        }
        
        print("❌ All retry attempts exhausted. Last error: \(lastError?.localizedDescription ?? "unknown")")
        return false
    }
    
    private func acceptJob(jobId: String, idempotencyKey: String) async throws {
        struct AcceptRequest: Codable {
            let idempotencyKey: String
        }
        
        let request = AcceptRequest(idempotencyKey: idempotencyKey)
        
        let response: JobActionResponse = try await network.request(
            .acceptJob(id: jobId),
            method: .post,
            body: request,
            headers: ["Idempotency-Key": idempotencyKey]
        )
        
        guard response.success else {
            throw NetworkError.serverError(response.error ?? "Failed to accept job")
        }
    }
    
    private func acceptRoute(routeId: String, idempotencyKey: String) async throws {
        struct AcceptRequest: Codable {
            let idempotencyKey: String
        }
        
        let request = AcceptRequest(idempotencyKey: idempotencyKey)
        
        let response: RouteActionResponse = try await network.request(
            .acceptRoute(id: routeId),
            method: .post,
            body: request,
            headers: ["Idempotency-Key": idempotencyKey]
        )
        
        guard response.success else {
            throw NetworkError.serverError(response.error ?? "Failed to accept route")
        }
    }
    
    // MARK: - Notification Parsing
    
    private func parseNotificationPayload(_ userInfo: [AnyHashable: Any]) -> NotificationPayload? {
        guard let typeString = userInfo["type"] as? String,
              let type = NotificationType(rawValue: typeString),
              let entityId = userInfo["entityId"] as? String ?? userInfo["jobId"] as? String ?? userInfo["routeId"] as? String,
              let title = userInfo["title"] as? String ?? userInfo["aps"] as? [String: Any] then {
            
            let id = userInfo["notificationId"] as? String ?? UUID().uuidString
            let message = userInfo["message"] as? String ?? userInfo["body"] as? String ?? ""
            
            return NotificationPayload(
                id: id,
                type: type,
                entityId: entityId,
                title: title,
                message: message,
                metadata: userInfo as? [String: Any] ?? [:]
            )
        }
        
        return nil
    }
    
    // MARK: - Telemetry
    
    private func logNotificationEvent(payload: NotificationPayload, event: String) async {
        struct NotificationLog: Codable {
            let notificationId: String
            let type: String
            let entityId: String
            let event: String
            let timestamp: String
            let metadata: [String: String]
        }
        
        let log = NotificationLog(
            notificationId: payload.id,
            type: payload.type.rawValue,
            entityId: payload.entityId,
            event: event,
            timestamp: ISO8601DateFormatter().string(from: Date()),
            metadata: [
                "title": payload.title,
                "message": payload.message
            ]
        )
        
        do {
            // Send to backend telemetry endpoint
            let _: EmptyResponse = try await network.request(
                .logNotificationEvent,
                method: .post,
                body: log
            )
            print("📊 Logged notification event: \(event)")
        } catch {
            print("⚠️ Failed to log notification event: \(error.localizedDescription)")
        }
    }
}

// MARK: - Models

struct NotificationPayload: Identifiable {
    let id: String
    let type: NotificationType
    let entityId: String
    let title: String
    let message: String
    let metadata: [String: Any]
}

enum NotificationType: String, Codable {
    case newJob = "new_job"
    case jobUpdate = "job_update"
    case newRoute = "new_route"
    case routeUpdate = "route_update"
    case routeCancelled = "route_cancelled"
    case dropRemoved = "drop_removed"
}

enum NotificationAction: String {
    case viewNow = "view_now"
    case accept = "accept"
    case dismiss = "dismiss"
}

struct RouteActionResponse: Codable {
    let success: Bool
    let message: String?
    let error: String?
}

struct EmptyResponse: Codable {}

