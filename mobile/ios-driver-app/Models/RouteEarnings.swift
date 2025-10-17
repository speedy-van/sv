import Foundation

// MARK: - Route Earnings Response

struct RouteEarningsResponse: Codable {
    let success: Bool
    let routeId: String
    let earnings: RouteEarnings
    let route: RouteInfo
    let metrics: EarningsMetrics
    let drops: [DropInfo]
    let calculatedAt: String
}

// MARK: - Route Earnings

struct RouteEarnings: Codable {
    let total: Int // in pence
    let formatted: String
    let currency: String
    let breakdown: [EarningsBreakdown]
}

// MARK: - Route Info

struct RouteInfo: Codable {
    let numberOfStops: Int
    let totalDistance: Double
    let totalDuration: Int
    let routeType: String
}

// MARK: - Earnings Metrics

struct EarningsMetrics: Codable {
    let earningsPerStop: Int
    let earningsPerMile: Int
    let earningsPerHour: Int
    let formattedPerStop: String
    let formattedPerMile: String
    let formattedPerHour: String
}

// MARK: - Drop Info

struct DropInfo: Codable {
    let id: String
    let sequence: Int?
    let pickupAddress: String
    let deliveryAddress: String
    let estimatedDuration: Int?
}

// MARK: - Earnings Breakdown

struct EarningsBreakdown: Codable {
    let baseFare: Int
    let perDropFee: Int
    let mileageFee: Int
    let timeFee: Int
    let urgencyMultiplier: Double
    let performanceMultiplier: Double
    let serviceTypeMultiplier: Double
    let bonuses: BonusesBreakdown
    let penalties: PenaltiesBreakdown
    let reimbursements: ReimbursementsBreakdown
    let subtotal: Int
    let grossEarnings: Int
    let helperShare: Int
    let netEarnings: Int
    let cappedNetEarnings: Int
    let capApplied: Bool
    let floorApplied: Bool
}

// MARK: - Bonuses Breakdown

struct BonusesBreakdown: Codable {
    let onTimeBonus: Int
    let multiDropBonus: Int
    let highRatingBonus: Int
    let adminBonus: Int
    let longDistanceBonus: Int
    let routeExcellence: Int
    let total: Int
}

// MARK: - Penalties Breakdown

struct PenaltiesBreakdown: Codable {
    let lateDelivery: Int
    let lowRating: Int
    let adminPenalty: Int
    let total: Int
}

// MARK: - Reimbursements Breakdown

struct ReimbursementsBreakdown: Codable {
    let tolls: Int
    let parking: Int
    let tollCosts: Int
    let parkingCosts: Int
    let total: Int
}

