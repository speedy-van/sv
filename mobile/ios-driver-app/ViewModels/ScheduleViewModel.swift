import Foundation
import SwiftUI

@MainActor
class ScheduleViewModel: ObservableObject {
    @Published var scheduleStats: ScheduleStats?
    @Published var upcomingJobs: [ScheduledJob] = []
    @Published var pastJobs: [ScheduledJob] = []
    @Published var declinedJobs: [ScheduledJob] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let scheduleService = ScheduleService.shared
    
    // MARK: - Fetch Schedule Data
    
    func fetchScheduleData() async {
        isLoading = true
        errorMessage = nil
        
        do {
            async let stats = scheduleService.fetchScheduleStats()
            async let jobs = scheduleService.fetchScheduleJobs()
            
            scheduleStats = try await stats
            let jobsData = try await jobs
            
            upcomingJobs = jobsData.upcoming
            pastJobs = jobsData.past
            declinedJobs = jobsData.declined
            
        } catch {
            errorMessage = error.localizedDescription
            print("❌ Error fetching schedule data: \(error)")
        }
        
        isLoading = false
    }
    
    // MARK: - Refresh
    
    func refresh() async {
        await fetchScheduleData()
    }
}

