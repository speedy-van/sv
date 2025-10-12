import SwiftUI

struct ScheduleView: View {
    @StateObject private var viewModel = ScheduleViewModel()
    @State private var selectedTab = 0
    
    var body: some View {
        NavigationView {
            ZStack {
                if viewModel.isLoading && viewModel.scheduleStats == nil {
                    VStack(spacing: 20) {
                        ProgressView()
                        Text("Loading schedule...")
                            .foregroundColor(.secondary)
                    }
                } else {
                    ScrollView {
                        VStack(spacing: 20) {
                            // Stats Cards
                            if let stats = viewModel.scheduleStats {
                                VStack(spacing: 12) {
                                    HStack(spacing: 12) {
                                        StatsCard(
                                            title: "Today's Jobs",
                                            value: "\(stats.todayJobs)",
                                            subtitle: "Scheduled",
                                            icon: "calendar",
                                            color: .orange
                                        )
                                        
                                        StatsCard(
                                            title: "This Week",
                                            value: "\(stats.weekJobs)",
                                            subtitle: "Jobs",
                                            icon: "calendar.badge.clock",
                                            color: .purple
                                        )
                                    }
                                    
                                    HStack(spacing: 12) {
                                        StatsCard(
                                            title: "Earnings",
                                            value: stats.formattedEarnings,
                                            subtitle: "This week",
                                            icon: "banknote.fill",
                                            color: .green
                                        )
                                        
                                        StatsCard(
                                            title: "Next Job",
                                            value: stats.nextJob?.formattedTime ?? "None",
                                            subtitle: stats.nextJob?.formattedDate ?? "scheduled",
                                            icon: "clock.fill",
                                            color: .blue
                                        )
                                    }
                                }
                                .padding(.horizontal)
                                
                                // Acceptance Rate Card
                                AcceptanceRateCard(
                                    rate: stats.acceptanceRate,
                                    declinedCount: stats.declinedJobsCount
                                )
                                .padding(.horizontal)
                            }
                            
                            // Tabs for Jobs
                            VStack(spacing: 0) {
                                // Custom Tab Selector
                                HStack(spacing: 0) {
                                    TabButton(
                                        title: "Upcoming",
                                        count: viewModel.upcomingJobs.count,
                                        isSelected: selectedTab == 0
                                    ) {
                                        selectedTab = 0
                                    }
                                    
                                    TabButton(
                                        title: "Past",
                                        count: viewModel.pastJobs.count,
                                        isSelected: selectedTab == 1
                                    ) {
                                        selectedTab = 1
                                    }
                                    
                                    TabButton(
                                        title: "Declined",
                                        count: viewModel.declinedJobs.count,
                                        isSelected: selectedTab == 2
                                    ) {
                                        selectedTab = 2
                                    }
                                }
                                .padding(.horizontal)
                                
                                Divider()
                                
                                // Tab Content
                                VStack(spacing: 12) {
                                    if selectedTab == 0 {
                                        JobsList(jobs: viewModel.upcomingJobs, emptyMessage: "No upcoming jobs")
                                    } else if selectedTab == 1 {
                                        JobsList(jobs: viewModel.pastJobs, emptyMessage: "No past jobs", isPast: true)
                                    } else {
                                        DeclinedJobsList(jobs: viewModel.declinedJobs)
                                    }
                                }
                                .padding()
                            }
                            .background(Color(.systemBackground))
                            .cornerRadius(12)
                            .shadow(color: Color.black.opacity(0.1), radius: 8, x: 0, y: 2)
                            .padding(.horizontal)
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
            .navigationTitle("My Schedule")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        Task {
                            await viewModel.refresh()
                        }
                    } label: {
                        Image(systemName: "arrow.clockwise")
                    }
                    .disabled(viewModel.isLoading)
                }
            }
            .task {
                await viewModel.fetchScheduleData()
            }
            .refreshable {
                await viewModel.refresh()
            }
        }
    }
}

// MARK: - Supporting Views

struct StatsCard: View {
    let title: String
    let value: String
    let subtitle: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .font(.system(size: 14))
                    .foregroundColor(color)
                
                Text(title)
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
            }
            
            Text(value)
                .font(.system(size: 20, weight: .bold))
            
            Text(subtitle)
                .font(.system(size: 11))
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(10)
    }
}

struct AcceptanceRateCard: View {
    let rate: Double
    let declinedCount: Int
    
    var rateColor: Color {
        if rate >= 80 {
            return .green
        } else if rate >= 60 {
            return .orange
        } else {
            return .red
        }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Acceptance Rate (30 days)")
                    .font(.system(size: 14, weight: .semibold))
                
                Spacer()
                
                Text(String(format: "%.1f%%", rate))
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(rateColor)
            }
            
            ProgressView(value: rate / 100)
                .tint(rateColor)
                .scaleEffect(x: 1, y: 2, anchor: .center)
            
            HStack {
                Image(systemName: "info.circle")
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
                
                Text("Declined \(declinedCount) jobs - Each reduces rate by 5%")
                    .font(.system(size: 11))
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 8, x: 0, y: 2)
    }
}

