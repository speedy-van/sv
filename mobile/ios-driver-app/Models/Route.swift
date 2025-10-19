import Foundation

// MARK: - Route Models (ENHANCED)

struct Route: Identifiable, Codable {
    let id: String
    let reference: String?
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
    let optimizedSequence: [OptimizedStop]?
    let createdAt: Date
    let drops: [Drop]
    
    // Enhanced fields for better tracking
    let optimizationScore: Double?
    let totalEarnings: Int? // Driver earnings in pence
    let earningsPerHour: Double?
    let earningsPerStop: Double?
    let multiDropBonus: Int? // in pence
    let routeNotes: String?
    let adminNotes: String?
    let isModifiedByAdmin: Bool?
    let acceptedAt: Date?
    let startTime: Date?
    let endTime: Date?
    let actualDistanceKm: Double?
    let actualDuration: Int?
    
    // Computed properties
    var formattedEarnings: String {
        guard let earnings = totalEarnings else { return "N/A" }
        return "£\(String(format: "%.2f", Double(earnings) / 100.0))"
    }
    
    var formattedEarningsPerHour: String {
        guard let eph = earningsPerHour else { return "N/A" }
        return "£\(String(format: "%.2f", eph / 100.0))/hr"
    }
    
    var formattedEarningsPerStop: String {
        guard let eps = earningsPerStop else { return "N/A" }
        return "£\(String(format: "%.2f", eps / 100.0))/stop"
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
    
    var formattedActualDistance: String {
        guard let distance = actualDistanceKm else { return "N/A" }
        let miles = distance * 0.621371
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
    
    var formattedActualDuration: String {
        guard let duration = actualDuration else { return "N/A" }
        let hours = duration / 60
        let minutes = duration % 60
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
        case .cancelled:
            return "red"
        case .failed:
            return "red"
        case .planned:
            return "purple"
        }
    }
    
    var canStart: Bool {
        return status == .assigned
    }
    
    var canComplete: Bool {
        return status == .active && completedDrops == totalDrops
    }
    
    var isActive: Bool {
        return status == .active
    }
    
    var isCompleted: Bool {
        return status == .completed
    }
    
    var pendingDrops: [Drop] {
        return drops.filter { !$0.isCompleted }
    }
    
    var completedDropsList: [Drop] {
        return drops.filter { $0.isCompleted }
    }
    
    var nextDrop: Drop? {
        return pendingDrops.first
    }
    
    var hasMultiDropBonus: Bool {
        return multiDropBonus != nil && multiDropBonus! > 0
    }
    
    var formattedMultiDropBonus: String {
        guard let bonus = multiDropBonus else { return "N/A" }
        return "£\(String(format: "%.2f", Double(bonus) / 100.0))"
    }
    
    var efficiencyRating: String {
        guard let score = optimizationScore else { return "N/A" }
        let percentage = score * 100
        if percentage >= 90 { return "Excellent" }
        if percentage >= 75 { return "Good" }
        if percentage >= 60 { return "Average" }
        if percentage >= 40 { return "Below Average" }
        return "Poor"
    }
}

enum RouteStatus: String, Codable {
    case planned = "planned"
    case pendingAssignment = "pending_assignment"
    case assigned = "assigned"
    case active = "active"
    case completed = "completed"
    case cancelled = "cancelled"
    case failed = "failed"
    
    var displayName: String {
        switch self {
        case .planned:
            return "Planned"
        case .pendingAssignment:
            return "Pending Assignment"
        case .assigned:
            return "Assigned"
        case .active:
            return "Active"
        case .completed:
            return "Completed"
        case .cancelled:
            return "Cancelled"
        case .failed:
            return "Failed"
        }
    }
    
    var icon: String {
        switch self {
        case .planned:
            return "calendar"
        case .pendingAssignment:
            return "clock"
        case .assigned:
            return "person.badge.clock"
        case .active:
            return "arrow.triangle.2.circlepath"
        case .completed:
            return "checkmark.circle"
        case .cancelled:
            return "xmark.circle"
        case .failed:
            return "exclamationmark.triangle"
        }
    }
}

struct OptimizedStop: Codable {
    let sequence: Int
    let bookingId: String?
    let address: String
    let estimatedArrival: Date?
}

// MARK: - Drop Models (ENHANCED)

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
    let estimatedDuration: Int? // minutes
    
    var formattedPrice: String {
        let pounds = quotedPrice / 100
        return "£\(String(format: "%.2f", pounds))"
    }
    
    var isCompleted: Bool {
        status == .delivered || status == .failed
    }
    
    var isPending: Bool {
        status == .pending || status == .assignedToRoute
    }
    
    var isInProgress: Bool {
        status == .pickedUp || status == .inTransit
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
    
    var statusIcon: String {
        switch status {
        case .pending:
            return "clock"
        case .assignedToRoute:
            return "arrow.right.circle"
        case .pickedUp:
            return "shippingbox"
        case .inTransit:
            return "car"
        case .delivered:
            return "checkmark.circle.fill"
        case .failed:
            return "xmark.circle.fill"
        }
    }
    
    var formattedTimeWindow: String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        let start = formatter.string(from: timeWindowStart)
        let end = formatter.string(from: timeWindowEnd)
        return "\(start) - \(end)"
    }
    
    var isLate: Bool {
        guard let completed = completedAt else { return false }
        return completed > timeWindowEnd
    }
    
    var delayMinutes: Int? {
        guard let completed = completedAt, isLate else { return nil }
        return Int((completed.timeIntervalSince(timeWindowEnd)) / 60)
    }
    
    var formattedWeight: String {
        guard let w = weight else { return "N/A" }
        return String(format: "%.1f kg", w)
    }
    
    var formattedVolume: String {
        guard let v = volume else { return "N/A" }
        return String(format: "%.2f m³", v)
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

// MARK: - Route Response Models

struct RoutesResponse: Codable {
    let success: Bool
    let data: [Route]
    let total: Int?
    let analytics: RouteAnalyticsSummary?
}

struct RouteDetailResponse: Codable {
    let success: Bool
    let data: Route
}

struct RouteAnalyticsSummary: Codable {
    let totalRoutes: Int
    let completedRoutes: Int
    let activeRoutes: Int
    let plannedRoutes: Int
    let completionRate: Double
    let totalDrops: Int
    let completedDrops: Int
    let dropCompletionRate: Double
}

// MARK: - Drop Update Request

struct DropUpdateRequest: Codable {
    let dropId: String
    let status: String
    let latitude: Double?
    let longitude: Double?
    let proofOfDelivery: String?
    let failureReason: String?
    let completedAt: Date?
}

// MARK: - Route Issue Report

struct RouteIssueReport: Codable {
    let routeId: String
    let issueType: String
    let description: String
    let reportedAt: Date
}

enum RouteIssueType: String, CaseIterable {
    case customerNotAvailable = "customer_not_available"
    case addressIncorrect = "address_incorrect"
    case vehicleIssue = "vehicle_issue"
    case trafficDelay = "traffic_delay"
    case weatherDelay = "weather_delay"
    case itemDamaged = "item_damaged"
    case other = "other"
    
    var displayName: String {
        switch self {
        case .customerNotAvailable:
            return "Customer Not Available"
        case .addressIncorrect:
            return "Address Incorrect"
        case .vehicleIssue:
            return "Vehicle Issue"
        case .trafficDelay:
            return "Traffic Delay"
        case .weatherDelay:
            return "Weather Delay"
        case .itemDamaged:
            return "Item Damaged"
        case .other:
            return "Other"
        }
    }
}

