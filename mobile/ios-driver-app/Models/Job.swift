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
    
    // New fields for enhanced job details
    var floorNumber: Int?
    var elevatorAvailable: Bool?
    var ulezWarning: ULEZWarning?
    var lezWarning: LEZWarning?
    var driverEarnings: DriverEarnings?
    var distanceMiles: Double?
    var durationMinutes: Int?
    var trafficInfo: TrafficInfo?
    var weatherInfo: WeatherInfo?
    var workersRequired: Int?
    
    // ✅ FIX #5: New fields for order routing system
    var orderType: String? // "single", "multi-drop", "return-journey"
    var eligibleForMultiDrop: Bool?
    var estimatedLoadPercentage: Double?
    var priorityLevel: Int? // 1-10
    var potentialSavings: Int? // in pence
    var multiDropDiscount: Int? // in pence
    
    // UI Helper computed properties
    var priorityColor: String {
        guard let priority = priorityLevel else { return "gray" }
        if priority >= 8 { return "red" }    // Very urgent
        if priority >= 6 { return "orange" } // Urgent
        return "green"                        // Normal
    }
    
    var priorityLabel: String {
        guard let priority = priorityLevel else { return "Normal" }
        if priority >= 8 { return "Very Urgent" }
        if priority >= 6 { return "Urgent" }
        return "Normal"
    }
    
    var orderTypeLabel: String {
        guard let type = orderType else { return "Single Order" }
        switch type {
        case "multi-drop": return "Multi-Drop Route"
        case "return-journey": return "Return Journey"
        default: return "Single Order"
        }
    }
    
    enum CodingKeys: String, CodingKey {
        case id, reference, customer, customerPhone, date, time, from, to, distance
        case vehicleType, items, estimatedEarnings, status, priority, duration, crew
        case pickupAddress, dropoffAddress, bookingItems, assignmentId, scheduledAt
        case floorNumber, elevatorAvailable, ulezWarning, lezWarning, driverEarnings
        case distanceMiles, durationMinutes, trafficInfo, weatherInfo, workersRequired
        case orderType, eligibleForMultiDrop, estimatedLoadPercentage, priorityLevel
        case potentialSavings, multiDropDiscount
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




// MARK: - Traffic Information

struct TrafficInfo: Codable {
    let level: TrafficLevel
    let delayMinutes: Int
    let description: String
    let lastUpdated: String
    
    enum TrafficLevel: String, Codable {
        case clear = "clear"
        case light = "light"
        case moderate = "moderate"
        case heavy = "heavy"
        case severe = "severe"
        
        var color: String {
            switch self {
            case .clear: return "green"
            case .light: return "yellow"
            case .moderate: return "orange"
            case .heavy: return "red"
            case .severe: return "purple"
            }
        }
        
        var icon: String {
            switch self {
            case .clear: return "checkmark.circle.fill"
            case .light: return "exclamationmark.circle.fill"
            case .moderate: return "exclamationmark.triangle.fill"
            case .heavy: return "exclamationmark.triangle.fill"
            case .severe: return "exclamationmark.octagon.fill"
            }
        }
        
        var displayName: String {
            switch self {
            case .clear: return "Clear"
            case .light: return "Light Traffic"
            case .moderate: return "Moderate Traffic"
            case .heavy: return "Heavy Traffic"
            case .severe: return "Severe Congestion"
            }
        }
    }
    
    var displayText: String {
        if delayMinutes > 0 {
            return "\(level.displayName) • +\(delayMinutes)min delay"
        }
        return level.displayName
    }
}

// MARK: - Weather Information

struct WeatherInfo: Codable {
    let condition: WeatherCondition
    let temperature: Double
    let description: String
    let windSpeed: Double?
    let precipitation: Double?
    let lastUpdated: String
    
    enum WeatherCondition: String, Codable {
        case clear = "clear"
        case partlyCloudy = "partly_cloudy"
        case cloudy = "cloudy"
        case rain = "rain"
        case heavyRain = "heavy_rain"
        case snow = "snow"
        case fog = "fog"
        case storm = "storm"
        
        var icon: String {
            switch self {
            case .clear: return "sun.max.fill"
            case .partlyCloudy: return "cloud.sun.fill"
            case .cloudy: return "cloud.fill"
            case .rain: return "cloud.rain.fill"
            case .heavyRain: return "cloud.heavyrain.fill"
            case .snow: return "cloud.snow.fill"
            case .fog: return "cloud.fog.fill"
            case .storm: return "cloud.bolt.rain.fill"
            }
        }
        
        var displayName: String {
            switch self {
            case .clear: return "Clear"
            case .partlyCloudy: return "Partly Cloudy"
            case .cloudy: return "Cloudy"
            case .rain: return "Rain"
            case .heavyRain: return "Heavy Rain"
            case .snow: return "Snow"
            case .fog: return "Fog"
            case .storm: return "Storm"
            }
        }
        
        var color: String {
            switch self {
            case .clear: return "yellow"
            case .partlyCloudy, .cloudy: return "gray"
            case .rain, .heavyRain: return "blue"
            case .snow: return "cyan"
            case .fog: return "gray"
            case .storm: return "purple"
            }
        }
    }
    
    var displayText: String {
        var text = "\(condition.displayName) • \(Int(temperature))°C"
        if let wind = windSpeed, wind > 0 {
            text += " • Wind \(Int(wind))mph"
        }
        if let precip = precipitation, precip > 0 {
            text += " • \(Int(precip))% rain"
        }
        return text
    }
}

// MARK: - ULEZ/LEZ Warnings

struct ULEZWarning: Codable {
    let inZone: Bool
    let charge: Double?
    let zones: [String]
    let message: String?
    
    var displayText: String {
        if inZone {
            if let charge = charge {
                return "ULEZ Charge: £\(String(format: "%.2f", charge))"
            }
            return "ULEZ Zone - Check vehicle compliance"
        }
        return "No ULEZ charges"
    }
}

struct LEZWarning: Codable {
    let inZone: Bool
    let charge: Double?
    let zones: [String]
    let message: String?
    
    var displayText: String {
        if inZone {
            if let charge = charge {
                return "LEZ Charge: £\(String(format: "%.2f", charge))"
            }
            return "LEZ Zone - Check vehicle compliance"
        }
        return "No LEZ charges"
    }
}

// MARK: - Driver Earnings

struct DriverEarnings: Codable {
    let baseAmount: Double
    let distanceAmount: Double
    let timeAmount: Double
    let bonuses: Double
    let penalties: Double
    let total: Double
    let breakdown: String?
    
    var displayTotal: String {
        return "£\(String(format: "%.2f", total))"
    }
    
    var detailedBreakdown: String {
        var parts: [String] = []
        parts.append("Base: £\(String(format: "%.2f", baseAmount))")
        parts.append("Distance: £\(String(format: "%.2f", distanceAmount))")
        parts.append("Time: £\(String(format: "%.2f", timeAmount))")
        if bonuses > 0 {
            parts.append("Bonuses: +£\(String(format: "%.2f", bonuses))")
        }
        if penalties > 0 {
            parts.append("Penalties: -£\(String(format: "%.2f", penalties))")
        }
        return parts.joined(separator: "\n")
    }
}

