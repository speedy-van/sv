import Foundation

// MARK: - Schedule Models

struct ScheduleStats: Codable {
    let todayJobs: Int
    let weekJobs: Int
    let totalEarnings: Int // in pence
    let declinedJobsCount: Int
    let acceptanceRate: Double // 0-100
    let nextJob: ScheduledJob?
    
    var formattedEarnings: String {
        let pounds = Double(totalEarnings) / 100
        return "£\(String(format: "%.2f", pounds))"
    }
    
    var acceptanceRateColor: String {
        if acceptanceRate >= 80 {
            return "green"
        } else if acceptanceRate >= 60 {
            return "orange"
        } else {
            return "red"
        }
    }
}

struct ScheduledJob: Identifiable, Codable {
    let id: String
    let reference: String
    let scheduledAt: Date
    let status: ScheduleJobStatus
    let customerName: String
    let customerPhone: String
    let pickupAddress: String
    let dropoffAddress: String
    let items: [JobItem]
    let duration: Int // minutes
    let priority: JobPriority
    let earnings: Int? // in pence
    let declinedAt: Date?
    let reason: String?
    
    var formattedEarnings: String {
        guard let earnings = earnings else { return "N/A" }
        let pounds = Double(earnings) / 100
        return "£\(String(format: "%.2f", pounds))"
    }
    
    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE, MMM d"
        return formatter.string(from: scheduledAt)
    }
    
    var formattedTime: String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: scheduledAt)
    }
    
    var priorityColor: String {
        switch priority {
        case .low:
            return "green"
        case .medium:
            return "orange"
        case .high:
            return "red"
        }
    }
}

struct JobItem: Codable {
    let name: String
    let quantity: Int
}

enum ScheduleJobStatus: String, Codable {
    case confirmed = "confirmed"
    case inProgress = "in_progress"
    case completed = "completed"
    case cancelled = "cancelled"
    
    var displayName: String {
        switch self {
        case .confirmed:
            return "Confirmed"
        case .inProgress:
            return "In Progress"
        case .completed:
            return "Completed"
        case .cancelled:
            return "Cancelled"
        }
    }
}

enum JobPriority: String, Codable {
    case low = "low"
    case medium = "medium"
    case high = "high"
    
    var displayName: String {
        rawValue.capitalized
    }
}

// MARK: - Schedule Response

struct ScheduleStatsResponse: Codable {
    let success: Bool
    let data: ScheduleStats
}

struct ScheduleJobsResponse: Codable {
    let success: Bool
    let data: ScheduleJobsData
}

struct ScheduleJobsData: Codable {
    let upcoming: [ScheduledJob]
    let past: [ScheduledJob]
    let declined: [ScheduledJob]
}

