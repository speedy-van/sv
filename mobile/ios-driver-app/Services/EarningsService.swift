import Foundation

// MARK: - Earnings Service (UPDATED)

class EarningsService {
    static let shared = EarningsService()
    private let network = NetworkService.shared
    
    private init() {}
    
    // MARK: - Fetch Earnings
    
    func fetchEarnings(period: EarningsPeriod = .week) async throws -> EarningsData {
        struct EarningsResponse: Codable {
            let success: Bool
            let data: EarningsData
        }
        
        // Note: Backend endpoint might accept query parameters
        // For now, using the base endpoint
        let response: EarningsResponse = try await network.request(.earnings)
        return response.data
    }
    
    // MARK: - Fetch Payouts
    
    func fetchPayouts() async throws -> [Payout] {
        struct PayoutsResponse: Codable {
            let success: Bool
            let data: [Payout]
        }
        
        let response: PayoutsResponse = try await network.request(.payouts)
        return response.data
    }
    
    // MARK: - Fetch Tips
    
    func fetchTips() async throws -> [Tip] {
        struct TipsResponse: Codable {
            let success: Bool
            let data: [Tip]
        }
        
        let response: TipsResponse = try await network.request(.tips)
        return response.data
    }
}

// MARK: - Earnings Period

enum EarningsPeriod: String, Codable {
    case today
    case week
    case month
    case year
}

// MARK: - Payout Model

struct Payout: Codable, Identifiable {
    let id: String
    let amount: Double
    let date: Date
    let status: String
    let method: String?
}

// MARK: - Tip Model

struct Tip: Codable, Identifiable {
    let id: String
    let amount: Double
    let date: Date
    let jobId: String?
    let customerName: String?
}

