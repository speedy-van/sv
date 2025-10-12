import Foundation
import UserNotifications

// MARK: - Notification Service

class NotificationService: NSObject {
    static let shared = NotificationService()
    
    private let network = NetworkService.shared
    private var deviceToken: String?
    
    private override init() {
        super.init()
    }
    
    // MARK: - Device Token
    
    func registerDeviceToken(_ token: String) {
        deviceToken = token
        
        // Send to backend
        Task {
            do {
                try await sendTokenToBackend(token)
            } catch {
                print("❌ Failed to register device token: \(error.localizedDescription)")
            }
        }
    }
    
    private func sendTokenToBackend(_ token: String) async throws {
        struct DeviceTokenRequest: Codable {
            let token: String
            let platform: String
        }
        
        let request = DeviceTokenRequest(token: token, platform: "ios")
        
        // Note: This endpoint needs to be implemented on backend
        // let _: EmptyResponse = try await network.request(.registerDevice, method: .post, body: request)
        
        print("📱 Device token registered: \(token)")
    }
    
    // MARK: - Local Notifications
    
    func scheduleLocalNotification(
        title: String,
        body: String,
        identifier: String = UUID().uuidString,
        delay: TimeInterval = 0,
        userInfo: [String: Any] = [:]
    ) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        content.userInfo = userInfo
        
        let trigger: UNNotificationTrigger?
        if delay > 0 {
            trigger = UNTimeIntervalNotificationTrigger(timeInterval: delay, repeats: false)
        } else {
            trigger = nil
        }
        
        let request = UNNotificationRequest(
            identifier: identifier,
            content: content,
            trigger: trigger
        )
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("❌ Failed to schedule notification: \(error.localizedDescription)")
            } else {
                print("✅ Notification scheduled: \(title)")
            }
        }
    }
    
    // MARK: - Job Notifications
    
    func notifyNewJob(job: Job, distance: Double? = nil, duration: Int? = nil) {
        var bodyText = "From \(job.from) to \(job.to)"
        
        // Add distance and duration if available
        if let distance = distance {
            bodyText += " • \(String(format: "%.1f", distance)) mi"
        }
        if let duration = duration {
            let hours = duration / 60
            let mins = duration % 60
            if hours > 0 {
                bodyText += " • \(hours)h \(mins)m"
            } else {
                bodyText += " • \(mins)m"
            }
        }
        
        bodyText += " • £\(String(format: "%.2f", job.estimatedEarnings))"
        
        let content = UNMutableNotificationContent()
        content.title = "🚚 New Job Available"
        content.body = bodyText
        content.sound = UNNotificationSound(named: UNNotificationSoundName("job_alert.wav"))
        content.badge = 1
        content.categoryIdentifier = "JOB_OFFER"
        content.userInfo = [
            "jobId": job.id,
            "type": "new_job",
            "distance": distance ?? 0,
            "duration": duration ?? 0,
            "earnings": job.estimatedEarnings
        ]
        
        let request = UNNotificationRequest(
            identifier: "job_\(job.id)",
            content: content,
            trigger: nil // Immediate
        )
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("❌ Failed to send job notification: \(error.localizedDescription)")
            } else {
                print("✅ Job notification sent: \(job.id)")
            }
        }
    }
    
    func notifyRouteMatched(routeId: String, jobCount: Int, totalDistance: Double, totalDuration: Int, totalEarnings: Double) {
        var bodyText = "\(jobCount) stops"
        bodyText += " • \(String(format: "%.1f", totalDistance)) mi"
        
        let hours = totalDuration / 60
        let mins = totalDuration % 60
        if hours > 0 {
            bodyText += " • \(hours)h \(mins)m"
        } else {
            bodyText += " • \(mins)m"
        }
        
        bodyText += " • £\(String(format: "%.2f", totalEarnings))"
        
        let content = UNMutableNotificationContent()
        content.title = "🗺️ Route Matched"
        content.body = bodyText
        content.sound = UNNotificationSound(named: UNNotificationSoundName("route_alert.wav"))
        content.badge = 1
        content.categoryIdentifier = "ROUTE_OFFER"
        content.userInfo = [
            "routeId": routeId,
            "type": "route_matched",
            "jobCount": jobCount,
            "distance": totalDistance,
            "duration": totalDuration,
            "earnings": totalEarnings
        ]
        
        let request = UNNotificationRequest(
            identifier: "route_\(routeId)",
            content: content,
            trigger: nil
        )
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("❌ Failed to send route notification: \(error.localizedDescription)")
            } else {
                print("✅ Route notification sent: \(routeId)")
            }
        }
    }
    
    func notifyJobAccepted(job: Job) {
        scheduleLocalNotification(
            title: "Job Accepted",
            body: "You've accepted the job from \(job.from) to \(job.to)",
            userInfo: ["jobId": job.id, "type": "job_accepted"]
        )
    }
    
    func notifyJobReminder(job: Job, minutesBefore: Int) {
        scheduleLocalNotification(
            title: "Upcoming Job",
            body: "Job starting in \(minutesBefore) minutes - \(job.from)",
            delay: TimeInterval(minutesBefore * 60),
            userInfo: ["jobId": job.id, "type": "job_reminder"]
        )
    }
}

