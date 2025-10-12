import Foundation

// MARK: - Earnings Models

struct EarningsData: Codable {
    let period: String
    let dateRange: DateRange
    let summary: EarningsSummary
    let earnings: [DriverEarning]
}

struct DateRange: Codable {
    let start: Date
    let end: Date
}

struct EarningsSummary: Codable {
    let totalEarnings: String // in pence as string
    let totalJobs: Int
    let totalTips: String // in pence as string
    let paidOutEarnings: String
    let pendingEarnings: String
    
    var formattedTotalEarnings: String {
        formatPence(totalEarnings)
    }
    
    var formattedTotalTips: String {
        formatPence(totalTips)
    }
    
    var formattedPaidOut: String {
        formatPence(paidOutEarnings)
    }
    
    var formattedPending: String {
        formatPence(pendingEarnings)
    }
    
    private func formatPence(_ penceString: String) -> String {
        guard let pence = Double(penceString) else { return "£0.00" }
        let pounds = pence / 100
        return "£\(String(format: "%.2f", pounds))"
    }
}

struct DriverEarning: Identifiable, Codable {
    let id: String
    let assignmentId: String
    let bookingReference: String
    let customerName: String
    let baseAmount: String // in pence
    let surgeAmount: String
    let tipAmount: String
    let netAmount: String
    let currency: String
    let calculatedAt: Date
    let paidOut: Bool
    let payoutId: String?
    
    var formattedBaseAmount: String {
        formatPence(baseAmount)
    }
    
    var formattedSurgeAmount: String {
        formatPence(surgeAmount)
    }
    
    var formattedTipAmount: String {
        formatPence(tipAmount)
    }
    
    var formattedNetAmount: String {
        formatPence(netAmount)
    }
    
    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: calculatedAt)
    }
    
    private func formatPence(_ penceString: String) -> String {
        guard let pence = Double(penceString) else { return "£0.00" }
        let pounds = pence / 100
        return "£\(String(format: "%.2f", pounds))"
    }
}

// MARK: - Earnings Response

struct EarningsResponse: Codable {
    let success: Bool
    let data: EarningsData
}

// MARK: - Period Enum

enum EarningsPeriod: String, CaseIterable {
    case today = "today"
    case week = "week"
    case month = "month"
    case all = "all"
    
    var displayName: String {
        switch self {
        case .today:
            return "Today"
        case .week:
            return "This Week"
        case .month:
            return "This Month"
        case .all:
            return "All Time"
        }
    }
}

