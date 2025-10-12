import Foundation

class ScheduleService {
    static let shared = ScheduleService()
    private let networkService = NetworkService.shared
    
    private init() {}
    
    // MARK: - Fetch Schedule Stats
    
    func fetchScheduleStats() async throws -> ScheduleStats {
        let response: ScheduleStatsResponse = try await networkService.request(
            endpoint: "/api/driver/schedule/stats",
            method: "GET"
        )
        
        guard response.success else {
            throw NetworkError.serverError("Failed to fetch schedule stats")
        }
        
        return response.data
    }
    
    // MARK: - Fetch Schedule Jobs
    
    func fetchScheduleJobs() async throws -> ScheduleJobsData {
        let response: ScheduleJobsResponse = try await networkService.request(
            endpoint: "/api/driver/schedule/jobs",
            method: "GET"
        )
        
        guard response.success else {
            throw NetworkError.serverError("Failed to fetch schedule jobs")
        }
        
        return response.data
    }
}

