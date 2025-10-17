import Foundation
import SwiftUI
import Combine

@MainActor
class RoutesViewModel: ObservableObject {
    @Published var routes: [Route] = []
    @Published var activeRoute: Route?
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let routeService = RouteService.shared
    private let pusherService = PusherService.shared
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        setupPusherListeners()
    }
    
    // MARK: - Pusher Integration
    
    private func setupPusherListeners() {
        // Listen for route-matched events
        NotificationCenter.default.publisher(for: NSNotification.Name("RouteMatched"))
            .sink { [weak self] notification in
                guard let self = self else { return }
                Task {
                    await self.fetchRoutes()
                }
            }
            .store(in: &cancellables)
        
        // Listen for route-removed events
        NotificationCenter.default.publisher(for: NSNotification.Name("RouteRemoved"))
            .sink { [weak self] notification in
                guard let self = self,
                      let routeId = notification.userInfo?["routeId"] as? String else { return }
                
                // Remove route from list immediately
                self.routes.removeAll { $0.id == routeId }
                
                if self.activeRoute?.id == routeId {
                    self.activeRoute = nil
                }
            }
            .store(in: &cancellables)
    }
    
    // MARK: - Fetch Routes
    
    func fetchRoutes() async {
        isLoading = true
        errorMessage = nil
        
        do {
            routes = try await routeService.fetchRoutes()
            activeRoute = routes.first { $0.status == .active || $0.status == .assigned }
        } catch {
            errorMessage = error.localizedDescription
            print("❌ Error fetching routes: \(error)")
        }
        
        isLoading = false
    }
    
    // MARK: - Fetch Route Details
    
    func fetchRouteDetails(routeId: String) async -> Route? {
        do {
            return try await routeService.fetchRouteDetails(routeId: routeId)
        } catch {
            errorMessage = error.localizedDescription
            print("❌ Error fetching route details: \(error)")
            return nil
        }
    }
    
    // MARK: - Accept Route
    
    func acceptRoute(_ route: Route) async -> Bool {
        isLoading = true
        errorMessage = nil
        
        do {
            let updatedRoute = try await routeService.acceptRoute(routeId: route.id)
            
            // Update routes list
            if let index = routes.firstIndex(where: { $0.id == route.id }) {
                routes[index] = updatedRoute
            }
            
            activeRoute = updatedRoute
            isLoading = false
            return true
        } catch {
            errorMessage = "Failed to accept route: \(error.localizedDescription)"
            print("❌ Error accepting route: \(error)")
            isLoading = false
            return false
        }
    }
    
    // MARK: - Decline Route
    
    func declineRoute(_ route: Route, reason: String) async -> Bool {
        isLoading = true
        errorMessage = nil
        
        do {
            try await routeService.declineRoute(routeId: route.id, reason: reason)
            
            // Remove from routes list
            routes.removeAll { $0.id == route.id }
            
            if activeRoute?.id == route.id {
                activeRoute = nil
            }
            
            isLoading = false
            return true
        } catch {
            errorMessage = "Failed to decline route: \(error.localizedDescription)"
            print("❌ Error declining route: \(error)")
            isLoading = false
            return false
        }
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
    ) async -> Bool {
        isLoading = true
        errorMessage = nil
        
        do {
            let updatedRoute = try await routeService.completeDrop(
                routeId: routeId,
                dropId: dropId,
                status: status,
                latitude: latitude,
                longitude: longitude,
                proofOfDelivery: proofOfDelivery,
                failureReason: failureReason
            )
            
            // Update routes list
            if let index = routes.firstIndex(where: { $0.id == routeId }) {
                routes[index] = updatedRoute
            }
            
            // Update active route if needed
            if activeRoute?.id == routeId {
                activeRoute = updatedRoute
            }
            
            isLoading = false
            return true
        } catch {
            errorMessage = "Failed to complete drop: \(error.localizedDescription)"
            print("❌ Error completing drop: \(error)")
            isLoading = false
            return false
        }
    }
    
    // MARK: - Get Next Drop
    
    func getNextDrop(for route: Route) -> Drop? {
        return route.drops.first { !$0.isCompleted }
    }
    
    // MARK: - Get Current Drop Index
    
    func getCurrentDropIndex(for route: Route) -> Int {
        return route.drops.filter { $0.isCompleted }.count
    }
}