struct TabButton: View {
    let title: String
    let count: Int
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Text("\(title) (\(count))")
                    .font(.system(size: 14, weight: isSelected ? .semibold : .regular))
                    .foregroundColor(isSelected ? .brandPrimary : .secondary)
                
                if isSelected {
                    Rectangle()
                        .fill(Color.brandPrimary)
                        .frame(height: 2)
                } else {
                    Rectangle()
                        .fill(Color.clear)
                        .frame(height: 2)
                }
            }
        }
        .frame(maxWidth: .infinity)
    }
}

struct JobsList: View {
    let jobs: [ScheduledJob]
    let emptyMessage: String
    var isPast: Bool = false
    
    var body: some View {
        if jobs.isEmpty {
            VStack(spacing: 12) {
                Image(systemName: "calendar.badge.exclamationmark")
                    .font(.system(size: 40))
                    .foregroundColor(.gray)
                
                Text(emptyMessage)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 40)
        } else {
            ForEach(jobs) { job in
                ScheduledJobCard(job: job, isPast: isPast)
            }
        }
    }
}

struct DeclinedJobsList: View {
    let jobs: [ScheduledJob]
    
    var body: some View {
        if jobs.isEmpty {
            VStack(spacing: 12) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 40))
                    .foregroundColor(.green)
                
                Text("Great job!")
                    .font(.system(size: 16, weight: .semibold))
                
                Text("You haven't declined any jobs recently")
                    .font(.system(size: 14))
                    .foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 40)
        } else {
            ForEach(jobs) { job in
                DeclinedJobCard(job: job)
            }
        }
    }
}

struct ScheduledJobCard: View {
    let job: ScheduledJob
    var isPast: Bool = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                Text(job.reference)
                    .font(.system(size: 14, weight: .bold))
                
                Text(job.status.displayName)
                    .font(.system(size: 11, weight: .semibold))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(statusColor)
                    .foregroundColor(.white)
                    .cornerRadius(8)
                
                Spacer()
                
                Text(job.priority.displayName)
                    .font(.system(size: 11, weight: .semibold))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(priorityColor)
                    .foregroundColor(.white)
                    .cornerRadius(8)
            }
            
            // Date and Time
            HStack(spacing: 8) {
                Image(systemName: "calendar")
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
                
                Text("\(job.formattedDate) at \(job.formattedTime)")
                    .font(.system(size: 13))
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Text("\(job.duration) min")
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
            }
            
            // Addresses
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 8) {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.system(size: 12))
                        .foregroundColor(.green)
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Pickup")
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundColor(.secondary)
                        Text(job.pickupAddress)
                            .font(.system(size: 12))
                            .lineLimit(1)
                    }
                }
                
                HStack(spacing: 8) {
                    Image(systemName: "arrow.down.circle.fill")
                        .font(.system(size: 12))
                        .foregroundColor(.red)
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Dropoff")
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundColor(.secondary)
                        Text(job.dropoffAddress)
                            .font(.system(size: 12))
                            .lineLimit(1)
                    }
                }
            }
            
            // Customer and Items
            HStack {
                Text(job.customerName)
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
                
                Spacer()
                
                if !job.items.isEmpty {
                    Text(job.items.map { "\($0.name) (\($0.quantity))" }.joined(separator: ", "))
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(10)
        .opacity(isPast ? 0.7 : 1.0)
    }
    
    private var statusColor: Color {
        switch job.status {
        case .confirmed:
            return .blue
        case .inProgress:
            return .orange
        case .completed:
            return .green
        case .cancelled:
            return .red
        }
    }
    
    private var priorityColor: Color {
        switch job.priority {
        case .low:
            return .green
        case .medium:
            return .orange
        case .high:
            return .red
        }
    }
}

struct DeclinedJobCard: View {
    let job: ScheduledJob
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(job.reference)
                    .font(.system(size: 14, weight: .bold))
                
                Text("DECLINED")
                    .font(.system(size: 11, weight: .bold))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.red)
                    .foregroundColor(.white)
                    .cornerRadius(8)
                
                Spacer()
            }
            
            if let declinedAt = job.declinedAt {
                Text("Declined: \(formattedDate(declinedAt))")
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
            }
            
            Text("Scheduled: \(job.formattedDate) at \(job.formattedTime)")
                .font(.system(size: 12))
                .foregroundColor(.secondary)
            
            if let reason = job.reason {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Reason:")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(.secondary)
                    Text(reason)
                        .font(.system(size: 12))
                        .foregroundColor(.red)
                        .italic()
                }
            }
            
            HStack {
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 12))
                    .foregroundColor(.orange)
                
                Text("This decline reduced your acceptance rate by 5%")
                    .font(.system(size: 11))
                    .foregroundColor(.secondary)
            }
            .padding(8)
            .background(Color.orange.opacity(0.1))
            .cornerRadius(6)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(10)
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.red, lineWidth: 1)
        )
    }
    
    private func formattedDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

#Preview {
    ScheduleView()
}

