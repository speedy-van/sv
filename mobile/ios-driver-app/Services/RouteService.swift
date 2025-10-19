import Foundation

// MARK: - Route Service (ENHANCED)

class RouteService {
    static let shared = RouteService()
    private let network = NetworkService.shared
    
    private init() {}
    
    // MARK: - Fetch Routes
    
    /// Fetch all routes for the driver with optional filters
    func fetchRoutes(
        status: RouteStatus? = nil,
        includeAnalytics: Bool = false
    ) async throws -> [Route] {
        struct RoutesResponse: Codable {
            let success: Bool
            let data: [Route]
            let analytics: RouteAnalytics?
        }
        
        var endpoint = APIEndpoint.routes
        var queryParams: [String: String] = [:]
        
        if let status = status {
            queryParams["status"] = status.rawValue
        }
        if includeAnalytics {
            queryParams["includeAnalytics"] = "true"
        }
        
        let response: RoutesResponse = try await network.request(endpoint, queryParams: queryParams)
        return response.data
    }
    
    // MARK: - Fetch Route Details
    
    /// Fetch detailed information for a specific route
    func fetchRouteDetails(routeId: String) async throws -> Route {
        struct RouteDetailResponse: Codable {
            let success: Bool
            let data: Route
        }
        
        let response: RouteDetailResponse = try await network.request(.routeDetail(routeId))
        return response.data
    }
    
    // MARK: - Accept Route
    
    /// Accept a route assignment
    func acceptRoute(routeId: String) async throws -> Route {
        struct RouteDetailResponse: Codable {
            let success: Bool
            let data: Route
            let message: String?
        }
        
        let response: RouteDetailResponse = try await network.request(
            .acceptRoute(routeId),
            method: .post
        )
        
        return response.data
    }
    
    // MARK: - Decline Route
    
    /// Decline a route assignment with reason
    func declineRoute(routeId: String, reason: String) async throws {
        struct DeclineRequest: Codable {
            let reason: String
        }
        
        struct EmptyResponse: Codable {
            let success: Bool
            let message: String?
        }
        
        let _: EmptyResponse = try await network.request(
            .declineRoute(routeId),
            method: .post,
            body: DeclineRequest(reason: reason)
        )
    }
    
    // MARK: - Complete Drop
    
    /// Mark a drop as completed or failed
    func completeDrop(
        routeId: String,
        dropId: String,
        status: DropStatus,
        latitude: Double?,
        longitude: Double?,
        proofOfDelivery: String?,
        failureReason: String?
    ) async throws -> Route {
        struct DropUpdateRequest: Codable {
            let dropId: String
            let status: String
            let latitude: Double?
            let longitude: Double?
            let proofOfDelivery: String?
            let failureReason: String?
            let completedAt: Date
        }
        
        struct RouteDetailResponse: Codable {
            let success: Bool
            let data: Route
        }
        
        let updateRequest = DropUpdateRequest(
            dropId: dropId,
            status: status.rawValue,
            latitude: latitude,
            longitude: longitude,
            proofOfDelivery: proofOfDelivery,
            failureReason: failureReason,
            completedAt: Date()
        )
        
        let response: RouteDetailResponse = try await network.request(
            .completeRouteDrop(routeId),
            method: .post,
            body: updateRequest
        )
        
        return response.data
    }
    
    // MARK: - Get Active Route
    
    /// Get the currently active route for the driver
    func getActiveRoute() async throws -> Route? {
        let routes = try await fetchRoutes()
        return routes.first { $0.status == .active || $0.status == .assigned }
    }
    
    // MARK: - Start Route
    
    /// Start a route (change status to active)
    func startRoute(routeId: String) async throws -> Route {
        struct RouteDetailResponse: Codable {
            let success: Bool
            let data: Route
        }
        
        let response: RouteDetailResponse = try await network.request(
            .startRoute(routeId),
            method: .post
        )
        
        return response.data
    }
    
    // MARK: - Get Route Analytics
    
