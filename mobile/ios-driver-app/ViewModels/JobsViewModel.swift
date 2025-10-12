import Foundation
import SwiftUI

@MainActor
class JobsViewModel: ObservableObject {
    @Published var jobs: [Job] = []
    @Published var availableJobs: [Job] = []
    @Published var assignedJobs: [Job] = []
    @Published var activeJobs: [Job] = []
    
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var selectedJob: Job?
    
    private let jobService = JobService.shared
    
    // MARK: - Fetch Jobs
    
    func fetchJobs() async {
        isLoading = true
        errorMessage = nil
        
        do {
            let response = try await jobService.getJobs()
            
            jobs = response.data.jobs
            
            // Separate jobs by status
            availableJobs = jobs.filter { $0.status == .available }
            assignedJobs = jobs.filter { 
                $0.status == .assigned || $0.status == .accepted 
            }
            activeJobs = jobs.filter {
                $0.status == .enRoute || 
                $0.status == .arrived || 
                $0.status == .loading || 
                $0.status == .inTransit || 
                $0.status == .unloading
            }
            
            print("✅ Fetched \(jobs.count) jobs (Available: \(availableJobs.count), Assigned: \(assignedJobs.count), Active: \(activeJobs.count))")
        } catch {
            errorMessage = "Failed to fetch jobs: \(error.localizedDescription)"
            print("❌ \(errorMessage ?? "")")
        }
        
        isLoading = false
    }
    
    // MARK: - Job Actions
    
    func acceptJob(_ job: Job) async -> Bool {
        isLoading = true
        errorMessage = nil
        
        do {
            let response = try await jobService.acceptJob(id: job.id, reason: "Accepted from iOS app")
            
            if response.success {
                print("✅ Job accepted: \(job.reference)")
                await fetchJobs() // Refresh list
                return true
            } else if let error = response.error {
                errorMessage = error
                return false
            }
        } catch {
            errorMessage = "Failed to accept job: \(error.localizedDescription)"
            print("❌ \(errorMessage ?? "")")
        }
        
        isLoading = false
        return false
    }
    
    func declineJob(_ job: Job, reason: String) async -> Bool {
        isLoading = true
        errorMessage = nil
        
        do {
            let response = try await jobService.declineJob(id: job.id, reason: reason)
            
            if response.success {
                print("✅ Job declined: \(job.reference)")
                await fetchJobs() // Refresh list
                return true
            } else if let error = response.error {
                errorMessage = error
                return false
            }
        } catch {
            errorMessage = "Failed to decline job: \(error.localizedDescription)"
            print("❌ \(errorMessage ?? "")")
        }
        
        isLoading = false
        return false
    }
    
    // MARK: - Job Detail
    
    func fetchJobDetail(id: String) async {
        do {
            selectedJob = try await jobService.getJobDetail(id: id)
        } catch {
            errorMessage = "Failed to fetch job details: \(error.localizedDescription)"
            print("❌ \(errorMessage ?? "")")
        }
    }
    
    // MARK: - Filter Jobs
    
    func filterJobs(by status: JobStatus) -> [Job] {
        return jobs.filter { $0.status == status }
    }
    
    func searchJobs(query: String) -> [Job] {
        guard !query.isEmpty else { return jobs }
        
        return jobs.filter { job in
            job.reference.localizedCaseInsensitiveContains(query) ||
            job.customer.localizedCaseInsensitiveContains(query) ||
            job.from.localizedCaseInsensitiveContains(query) ||
            job.to.localizedCaseInsensitiveContains(query)
        }
    }
}

