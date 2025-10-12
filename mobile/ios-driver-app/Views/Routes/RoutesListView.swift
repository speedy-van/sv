import SwiftUI

struct RoutesListView: View {
    @StateObject private var viewModel = RoutesViewModel()
    @State private var showingAcceptAlert = false
    @State private var selectedRoute: Route?
    
    var body: some View {
        NavigationView {
            ZStack {
                if viewModel.isLoading && viewModel.routes.isEmpty {
                    VStack(spacing: 20) {
                        ProgressView()
                        Text("Loading routes...")
                            .foregroundColor(.secondary)
                    }
                } else if viewModel.routes.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "map")
                            .font(.system(size: 60))
                            .foregroundColor(.gray)
                        
                        Text("No Routes Available")
                            .font(.system(size: 20, weight: .semibold))
                        
                        Text("Check back later for new route assignments")
                            .font(.system(size: 14))
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 40)
                        
                        Button {
                            Task {
                                await viewModel.fetchRoutes()
                            }
                        } label: {
                            Label("Refresh", systemImage: "arrow.clockwise")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(.white)
                                .padding(.horizontal, 24)
                                .padding(.vertical, 12)
                                .background(Color.brandPrimary)
                                .cornerRadius(10)
                        }
                    }
                } else {
                    ScrollView {
                        VStack(spacing: 16) {
                            // Active Route Section
                            if let activeRoute = viewModel.activeRoute {
                                VStack(alignment: .leading, spacing: 12) {
                                    HStack {
                                        Text("Active Route")
                                            .font(.system(size: 18, weight: .bold))
                                        
                                        Spacer()
                                        
                                        Image(systemName: "location.fill")
                                            .foregroundColor(.green)
                                    }
                                    .padding(.horizontal)
                                    
                                    NavigationLink(destination: RouteDetailView(route: activeRoute)) {
                                        RouteCardView(route: activeRoute)
                                            .padding(.horizontal)
                                    }
                                    .buttonStyle(PlainButtonStyle())
                                }
                                .padding(.vertical, 8)
                                .background(Color.green.opacity(0.1))
                                .cornerRadius(12)
                                .padding(.horizontal)
                            }
                            
                            // Available Routes Section
                            let availableRoutes = viewModel.routes.filter { 
                                $0.status == .pendingAssignment || ($0.status == .assigned && $0.id != viewModel.activeRoute?.id)
                            }
                            
                            if !availableRoutes.isEmpty {
                                VStack(alignment: .leading, spacing: 12) {
                                    Text("Available Routes")
                                        .font(.system(size: 18, weight: .bold))
                                        .padding(.horizontal)
                                    
                                    ForEach(availableRoutes) { route in
                                        VStack(spacing: 12) {
                                            RouteCardView(route: route)
                                            
                                            // Action Buttons
                                            HStack(spacing: 12) {
                                                Button {
                                                    selectedRoute = route
                                                    showingAcceptAlert = true
                                                } label: {
                                                    HStack {
                                                        Image(systemName: "checkmark.circle.fill")
                                                        Text("Accept Route")
                                                    }
                                                    .font(.system(size: 16, weight: .semibold))
                                                    .foregroundColor(.white)
                                                    .frame(maxWidth: .infinity)
                                                    .padding(.vertical, 12)
                                                    .background(Color.green)
                                                    .cornerRadius(10)
                                                }
                                                
                                                NavigationLink(destination: RouteDetailView(route: route)) {
                                                    HStack {
                                                        Image(systemName: "info.circle")
                                                        Text("Details")
                                                    }
                                                    .font(.system(size: 16, weight: .semibold))
                                                    .foregroundColor(.brandPrimary)
                                                    .frame(maxWidth: .infinity)
                                                    .padding(.vertical, 12)
                                                    .background(Color.brandPrimary.opacity(0.1))
                                                    .cornerRadius(10)
                                                }
                                                .buttonStyle(PlainButtonStyle())
                                            }
                                        }
                                        .padding(.horizontal)
                                    }
                                }
                            }
                            
                            // Completed Routes Section
                            let completedRoutes = viewModel.routes.filter { $0.status == .completed }
                            
                            if !completedRoutes.isEmpty {
                                VStack(alignment: .leading, spacing: 12) {
                                    Text("Completed Routes")
                                        .font(.system(size: 18, weight: .bold))
                                        .padding(.horizontal)
                                    
                                    ForEach(completedRoutes.prefix(5)) { route in
                                        NavigationLink(destination: RouteDetailView(route: route)) {
                                            RouteCardView(route: route)
                                                .opacity(0.7)
                                                .padding(.horizontal)
                                        }
                                        .buttonStyle(PlainButtonStyle())
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
            .navigationTitle("Routes")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        Task {
                            await viewModel.fetchRoutes()
                        }
                    } label: {
                        Image(systemName: "arrow.clockwise")
                    }
                    .disabled(viewModel.isLoading)
                }
            }
            .task {
                await viewModel.fetchRoutes()
            }
            .refreshable {
                await viewModel.fetchRoutes()
            }
            .alert("Accept Route", isPresented: $showingAcceptAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Accept") {
                    if let route = selectedRoute {
                        Task {
                            let success = await viewModel.acceptRoute(route)
                            if success {
                                // Navigate to route detail
                            }
                        }
                    }
                }
            } message: {
                Text("Do you want to accept this route with \(selectedRoute?.totalDrops ?? 0) stops?")
            }
        }
    }
}

#Preview {
    RoutesListView()
}

