import Foundation

// MARK: - Route Service (UPDATED)

class RouteService {
    static let shared = RouteService()
    private let network = NetworkService.shared
    
    private init() {}
    
    // MARK: - Fetch Routes
    
    func fetchRoutes() async throws -> [Route] {
        struct RoutesResponse: Codable {
            let success: Bool
            let data: [Route]
        }
        
        let response: RoutesResponse = try await network.request(.routes)
        return response.data
    }
    
    // MARK: - Fetch Route Details
    
    func fetchRouteDetails(routeId: String) async throws -> Route {
        struct RouteDetailResponse: Codable {
            let success: Bool
            let data: Route
        }
        
        let response: RouteDetailResponse = try await network.request(.routeDetail(routeId))
        return response.data
    }
    
    // MARK: - Fetch Route Earnings
    
    func fetchRouteEarnings(routeId: String) async throws -> RouteEarningsResponse {
        let response: RouteEarningsResponse = try await network.request(.routeEarnings(routeId))
        return response
    }
    
    // MARK: - Accept Route
    
    func acceptRoute(routeId: String) async throws -> Route {
        struct RouteDetailResponse: Codable {
            let success: Bool
            let data: Route
        }
        
        let response: RouteDetailResponse = try await network.request(
            .acceptRoute(routeId),
            method: .post
        )
        
        return response.data
    }
    
    // MARK: - Decline Route
    
    func declineRoute(routeId: String, reason: String) async throws {
        struct DeclineRequest: Codable {
            let reason: String
        }
        
        struct EmptyResponse: Codable {
            let success: Bool
        }
        
        let _: EmptyResponse = try await network.request(
            .declineRoute(routeId),
            method: .post,
            body: DeclineRequest(reason: reason)
        )
    }
    
    // MARK: - Complete Drop
    
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
            let status: DropStatus
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
            status: status,
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
    
    func getActiveRoute() async throws -> Route? {
        let routes = try await fetchRoutes()
        return routes.first { $0.status == .active || $0.status == .assigned }
    }
}

// MARK: - Drop Status

enum DropStatus: String, Codable {
    case pending
    case completed
    case failed
}

