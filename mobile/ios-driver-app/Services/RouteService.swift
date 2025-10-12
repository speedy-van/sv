import Foundation

class RouteService {
    static let shared = RouteService()
    private let networkService = NetworkService.shared
    
    private init() {}
    
    // MARK: - Fetch Routes
    
    func fetchRoutes() async throws -> [Route] {
        let response: RoutesResponse = try await networkService.request(
            endpoint: "/api/driver/routes",
            method: "GET"
        )
        
        guard response.success else {
            throw NetworkError.serverError("Failed to fetch routes")
        }
        
        return response.data
    }
    
    // MARK: - Fetch Route Details
    
    func fetchRouteDetails(routeId: String) async throws -> Route {
        let response: RouteDetailResponse = try await networkService.request(
            endpoint: "/api/driver/routes/\(routeId)",
            method: "GET"
        )
        
        guard response.success else {
            throw NetworkError.serverError("Failed to fetch route details")
        }
        
        return response.data
    }
    
    // MARK: - Accept Route
    
    func acceptRoute(routeId: String) async throws -> Route {
        let response: RouteDetailResponse = try await networkService.request(
            endpoint: "/api/driver/routes/\(routeId)/accept",
            method: "POST",
            body: EmptyBody()
        )
        
        guard response.success else {
            throw NetworkError.serverError("Failed to accept route")
        }
        
        return response.data
    }
    
    // MARK: - Decline Route
    
    func declineRoute(routeId: String, reason: String) async throws {
        struct DeclineRequest: Codable {
            let reason: String
        }
        
        let _: RouteDetailResponse = try await networkService.request(
            endpoint: "/api/driver/routes/\(routeId)/decline",
            method: "POST",
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
        let updateRequest = DropUpdateRequest(
            status: status,
            latitude: latitude,
            longitude: longitude,
            proofOfDelivery: proofOfDelivery,
            failureReason: failureReason,
            completedAt: Date()
        )
        
        let response: RouteDetailResponse = try await networkService.request(
            endpoint: "/api/driver/routes/\(routeId)/complete-drop",
            method: "POST",
            body: updateRequest
        )
        
        guard response.success else {
            throw NetworkError.serverError("Failed to complete drop")
        }
        
        return response.data
    }
    
    // MARK: - Get Active Route
    
    func getActiveRoute() async throws -> Route? {
        let routes = try await fetchRoutes()
        return routes.first { $0.status == .active || $0.status == .assigned }
    }
}

// MARK: - Empty Body Helper

struct EmptyBody: Codable {}

