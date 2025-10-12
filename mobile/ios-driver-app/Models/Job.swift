import Foundation

// MARK: - Job Model

struct Job: Codable, Identifiable {
    let id: String
    let reference: String
    let customer: String
    let customerPhone: String
    let date: String
    let time: String
    let from: String
    let to: String
    let distance: String
    let vehicleType: String
    let items: String
    let estimatedEarnings: String
    let status: JobStatus
    let priority: JobPriority
    let duration: String
    let crew: String
    
    // Additional details for full job info
    var pickupAddress: BookingAddress?
    var dropoffAddress: BookingAddress?
    var bookingItems: [BookingItem]?
    var assignmentId: String?
    var scheduledAt: Date?
    
    enum CodingKeys: String, CodingKey {
        case id, reference, customer, customerPhone, date, time, from, to, distance
        case vehicleType, items, estimatedEarnings, status, priority, duration, crew
        case pickupAddress, dropoffAddress, bookingItems, assignmentId, scheduledAt
    }
}

enum JobStatus: String, Codable {
    case available = "available"
    case assigned = "assigned"
    case accepted = "accepted"
    case enRoute = "en_route"
    case arrived = "arrived"
    case loading = "loading"
    case inTransit = "in_transit"
    case unloading = "unloading"
    case completed = "completed"
    case cancelled = "cancelled"
    
    var displayName: String {
        switch self {
        case .available: return "Available"
        case .assigned: return "Assigned"
        case .accepted: return "Accepted"
        case .enRoute: return "En Route"
        case .arrived: return "Arrived"
        case .loading: return "Loading"
        case .inTransit: return "In Transit"
        case .unloading: return "Unloading"
        case .completed: return "Completed"
        case .cancelled: return "Cancelled"
        }
    }
    
    var color: String {
        switch self {
        case .available: return "blue"
        case .assigned, .accepted: return "green"
        case .enRoute, .arrived, .loading: return "orange"
        case .inTransit, .unloading: return "purple"
        case .completed: return "gray"
        case .cancelled: return "red"
        }
    }
}

enum JobPriority: String, Codable {
    case normal = "normal"
    case urgent = "urgent"
    case scheduled = "scheduled"
}

// MARK: - Jobs Response

struct JobsResponse: Codable {
    let success: Bool
    let data: JobsData
}

struct JobsData: Codable {
    let jobs: [Job]
    let total: Int
    let available: Int
    let assigned: Int
}

// MARK: - Booking Address

struct BookingAddress: Codable {
    let id: String?
    let label: String
    let line1: String?
    let line2: String?
    let city: String?
    let postcode: String
    let lat: Double?
    let lng: Double?
    
    var fullAddress: String {
        var parts: [String] = []
        if let line1 = line1 { parts.append(line1) }
        if let line2 = line2 { parts.append(line2) }
        if let city = city { parts.append(city) }
        parts.append(postcode)
        return parts.joined(separator: ", ")
    }
}

// MARK: - Booking Item

struct BookingItem: Codable, Identifiable {
    let id: String
    let name: String
    let quantity: Int
    let weight: Double?
    let dimensions: String?
    
    var displayName: String {
        return "\(quantity)x \(name)"
    }
}

// MARK: - Job Actions

struct JobActionRequest: Codable {
    let reason: String?
}

struct JobActionResponse: Codable {
    let success: Bool
    let message: String?
    let error: String?
}

// MARK: - Job Progress

enum JobProgressStep: String, Codable {
    case enRoute = "en_route"
    case arrived = "arrived"
    case loading = "loading"
    case inTransit = "in_transit"
    case unloading = "unloading"
    case completed = "completed"
    
    var displayName: String {
        switch self {
        case .enRoute: return "En Route to Pickup"
        case .arrived: return "Arrived at Pickup"
        case .loading: return "Loading Items"
        case .inTransit: return "In Transit to Dropoff"
        case .unloading: return "Unloading Items"
        case .completed: return "Job Completed"
        }
    }
    
    var icon: String {
        switch self {
        case .enRoute: return "car.fill"
        case .arrived: return "mappin.circle.fill"
        case .loading: return "arrow.up.doc.fill"
        case .inTransit: return "shippingbox.fill"
        case .unloading: return "arrow.down.doc.fill"
        case .completed: return "checkmark.circle.fill"
        }
    }
    
    var nextStep: JobProgressStep? {
        switch self {
        case .enRoute: return .arrived
        case .arrived: return .loading
        case .loading: return .inTransit
        case .inTransit: return .unloading
        case .unloading: return .completed
        case .completed: return nil
        }
    }
}

struct JobProgressRequest: Codable {
    let step: String
    let notes: String?
    let latitude: Double?
    let longitude: Double?
}

struct JobProgressResponse: Codable {
    let success: Bool
    let message: String?
    let error: String?
    let data: JobProgressData?
}

struct JobProgressData: Codable {
    let step: String
    let timestamp: String
}

