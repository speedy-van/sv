import Foundation

// MARK: - Driver Profile

struct DriverProfile: Codable {
    var name: String
    var email: String
    var phone: String?
    var address: String?
    var emergencyContact: String?
    var drivingLicense: String?
    var vehicleReg: String?
}

// MARK: - Notification Preferences

struct NotificationPreferences: Codable {
    var jobAlerts: Bool
    var pushNotifications: Bool
    var emailNotifications: Bool
    var smsNotifications: Bool
    var weeklyReports: Bool
    var marketingEmails: Bool
}

// MARK: - Vehicle Settings

struct VehicleSettings: Codable {
    var vehicleType: String
    var maxWeight: Int?
    var specialEquipment: [String]?
    var insuranceExpiry: Date?
    var motExpiry: Date?
}

// MARK: - Responses

struct ProfileResponse: Codable {
    let success: Bool
    let data: DriverProfile
}

struct NotificationPreferencesResponse: Codable {
    let success: Bool
    let data: NotificationPreferences
}

struct UpdateResponse: Codable {
    let success: Bool
    let message: String
}

