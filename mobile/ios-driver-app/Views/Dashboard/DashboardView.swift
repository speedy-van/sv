import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @EnvironmentObject var locationService: LocationService
    @StateObject private var dashboardViewModel = DashboardViewModel()
    @StateObject private var jobsViewModel = JobsViewModel()
    @State private var selectedTab = 0
    @State private var showingLogoutAlert = false
    
    var body: some View {
        TabView(selection: $selectedTab) {
            // Home Tab
            HomeTabView(
                dashboardViewModel: dashboardViewModel,
                jobsViewModel: jobsViewModel
            )
            .tabItem {
                Label("Home", systemImage: "house.fill")
            }
            .tag(0)
            
            // Routes Tab (Multi-Drop Routes)
            RoutesListView()
                .tabItem {
                    Label("Routes", systemImage: "map.fill")
                }
                .tag(1)
            
            // Schedule Tab
            ScheduleView()
                .tabItem {
                    Label("Schedule", systemImage: "calendar")
                }
                .tag(2)
            
            // Earnings Tab
            EarningsView()
                .tabItem {
                    Label("Earnings", systemImage: "banknote.fill")
                }
                .tag(3)
            
            // Settings Tab (includes Profile)
            SettingsView()
                .environmentObject(authViewModel)
                .tabItem {
                    Label("Settings", systemImage: "gear")
                }
                .tag(4)
        }
        .accentColor(.brandPrimary)
        .task {
            await dashboardViewModel.refreshDashboard()
            await jobsViewModel.fetchJobs()
        }
        .alert("Logout", isPresented: $showingLogoutAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Logout", role: .destructive) {
                Task {
                    await authViewModel.logout()
                }
            }
        } message: {
            Text("Are you sure you want to logout?")
        }
    }
}

// MARK: - Home Tab

struct HomeTabView: View {
    @ObservedObject var dashboardViewModel: DashboardViewModel
    @ObservedObject var jobsViewModel: JobsViewModel
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Availability toggle
                    AvailabilityToggleView(viewModel: dashboardViewModel)
                        .padding(.horizontal)
                        .padding(.top)
                    
                    // Stats cards
                    VStack(spacing: 15) {
                        HStack(spacing: 15) {
                            StatsCardView(
                                title: "Today",
                                value: "£\(String(format: "%.2f", dashboardViewModel.todayEarnings))",
                                subtitle: "\(dashboardViewModel.todayJobs) jobs",
                                icon: "banknote.fill",
                                color: .green
                            )
                            
                            StatsCardView(
                                title: "This Week",
                                value: "£\(String(format: "%.2f", dashboardViewModel.weeklyEarnings))",
                                subtitle: "\(dashboardViewModel.totalJobs) total jobs",
                                icon: "calendar",
                                color: .blue
                            )
                        }
                        
                        HStack(spacing: 15) {
                            StatsCardView(
                                title: "Rating",
                                value: String(format: "%.1f", dashboardViewModel.averageRating),
                                subtitle: "Average",
                                icon: "star.fill",
                                color: .yellow
                            )
                            
                            StatsCardView(
                                title: "Active Jobs",
                                value: "\(jobsViewModel.activeJobs.count)",
                                subtitle: "In progress",
                                icon: "shippingbox.fill",
                                color: .orange
                            )
                        }
                    }
                    .padding(.horizontal)
                    
                    // Quick Access Cards
                    VStack(spacing: 12) {
                        // Routes Quick Access
                        NavigationLink(destination: RoutesListView()) {
                            QuickAccessCard(
                                title: "Multi-Drop Routes",
                                subtitle: "View and manage your routes",
                                icon: "map.fill",
                                color: .blue
                            )
                        }
                        .buttonStyle(PlainButtonStyle())
                        
                        // Schedule Quick Access
                        NavigationLink(destination: ScheduleView()) {
                            QuickAccessCard(
                                title: "My Schedule",
                                subtitle: "View upcoming jobs",
                                icon: "calendar",
                                color: .purple
                            )
                        }
                        .buttonStyle(PlainButtonStyle())
                        
                        // Earnings Quick Access
                        NavigationLink(destination: EarningsView()) {
                            QuickAccessCard(
                                title: "Earnings",
                                subtitle: "Track your income",
                                icon: "banknote.fill",
                                color: .green
                            )
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                    .padding(.horizontal)
                    
                    // Active jobs section
                    if !jobsViewModel.activeJobs.isEmpty {
                        VStack(alignment: .leading, spacing: 15) {
                            Text("Active Jobs")
                                .font(.system(size: 20, weight: .bold))
                                .padding(.horizontal)
                            
                            ForEach(jobsViewModel.activeJobs.prefix(2)) { job in
                                NavigationLink(destination: JobDetailView(job: job, viewModel: jobsViewModel)) {
                                    JobCardView(job: job)
                                }
                                .buttonStyle(PlainButtonStyle())
                            }
                            .padding(.horizontal)
                        }
                    }
                }
                .padding(.bottom, 20)
            }
            .navigationTitle("Dashboard")
            .refreshable {
                await dashboardViewModel.refreshDashboard()
                await jobsViewModel.fetchJobs()
            }
        }
    }
}

// MARK: - Quick Access Card

struct QuickAccessCard: View {
    let title: String
    let subtitle: String
    let icon: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 24))
                .foregroundColor(color)
                .frame(width: 50, height: 50)
                .background(color.opacity(0.1))
                .cornerRadius(10)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 16, weight: .semibold))
                
                Text(subtitle)
                    .font(.system(size: 13))
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(.gray)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

#Preview {
    DashboardView()
        .environmentObject(AuthViewModel())
        .environmentObject(LocationService.shared)
}

