import SwiftUI

struct JobsListView: View {
    @ObservedObject var viewModel: JobsViewModel
    @State private var selectedFilter: JobFilter = .all
    @State private var searchText = ""
    
    enum JobFilter: String, CaseIterable {
        case all = "All"
        case available = "Available"
        case assigned = "Assigned"
        case active = "Active"
        
        var icon: String {
            switch self {
            case .all: return "list.bullet"
            case .available: return "clock.fill"
            case .assigned: return "checkmark.circle.fill"
            case .active: return "shippingbox.fill"
            }
        }
    }
    
    var filteredJobs: [Job] {
        var jobs: [Job]
        
        switch selectedFilter {
        case .all:
            jobs = viewModel.jobs
        case .available:
            jobs = viewModel.availableJobs
        case .assigned:
            jobs = viewModel.assignedJobs
        case .active:
            jobs = viewModel.activeJobs
        }
        
        if !searchText.isEmpty {
            jobs = jobs.filter { job in
                job.reference.localizedCaseInsensitiveContains(searchText) ||
                job.customer.localizedCaseInsensitiveContains(searchText) ||
                job.from.localizedCaseInsensitiveContains(searchText) ||
                job.to.localizedCaseInsensitiveContains(searchText)
            }
        }
        
        return jobs
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Filter tabs
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(JobFilter.allCases, id: \.self) { filter in
                            FilterChip(
                                title: filter.rawValue,
                                icon: filter.icon,
                                isSelected: selectedFilter == filter,
                                count: countForFilter(filter)
                            ) {
                                selectedFilter = filter
                            }
                        }
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 10)
                }
                .background(Color(.systemBackground))
                
                Divider()
                
                // Jobs list
                if viewModel.isLoading && viewModel.jobs.isEmpty {
                    ProgressView("Loading jobs...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if filteredJobs.isEmpty {
                    EmptyStateView(
                        icon: "tray.fill",
                        title: "No Jobs",
                        message: searchText.isEmpty ? 
                            "No jobs available in this category" :
                            "No jobs match your search"
                    )
                } else {
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(filteredJobs) { job in
                                NavigationLink(destination: JobDetailView(job: job, viewModel: viewModel)) {
                                    JobCardView(job: job)
                                }
                                .buttonStyle(PlainButtonStyle())
                            }
                        }
                        .padding()
                    }
                    .refreshable {
                        await viewModel.fetchJobs()
                    }
                }
            }
            .navigationTitle("Jobs")
            .searchable(text: $searchText, prompt: "Search jobs...")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        Task {
                            await viewModel.fetchJobs()
                        }
                    } label: {
                        Image(systemName: "arrow.clockwise")
                    }
                }
            }
        }
        .task {
            if viewModel.jobs.isEmpty {
                await viewModel.fetchJobs()
            }
        }
    }
    
    private func countForFilter(_ filter: JobFilter) -> Int {
        switch filter {
        case .all: return viewModel.jobs.count
        case .available: return viewModel.availableJobs.count
        case .assigned: return viewModel.assignedJobs.count
        case .active: return viewModel.activeJobs.count
        }
    }
}

// MARK: - Filter Chip

struct FilterChip: View {
    let title: String
    let icon: String
    let isSelected: Bool
    let count: Int
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 14))
                
                Text(title)
                    .font(.system(size: 14, weight: .semibold))
                
                if count > 0 {
                    Text("\(count)")
                        .font(.system(size: 12, weight: .bold))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(isSelected ? Color.white.opacity(0.3) : Color.gray.opacity(0.2))
                        .cornerRadius(8)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(isSelected ? Color.brandPrimary : Color(.systemGray6))
            .foregroundColor(isSelected ? .white : .primary)
            .cornerRadius(20)
        }
    }
}

// MARK: - Empty State

struct EmptyStateView: View {
    let icon: String
    let title: String
    let message: String
    
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 60))
                .foregroundColor(.gray)
            
            Text(title)
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(.primary)
            
            Text(message)
                .font(.system(size: 14))
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

#Preview {
    JobsListView(viewModel: JobsViewModel())
}

