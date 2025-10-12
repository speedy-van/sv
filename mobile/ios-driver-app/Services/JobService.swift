import Foundation

// MARK: - Job Service

class JobService {
    static let shared = JobService()
    private let network = NetworkService.shared
    
    private init() {}
    
    // MARK: - Get Jobs
    
    func getJobs() async throws -> JobsResponse {
        return try await network.request(.jobs)
    }
    
    // MARK: - Get Job Detail
    
    func getJobDetail(id: String) async throws -> Job {
        struct JobDetailResponse: Codable {
            let success: Bool
            let data: Job
        }
        
        let response: JobDetailResponse = try await network.request(.jobDetail(id))
        return response.data
    }
    
    // MARK: - Accept Job
    
    func acceptJob(id: String, reason: String? = nil) async throws -> JobActionResponse {
        let request = JobActionRequest(reason: reason)
        return try await network.request(.acceptJob(id), method: .post, body: request)
    }
    
    // MARK: - Decline Job
    
    func declineJob(id: String, reason: String? = nil) async throws -> JobActionResponse {
        let request = JobActionRequest(reason: reason)
        return try await network.request(.declineJob(id), method: .post, body: request)
    }
    
    // MARK: - Update Job Progress
    
    func updateProgress(
        jobId: String,
        step: JobProgressStep,
        notes: String? = nil,
        location: (latitude: Double, longitude: Double)? = nil
    ) async throws -> JobProgressResponse {
        let request = JobProgressRequest(
            step: step.rawValue,
            notes: notes,
            latitude: location?.latitude,
            longitude: location?.longitude
        )
        
        return try await network.request(
            .updateJobProgress(jobId),
            method: .put,
            body: request
        )
    }
}

// MARK: - Job Error

enum JobError: LocalizedError {
    case jobNotFound
    case cannotAccept(String)
    case cannotDecline(String)
    case progressUpdateFailed(String)
    
    var errorDescription: String? {
        switch self {
        case .jobNotFound:
            return "Job not found"
        case .cannotAccept(let reason):
            return "Cannot accept job: \(reason)"
        case .cannotDecline(let reason):
            return "Cannot decline job: \(reason)"
        case .progressUpdateFailed(let reason):
            return "Failed to update progress: \(reason)"
        }
    }
}

