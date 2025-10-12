import Foundation

class EarningsService {
    static let shared = EarningsService()
    private let networkService = NetworkService.shared
    
    private init() {}
    
    // MARK: - Fetch Earnings
    
    func fetchEarnings(period: EarningsPeriod) async throws -> EarningsData {
        let response: EarningsResponse = try await networkService.request(
            endpoint: "/api/driver/earnings?period=\(period.rawValue)",
            method: "GET"
        )
        
        guard response.success else {
            throw NetworkError.serverError("Failed to fetch earnings")
        }
        
        return response.data
    }
}

