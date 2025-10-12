import Foundation
import SwiftUI

@MainActor
class EarningsViewModel: ObservableObject {
    @Published var earningsData: EarningsData?
    @Published var selectedPeriod: EarningsPeriod = .today
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let earningsService = EarningsService.shared
    
    // MARK: - Fetch Earnings
    
    func fetchEarnings() async {
        isLoading = true
        errorMessage = nil
        
        do {
            earningsData = try await earningsService.fetchEarnings(period: selectedPeriod)
        } catch {
            errorMessage = error.localizedDescription
            print("❌ Error fetching earnings: \(error)")
        }
        
        isLoading = false
    }
    
    // MARK: - Change Period
    
    func changePeriod(_ period: EarningsPeriod) async {
        selectedPeriod = period
        await fetchEarnings()
    }
}

