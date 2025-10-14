import Foundation

// MARK: - Schedule Service (UPDATED)

class ScheduleService {
    static let shared = ScheduleService()
    private let network = NetworkService.shared
    
    private init() {}
    
    // MARK: - Fetch Schedule
    
    func fetchSchedule() async throws -> ScheduleData {
        struct ScheduleResponse: Codable {
            let success: Bool
            let data: ScheduleData
        }
        
        let response: ScheduleResponse = try await network.request(.schedule)
        return response.data
    }
    
    // MARK: - Fetch Schedule Stats
    
    func fetchScheduleStats() async throws -> ScheduleStats {
        struct ScheduleStatsResponse: Codable {
            let success: Bool
            let data: ScheduleStats
        }
        
        let response: ScheduleStatsResponse = try await network.request(.scheduleStats)
        return response.data
    }
    
    // MARK: - Fetch Schedule Jobs
    
    func fetchScheduleJobs() async throws -> ScheduleJobsData {
        struct ScheduleJobsResponse: Codable {
            let success: Bool
            let data: ScheduleJobsData
        }
        
        let response: ScheduleJobsResponse = try await network.request(.scheduleJobs)
        return response.data
    }
    
    // MARK: - Export Schedule
    
    func exportSchedule(format: String = "pdf") async throws -> URL {
        struct ExportResponse: Codable {
            let success: Bool
            let url: String
        }
        
        let response: ExportResponse = try await network.request(.scheduleExport)
        guard let url = URL(string: response.url) else {
            throw ScheduleError.invalidExportURL
        }
        return url
    }
}

// MARK: - Schedule Error

enum ScheduleError: LocalizedError {
    case invalidExportURL
    case fetchFailed(String)
    
    var errorDescription: String? {
        switch self {
        case .invalidExportURL:
            return "Invalid export URL"
        case .fetchFailed(let reason):
            return "Failed to fetch schedule: \(reason)"
        }
    }
}

// MARK: - Schedule Data Models

struct ScheduleData: Codable {
    let jobs: [ScheduledJob]
    let stats: ScheduleStats
}

struct ScheduledJob: Codable, Identifiable {
    let id: String
    let date: Date
    let startTime: String?
    let endTime: String?
    let type: String
    let status: String
    let from: String
    let to: String
    let estimatedEarnings: Double
}

