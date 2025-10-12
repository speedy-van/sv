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
    
    func notifyNewJob(job: Job) {
        scheduleLocalNotification(
            title: "New Job Available",
            body: "From \(job.from) to \(job.to) - £\(job.estimatedEarnings)",
            userInfo: ["jobId": job.id, "type": "new_job"]
        )
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

