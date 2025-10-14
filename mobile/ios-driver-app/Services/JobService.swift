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
    
    // MARK: - Start Job
    
    func startJob(id: String, latitude: Double? = nil, longitude: Double? = nil) async throws -> JobActionResponse {
        struct StartJobRequest: Codable {
            let latitude: Double?
            let longitude: Double?
        }
        
        let request = StartJobRequest(latitude: latitude, longitude: longitude)
        return try await network.request(.startJob(id), method: .post, body: request)
    }
    
    // MARK: - Complete Job
    
    func completeJob(
        id: String,
        latitude: Double? = nil,
        longitude: Double? = nil,
        proofOfDelivery: String? = nil,
        notes: String? = nil,
        signature: String? = nil
    ) async throws -> JobActionResponse {
        struct CompleteJobRequest: Codable {
            let latitude: Double?
            let longitude: Double?
            let proofOfDelivery: String?
            let notes: String?
            let signature: String?
        }
        
        let request = CompleteJobRequest(
            latitude: latitude,
            longitude: longitude,
            proofOfDelivery: proofOfDelivery,
            notes: notes,
            signature: signature
        )
        
        return try await network.request(.completeJob(id), method: .post, body: request)
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
    
    // MARK: - Get Active Jobs
    
    func getActiveJobs() async throws -> JobsResponse {
        return try await network.request(.activeJobs)
    }
    
    // MARK: - Get Available Jobs
    
    func getAvailableJobs() async throws -> JobsResponse {
        return try await network.request(.availableJobs)
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

