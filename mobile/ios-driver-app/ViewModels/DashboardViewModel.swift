import Foundation
import SwiftUI

@MainActor
class DashboardViewModel: ObservableObject {
    @Published var isOnline = false
    @Published var acceptingJobs = false
    @Published var locationConsent = false
    @Published var hasActiveOrders = false
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    @Published var todayEarnings: Double = 0
    @Published var todayJobs: Int = 0
    @Published var weeklyEarnings: Double = 0
    @Published var totalJobs: Int = 0
    @Published var averageRating: Double = 0
    
    private let network = NetworkService.shared
    private let jobService = JobService.shared
    
    // MARK: - Fetch Availability
    
    func fetchAvailability() async {
        isLoading = true
        errorMessage = nil
        
        do {
            let response: AvailabilityResponse = try await network.request(.availability)
            
            if response.success, let data = response.data {
                isOnline = data.isOnline
                acceptingJobs = data.acceptingJobs
                locationConsent = data.locationConsent
                hasActiveOrders = data.hasActiveOrders
            }
        } catch {
            errorMessage = "Failed to fetch availability: \(error.localizedDescription)"
            print("❌ \(errorMessage ?? "")")
        }
        
        isLoading = false
    }
    
    // MARK: - Update Availability
    
    func updateAvailability(isOnline: Bool) async {
        isLoading = true
        errorMessage = nil
        
        do {
            let request = AvailabilityUpdateRequest(
                isAvailable: isOnline,
                availabilityMode: isOnline ? "online" : "offline",
                locationConsent: isOnline ? true : nil,
                breakUntil: nil
            )
            
            let response: AvailabilityResponse = try await network.request(
                .updateAvailability,
                method: .put,
                body: request
            )
            
            if response.success, let data = response.data {
                self.isOnline = data.isOnline
                self.acceptingJobs = data.acceptingJobs
                self.locationConsent = data.locationConsent
                self.hasActiveOrders = data.hasActiveOrders
                
                print("✅ Availability updated: \(data.isOnline ? "Online" : "Offline")")
            } else if let error = response.error {
                errorMessage = error
            }
        } catch {
            errorMessage = "Failed to update availability: \(error.localizedDescription)"
            print("❌ \(errorMessage ?? "")")
        }
        
        isLoading = false
    }
    
    // MARK: - Fetch Stats
    
    func fetchStats() async {
        do {
            let profile: DriverProfileResponse = try await network.request(.profile)
            
            if let stats = profile.stats {
                totalJobs = stats.totalJobs
                averageRating = stats.averageRating
                weeklyEarnings = stats.totalEarnings
            }
            
            // Calculate today's stats from jobs
            await calculateTodayStats()
        } catch {
            print("❌ Failed to fetch stats: \(error.localizedDescription)")
        }
    }
    
    private func calculateTodayStats() async {
        do {
            let response = try await jobService.getJobs()
            
            let today = Calendar.current.startOfDay(for: Date())
            let todayJobs = response.data.jobs.filter { job in
                guard let scheduledAt = job.scheduledAt else { return false }
                let jobDate = Calendar.current.startOfDay(for: scheduledAt)
                return jobDate == today && job.status == .completed
            }
            
            self.todayJobs = todayJobs.count
            self.todayEarnings = todayJobs.reduce(0.0) { sum, job in
                sum + (Double(job.estimatedEarnings.replacingOccurrences(of: "£", with: "")) ?? 0)
            }
        } catch {
            print("❌ Failed to calculate today stats: \(error.localizedDescription)")
        }
    }
    
    // MARK: - Refresh Dashboard
    
    func refreshDashboard() async {
        await fetchAvailability()
        await fetchStats()
    }
}

