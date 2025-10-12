import Foundation

// MARK: - Route Models

struct Route: Identifiable, Codable {
    let id: String
    let status: RouteStatus
    let serviceTier: String
    let driverId: String?
    let totalDrops: Int
    let completedDrops: Int
    let estimatedDuration: Int // minutes
    let totalDistance: Double // kilometers
    let totalValue: Double // GBP (in pence)
    let timeWindowStart: Date
    let timeWindowEnd: Date
    let optimizedSequence: [Int]
    let createdAt: Date
    let drops: [Drop]
    
    // ✅ FIX #6: New fields for enhanced route details
    let optimizationScore: Double?
    let totalEarnings: Int? // Driver earnings in pence
    let earningsPerHour: Double?
    let earningsPerStop: Double?
    let multiDropBonus: Int? // in pence
    
    var formattedEarnings: String {
        guard let earnings = totalEarnings else { return "N/A" }
        return "£\(String(format: "%.2f", Double(earnings) / 100.0))"
    }
    
    var formattedEarningsPerHour: String {
        guard let eph = earningsPerHour else { return "N/A" }
        return "£\(String(format: "%.2f", eph / 100.0))/hr"
    }
    
    var progress: Double {
        guard totalDrops > 0 else { return 0 }
        return Double(completedDrops) / Double(totalDrops)
    }
    
    var progressPercentage: Int {
        Int(progress * 100)
    }
    
    var formattedTotalValue: String {
        let pounds = totalValue / 100
        return "£\(String(format: "%.2f", pounds))"
    }
    
    var formattedDistance: String {
        let miles = totalDistance * 0.621371 // Convert km to miles
        return String(format: "%.1f miles", miles)
    }
    
    var formattedDuration: String {
        let hours = estimatedDuration / 60
        let minutes = estimatedDuration % 60
        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else {
            return "\(minutes)m"
        }
    }
    
    var statusColor: String {
        switch status {
        case .pendingAssignment:
            return "blue"
        case .assigned:
            return "orange"
        case .active:
            return "green"
        case .completed:
            return "gray"
        case .failed:
            return "red"
        }
    }
}

enum RouteStatus: String, Codable {
    case pendingAssignment = "pending_assignment"
    case assigned = "assigned"
    case active = "active"
    case completed = "completed"
    case failed = "failed"
    
    var displayName: String {
        switch self {
        case .pendingAssignment:
            return "Pending Assignment"
        case .assigned:
            return "Assigned"
        case .active:
            return "Active"
        case .completed:
            return "Completed"
        case .failed:
            return "Failed"
        }
    }
}

// MARK: - Drop Models

struct Drop: Identifiable, Codable {
    let id: String
    let routeId: String?
    let bookingId: String?
    let customerId: String
    let customerName: String?
    let customerPhone: String?
    let pickupAddress: String
    let deliveryAddress: String
    let pickupLatitude: Double?
    let pickupLongitude: Double?
    let deliveryLatitude: Double?
    let deliveryLongitude: Double?
    let timeWindowStart: Date
    let timeWindowEnd: Date
    let serviceTier: String
    let status: DropStatus
    let quotedPrice: Double // in pence
    let weight: Double?
    let volume: Double?
    let specialInstructions: String?
    let proofOfDelivery: String?
    let failureReason: String?
    let completedAt: Date?
    let createdAt: Date
    let sequenceNumber: Int?
    
    var formattedPrice: String {
        let pounds = quotedPrice / 100
        return "£\(String(format: "%.2f", pounds))"
    }
    
    var isCompleted: Bool {
        status == .delivered || status == .failed
    }
    
    var statusColor: String {
        switch status {
        case .pending:
            return "gray"
        case .assignedToRoute:
            return "blue"
        case .pickedUp:
            return "orange"
        case .inTransit:
            return "green"
        case .delivered:
            return "green"
        case .failed:
            return "red"
        }
    }
}

enum DropStatus: String, Codable {
    case pending = "pending"
    case assignedToRoute = "assigned_to_route"
    case pickedUp = "picked_up"
    case inTransit = "in_transit"
    case delivered = "delivered"
    case failed = "failed"
    
    var displayName: String {
        switch self {
        case .pending:
            return "Pending"
        case .assignedToRoute:
            return "Assigned"
        case .pickedUp:
            return "Picked Up"
        case .inTransit:
            return "In Transit"
        case .delivered:
            return "Delivered"
        case .failed:
            return "Failed"
        }
    }
}

// MARK: - Route Response

struct RoutesResponse: Codable {
    let success: Bool
    let data: [Route]
    let total: Int?
}

struct RouteDetailResponse: Codable {
    let success: Bool
    let data: Route
}

// MARK: - Drop Update Request

struct DropUpdateRequest: Codable {
    let status: DropStatus
    let latitude: Double?
    let longitude: Double?
    let proofOfDelivery: String?
    let failureReason: String?
    let completedAt: Date?
}

