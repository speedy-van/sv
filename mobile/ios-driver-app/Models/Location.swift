import Foundation
import CoreLocation

// MARK: - Location Models

struct LocationUpdate: Codable {
    let latitude: Double
    let longitude: Double
    let accuracy: Double?
    let timestamp: Date
    let bookingId: String?
    
    init(coordinate: CLLocationCoordinate2D, accuracy: Double? = nil, bookingId: String? = nil) {
        self.latitude = coordinate.latitude
        self.longitude = coordinate.longitude
        self.accuracy = accuracy
        self.timestamp = Date()
        self.bookingId = bookingId
    }
}

struct LocationUpdateRequest: Codable {
    let bookingId: String
    let latitude: Double
    let longitude: Double
    let accuracy: Double?
}

struct LocationUpdateResponse: Codable {
    let success: Bool
    let trackingPingId: String?
    let timestamp: String?
    let error: String?
}

// MARK: - Tracking Ping

struct TrackingPing: Codable, Identifiable {
    let id: String
    let bookingId: String
    let driverId: String
    let lat: Double
    let lng: Double
    let createdAt: Date?
    
    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: lat, longitude: lng)
    }
}

// MARK: - Tracking History

struct TrackingHistoryResponse: Codable {
    let success: Bool
    let data: [TrackingPing]
    let error: String?
}

// MARK: - Location Helper

struct LocationHelper {
    /// Calculate distance between two coordinates in miles
    static func distance(from: CLLocationCoordinate2D, to: CLLocationCoordinate2D) -> Double {
        let fromLocation = CLLocation(latitude: from.latitude, longitude: from.longitude)
        let toLocation = CLLocation(latitude: to.latitude, longitude: to.longitude)
        let distanceMeters = fromLocation.distance(from: toLocation)
        return distanceMeters * 0.000621371 // Convert meters to miles
    }
    
    /// Format distance for display
    static func formatDistance(_ miles: Double) -> String {
        if miles < 0.1 {
            return "< 0.1 miles"
        } else if miles < 10 {
            return String(format: "%.1f miles", miles)
        } else {
            return String(format: "%.0f miles", miles)
        }
    }
    
    /// Calculate estimated time of arrival
    static func estimateArrivalTime(distanceMiles: Double, averageSpeedMph: Double = 30.0) -> Date {
        let hours = distanceMiles / averageSpeedMph
        let seconds = hours * 3600
        return Date().addingTimeInterval(seconds)
    }
    
    /// Format ETA for display
    static func formatETA(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

// MARK: - Route Information

struct RouteInfo: Codable {
    let distance: Double // in miles
    let duration: TimeInterval // in seconds
    let steps: [RouteStep]?
    
    var durationFormatted: String {
        let minutes = Int(duration / 60)
        if minutes < 60 {
            return "\(minutes) min"
        } else {
            let hours = minutes / 60
            let mins = minutes % 60
            return "\(hours)h \(mins)m"
        }
    }
}

struct RouteStep: Codable {
    let instruction: String
    let distance: Double
    let duration: TimeInterval
}