    /// Fetch analytics for a specific route
    func fetchRouteAnalytics(routeId: String) async throws -> RouteAnalytics {
        struct AnalyticsResponse: Codable {
            let success: Bool
            let data: RouteAnalytics
        }
        
        let response: AnalyticsResponse = try await network.request(.routeAnalytics(routeId))
        return response.data
    }
    
    // MARK: - Update Drop Status
    
    /// Update the status of a drop (for intermediate states)
    func updateDropStatus(
        routeId: String,
        dropId: String,
        status: DropStatus
    ) async throws -> Route {
        struct StatusUpdateRequest: Codable {
            let dropId: String
            let status: String
        }
        
        struct RouteDetailResponse: Codable {
            let success: Bool
            let data: Route
        }
        
        let updateRequest = StatusUpdateRequest(
            dropId: dropId,
            status: status.rawValue
        )
        
        let response: RouteDetailResponse = try await network.request(
            .updateDropStatus(routeId),
            method: .patch,
            body: updateRequest
        )
        
        return response.data
    }
    
    // MARK: - Get Route Earnings Preview
    
    /// Get earnings preview for a route
    func getRouteEarningsPreview(routeId: String) async throws -> RouteEarnings {
        struct EarningsResponse: Codable {
            let success: Bool
            let data: RouteEarnings
        }
        
        let response: EarningsResponse = try await network.request(.routeEarnings(routeId))
        return response.data
    }
    
    // MARK: - Report Route Issue
    
    /// Report an issue with a route
    func reportRouteIssue(
        routeId: String,
        issueType: String,
        description: String
    ) async throws {
        struct IssueRequest: Codable {
            let issueType: String
            let description: String
        }
        
        struct EmptyResponse: Codable {
            let success: Bool
        }
        
        let _: EmptyResponse = try await network.request(
            .reportRouteIssue(routeId),
            method: .post,
            body: IssueRequest(issueType: issueType, description: description)
        )
    }
}

// MARK: - Supporting Models

struct RouteAnalytics: Codable {
    let performanceMetrics: PerformanceMetrics
    let efficiencyScores: EfficiencyScores
    let timeline: [TimelineEvent]
    let dropStats: DropStatistics
}

struct PerformanceMetrics: Codable {
    let completionRate: Double
    let onTimeRate: Double
    let averageDelay: Double
    let totalDrops: Int
    let completedDrops: Int
    let failedDrops: Int
}

struct EfficiencyScores: Codable {
    let overall: Double
    let distance: Double
    let time: Double
    let dropDensity: Double
    let optimization: Double
    let rating: String
}

struct TimelineEvent: Codable {
    let time: Date
    let event: String
    let status: String
}

struct DropStatistics: Codable {
    let total: Int
    let byStatus: [String: Int]
    let totalValue: Double
    let averageValue: Double
    let totalWeight: Double
    let totalVolume: Double
}

struct RouteEarnings: Codable {
    let routeId: String
    let totalEarnings: Int // in pence
    let baseEarnings: Int
    let bonuses: Int
    let penalties: Int
    let multiDropBonus: Int
    let earningsPerHour: Double
    let earningsPerStop: Double
    let breakdown: EarningsBreakdown
}

struct EarningsBreakdown: Codable {
    let basePay: Int
    let distanceBonus: Int
    let efficiencyBonus: Int
    let completionBonus: Int
    let timeBonus: Int
    let penalties: Int
}

// MARK: - API Endpoint Extensions

extension APIEndpoint {
    static func startRoute(_ routeId: String) -> APIEndpoint {
        return .custom("/api/driver/routes/\(routeId)/start")
    }
    
    static func routeAnalytics(_ routeId: String) -> APIEndpoint {
        return .custom("/api/driver/routes/\(routeId)/analytics")
    }
    
    static func updateDropStatus(_ routeId: String) -> APIEndpoint {
        return .custom("/api/driver/routes/\(routeId)/update-drop-status")
    }
    
    static func routeEarnings(_ routeId: String) -> APIEndpoint {
        return .custom("/api/driver/routes/\(routeId)/earnings-preview")
    }
    
    static func reportRouteIssue(_ routeId: String) -> APIEndpoint {
        return .custom("/api/driver/routes/\(routeId)/report-issue")
    }
}

