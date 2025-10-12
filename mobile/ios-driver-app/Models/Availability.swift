import Foundation

// MARK: - Driver Availability

struct DriverAvailability: Codable {
    let id: String?
    let driverId: String?
    let status: AvailabilityStatus
    let locationConsent: Bool
    let lastSeenAt: Date?
    let lastLat: Double?
    let lastLng: Double?
    let breakUntil: Date?
    
    enum CodingKeys: String, CodingKey {
        case id, driverId, status, locationConsent, lastSeenAt, lastLat, lastLng, breakUntil
    }
}

enum AvailabilityStatus: String, Codable {
    case online = "online"
    case offline = "offline"
    case break_ = "break"
    
    var displayName: String {
        switch self {
        case .online: return "Online"
        case .offline: return "Offline"
        case .break_: return "On Break"
        }
    }
    
    var color: String {
        switch self {
        case .online: return "green"
        case .offline: return "gray"
        case .break_: return "orange"
        }
    }
    
    var icon: String {
        switch self {
        case .online: return "checkmark.circle.fill"
        case .offline: return "xmark.circle.fill"
        case .break_: return "pause.circle.fill"
        }
    }
}

// MARK: - Availability Response

struct AvailabilityResponse: Codable {
    let success: Bool
    let data: AvailabilityData?
    let error: String?
    let activeOrders: Bool?
}

struct AvailabilityData: Codable {
    let isOnline: Bool
    let acceptingJobs: Bool
    let locationConsent: Bool
    let hasActiveOrders: Bool
    let currentLocation: LocationCoordinate?
}

struct LocationCoordinate: Codable {
    let lat: Double
    let lng: Double
}

// MARK: - Availability Update Request

struct AvailabilityUpdateRequest: Codable {
    let isAvailable: Bool?
    let availabilityMode: String?
    let locationConsent: Bool?
    let breakUntil: String?
}

// MARK: - Availability Settings

struct AvailabilitySettings {
    var isOnline: Bool
    var acceptingJobs: Bool
    var locationConsent: Bool
    var hasActiveOrders: Bool
    
    init(isOnline: Bool = false, acceptingJobs: Bool = false, locationConsent: Bool = false, hasActiveOrders: Bool = false) {
        self.isOnline = isOnline
        self.acceptingJobs = acceptingJobs
        self.locationConsent = locationConsent
        self.hasActiveOrders = hasActiveOrders
    }
    
    init(from data: AvailabilityData) {
        self.isOnline = data.isOnline
        self.acceptingJobs = data.acceptingJobs
        self.locationConsent = data.locationConsent
        self.hasActiveOrders = data.hasActiveOrders
    }
}

