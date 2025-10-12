import SwiftUI

struct EarningsView: View {
    @StateObject private var viewModel = EarningsViewModel()
    
    var body: some View {
        NavigationView {
            ZStack {
                if viewModel.isLoading && viewModel.earningsData == nil {
                    VStack(spacing: 20) {
                        ProgressView()
                        Text("Loading earnings...")
                            .foregroundColor(.secondary)
                    }
                } else {
                    ScrollView {
                        VStack(spacing: 20) {
                            // Period Selector
                            PeriodSelector(selectedPeriod: $viewModel.selectedPeriod) { period in
                                Task {
                                    await viewModel.changePeriod(period)
                                }
                            }
                            .padding(.horizontal)
                            
                            // Summary Cards
                            if let summary = viewModel.earningsData?.summary {
                                VStack(spacing: 12) {
                                    // Total Earnings Card
                                    EarningsSummaryCard(
                                        title: "Total Earnings",
                                        value: summary.formattedTotalEarnings,
                                        subtitle: "\(summary.totalJobs) jobs completed",
                                        icon: "banknote.fill",
                                        color: .green
                                    )
                                    
                                    HStack(spacing: 12) {
                                        EarningsSummaryCard(
                                            title: "Tips",
                                            value: summary.formattedTotalTips,
                                            subtitle: "Total tips",
                                            icon: "gift.fill",
                                            color: .orange,
                                            compact: true
                                        )
                                        
                                        EarningsSummaryCard(
                                            title: "Paid Out",
                                            value: summary.formattedPaidOut,
                                            subtitle: "Completed",
                                            icon: "checkmark.circle.fill",
                                            color: .blue,
                                            compact: true
                                        )
                                    }
                                    
                                    EarningsSummaryCard(
                                        title: "Pending Earnings",
                                        value: summary.formattedPending,
                                        subtitle: "Awaiting payout",
                                        icon: "clock.fill",
                                        color: .purple
                                    )
                                }
                                .padding(.horizontal)
                            }
                            
                            // Earnings List
                            if let earnings = viewModel.earningsData?.earnings {
                                VStack(alignment: .leading, spacing: 12) {
                                    Text("Earnings History")
                                        .font(.system(size: 20, weight: .bold))
                                        .padding(.horizontal)
                                    
                                    if earnings.isEmpty {
                                        VStack(spacing: 12) {
                                            Image(systemName: "tray")
                                                .font(.system(size: 40))
                                                .foregroundColor(.gray)
                                            
                                            Text("No earnings yet")
                                                .font(.system(size: 16, weight: .medium))
                                                .foregroundColor(.secondary)
                                        }
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 40)
                                    } else {
                                        ForEach(earnings) { earning in
                                            EarningRowView(earning: earning)
                                                .padding(.horizontal)
                                        }
                                    }
                                }
                            }
                        }
                        .padding(.vertical)
                    }
                }
                
                // Error Message
                if let errorMessage = viewModel.errorMessage {
                    VStack {
                        Spacer()
                        Text(errorMessage)
                            .font(.system(size: 14))
                            .foregroundColor(.white)
                            .padding()
                            .background(Color.red)
                            .cornerRadius(10)
                            .padding()
                    }
                }
            }
            .navigationTitle("My Earnings")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        Task {
                            await viewModel.fetchEarnings()
                        }
                    } label: {
                        Image(systemName: "arrow.clockwise")
                    }
                    .disabled(viewModel.isLoading)
                }
            }
            .task {
                await viewModel.fetchEarnings()
            }
            .refreshable {
                await viewModel.fetchEarnings()
            }
        }
    }
}

// MARK: - Supporting Views

struct PeriodSelector: View {
    @Binding var selectedPeriod: EarningsPeriod
    let onSelect: (EarningsPeriod) -> Void
    
    var body: some View {
        HStack(spacing: 8) {
            ForEach(EarningsPeriod.allCases, id: \.self) { period in
                Button {
                    onSelect(period)
                } label: {
                    Text(period.displayName)
                        .font(.system(size: 13, weight: selectedPeriod == period ? .semibold : .regular))
                        .foregroundColor(selectedPeriod == period ? .white : .brandPrimary)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(selectedPeriod == period ? Color.brandPrimary : Color.brandPrimary.opacity(0.1))
                        .cornerRadius(20)
                }
            }
        }
    }
}

struct EarningsSummaryCard: View {
    let title: String
    let value: String
    let subtitle: String
    let icon: String
    let color: Color
    var compact: Bool = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: compact ? 4 : 8) {
            HStack {
                Image(systemName: icon)
                    .font(.system(size: compact ? 12 : 14))
                    .foregroundColor(color)
                
                Text(title)
                    .font(.system(size: compact ? 11 : 12))
                    .foregroundColor(.secondary)
            }
            
            Text(value)
                .font(.system(size: compact ? 18 : 24, weight: .bold))
                .foregroundColor(color)
            
            Text(subtitle)
                .font(.system(size: compact ? 10 : 11))
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(compact ? 12 : 16)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 8, x: 0, y: 2)
    }
}

struct EarningRowView: View {
    let earning: DriverEarning
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(earning.bookingReference)
                        .font(.system(size: 14, weight: .bold))
                    
                    Text(earning.customerName)
                        .font(.system(size: 12))
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text(earning.formattedNetAmount)
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(.green)
                    
                    HStack(spacing: 4) {
                        Image(systemName: earning.paidOut ? "checkmark.circle.fill" : "clock.fill")
                            .font(.system(size: 10))
                            .foregroundColor(earning.paidOut ? .green : .orange)
                        
                        Text(earning.paidOut ? "Paid" : "Pending")
                            .font(.system(size: 11))
                            .foregroundColor(earning.paidOut ? .green : .orange)
                    }
                }
            }
            
            // Earnings Breakdown
            HStack(spacing: 16) {
                EarningBreakdownItem(
                    label: "Base",
                    value: earning.formattedBaseAmount,
                    color: .blue
                )
                
                if Double(earning.surgeAmount) ?? 0 > 0 {
                    EarningBreakdownItem(
                        label: "Surge",
                        value: earning.formattedSurgeAmount,
                        color: .purple
                    )
                }
                
                if Double(earning.tipAmount) ?? 0 > 0 {
                    EarningBreakdownItem(
                        label: "Tip",
                        value: earning.formattedTipAmount,
                        color: .orange
                    )
                }
            }
            
            // Date
            Text(earning.formattedDate)
                .font(.system(size: 11))
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(10)
    }
}

struct EarningBreakdownItem: View {
    let label: String
    let value: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 2) {
            Text(label)
                .font(.system(size: 10))
                .foregroundColor(.secondary)
            
            Text(value)
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(color)
        }
    }
}

#Preview {
    EarningsView()
}

