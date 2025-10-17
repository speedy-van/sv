import Foundation
import Combine

// MARK: - Pusher Service for Real-time Events

class PusherService: ObservableObject {
    static let shared = PusherService()
    
    @Published var isConnected: Bool = false
    @Published var lastEvent: PusherEvent?
    
    private var eventSubject = PassthroughSubject<PusherEvent, Never>()
    var eventPublisher: AnyPublisher<PusherEvent, Never> {
        eventSubject.eraseToAnyPublisher()
    }
    
    private var driverId: String?
    private var webSocketTask: URLSessionWebSocketTask?
    private var reconnectTimer: Timer?
    private var pingTimer: Timer?
    
    private init() {}
    
    // MARK: - Connect to Pusher
    
    func connect(driverId: String) {
        self.driverId = driverId
        
        guard let url = URL(string: "wss://your-pusher-endpoint.com/driver/\(driverId)") else {
            print("❌ Invalid Pusher URL")
            return
        }
        
        let session = URLSession(configuration: .default)
        webSocketTask = session.webSocketTask(with: url)
        webSocketTask?.resume()
        
        isConnected = true
        print("✅ Pusher connected for driver: \(driverId)")
        
        // Start listening for messages
        receiveMessage()
        
        // Start ping timer to keep connection alive
        startPingTimer()
    }
    
    // MARK: - Disconnect
    
    func disconnect() {
        webSocketTask?.cancel(with: .goingAway, reason: nil)
        webSocketTask = nil
        isConnected = false
        pingTimer?.invalidate()
        pingTimer = nil
        reconnectTimer?.invalidate()
        reconnectTimer = nil
        
        print("✅ Pusher disconnected")
    }
    
    // MARK: - Receive Messages
    
    private func receiveMessage() {
        webSocketTask?.receive { [weak self] result in
            guard let self = self else { return }
            
            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    self.handleMessage(text)
                case .data(let data):
                    if let text = String(data: data, encoding: .utf8) {
                        self.handleMessage(text)
                    }
                @unknown default:
                    break
                }
                
                // Continue listening
                self.receiveMessage()
                
            case .failure(let error):
                print("❌ WebSocket receive error: \(error.localizedDescription)")
                self.isConnected = false
                
                // Attempt to reconnect after 5 seconds
                self.scheduleReconnect()
            }
        }
    }
    
    // MARK: - Handle Message
    
    private func handleMessage(_ text: String) {
        guard let data = text.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let eventName = json["event"] as? String,
              let eventData = json["data"] as? [String: Any] else {
            return
        }
        
        print("📬 Pusher event received: \(eventName)")
        
        let event = PusherEvent(name: eventName, data: eventData)
        
        DispatchQueue.main.async {
            self.lastEvent = event
            self.eventSubject.send(event)
        }
        
        // Handle specific events
        handleEvent(event)
    }
    
    // MARK: - Handle Specific Events
    
    private func handleEvent(_ event: PusherEvent) {
        switch event.name {
        case "route-matched":
            handleRouteMatched(event.data)
            
        case "route-removed":
            handleRouteRemoved(event.data)
            
        case "route-assigned":
            handleRouteAssigned(event.data)
            
        case "acceptance-rate-updated":
            handleAcceptanceRateUpdated(event.data)
            
        case "job-matched":
            handleJobMatched(event.data)
            
        case "job-cancelled":
            handleJobCancelled(event.data)
            
        default:
            print("⚠️ Unhandled event: \(event.name)")
        }
    }
    
    // MARK: - Event Handlers
    
    private func handleRouteMatched(_ data: [String: Any]) {
        guard let routeId = data["routeId"] as? String else { return }
        
        let routeNumber = data["routeNumber"] as? String ?? data["bookingReference"] as? String ?? routeId
        let jobCount = data["jobCount"] as? Int ?? data["bookingsCount"] as? Int ?? 1
        let distance = data["totalDistance"] as? Double ?? 0
        let earnings = data["totalEarnings"] as? Double ?? 0
        
        print("🗺️ Route Matched: \(routeNumber) with \(jobCount) stops")
        
        // Send local notification
        NotificationService.shared.notifyRouteMatched(
            routeId: routeId,
            jobCount: jobCount,
            totalDistance: distance,
            totalDuration: 0,
            totalEarnings: earnings
        )
        
        // Post notification for UI update
        NotificationCenter.default.post(
            name: NSNotification.Name("RouteMatched"),
            object: nil,
            userInfo: ["routeId": routeId]
        )
    }
    
    private func handleRouteRemoved(_ data: [String: Any]) {
        guard let routeId = data["routeId"] as? String else { return }
        
        let reason = data["reason"] as? String ?? "unknown"
        
        print("🗑️ Route Removed: \(routeId) - Reason: \(reason)")
        
        // Post notification for UI update (remove from list immediately)
        NotificationCenter.default.post(
            name: NSNotification.Name("RouteRemoved"),
            object: nil,
            userInfo: ["routeId": routeId, "reason": reason]
        )
        
        // Show local notification
        NotificationService.shared.scheduleLocalNotification(
            title: "Route Removed",
            body: "Route has been removed from your schedule",
            userInfo: ["routeId": routeId]
        )
    }
    
    private func handleRouteAssigned(_ data: [String: Any]) {
        // Legacy event - redirect to route-matched
        handleRouteMatched(data)
    }
    
    private func handleAcceptanceRateUpdated(_ data: [String: Any]) {
        guard let newRate = data["acceptanceRate"] as? Double else { return }
        
        print("📊 Acceptance Rate Updated: \(newRate)%")
        
        // Post notification for UI update
        NotificationCenter.default.post(
            name: NSNotification.Name("AcceptanceRateUpdated"),
            object: nil,
            userInfo: ["acceptanceRate": newRate]
        )
    }
    
    private func handleJobMatched(_ data: [String: Any]) {
        guard let jobId = data["jobId"] as? String else { return }
        
        print("🚚 Job Matched: \(jobId)")
        
        // Post notification for UI update
        NotificationCenter.default.post(
            name: NSNotification.Name("JobMatched"),
            object: nil,
            userInfo: ["jobId": jobId]
        )
    }
    
    private func handleJobCancelled(_ data: [String: Any]) {
        guard let jobId = data["jobId"] as? String else { return }
        
        print("❌ Job Cancelled: \(jobId)")
        
        // Post notification for UI update
        NotificationCenter.default.post(
            name: NSNotification.Name("JobCancelled"),
            object: nil,
            userInfo: ["jobId": jobId]
        )
    }
    
    // MARK: - Ping/Pong to Keep Connection Alive
    
    private func startPingTimer() {
        pingTimer?.invalidate()
        pingTimer = Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { [weak self] _ in
            self?.sendPing()
        }
    }
    
    private func sendPing() {
        webSocketTask?.sendPing { error in
            if let error = error {
                print("❌ Ping failed: \(error.localizedDescription)")
            }
        }
    }
    
    // MARK: - Reconnection
    
    private func scheduleReconnect() {
        reconnectTimer?.invalidate()
        reconnectTimer = Timer.scheduledTimer(withTimeInterval: 5, repeats: false) { [weak self] _ in
            guard let self = self, let driverId = self.driverId else { return }
            print("🔄 Attempting to reconnect to Pusher...")
            self.connect(driverId: driverId)
        }
    }
}

// MARK: - Pusher Event Model

struct PusherEvent {
    let name: String
    let data: [String: Any]
    let timestamp: Date
    
    init(name: String, data: [String: Any]) {
        self.name = name
        self.data = data
        self.timestamp = Date()
    }
}

