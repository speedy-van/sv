import SwiftUI
import MapKit

struct RouteDetailView: View {
    let route: Route
    @StateObject private var viewModel = RoutesViewModel()
    @Environment(\.dismiss) private var dismiss
    
    @State private var showingCompleteDropAlert = false
    @State private var showingFailDropAlert = false
    @State private var selectedDrop: Drop?
    @State private var failureReason = ""
    @State private var proofOfDelivery = ""
    
    var currentDrop: Drop? {
        viewModel.getNextDrop(for: route)
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Route Summary Card
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text("Route Summary")
                            .font(.system(size: 20, weight: .bold))
                        
                        Spacer()
                        
                        Text(route.status.displayName)
                            .font(.system(size: 12, weight: .semibold))
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(statusBackgroundColor)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                    }
                    
                    // Progress
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text("\(route.completedDrops) of \(route.totalDrops) stops completed")
                                .font(.system(size: 14, weight: .medium))
                            
                            Spacer()
                            
                            Text("\(route.progressPercentage)%")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundColor(.brandPrimary)
                        }
                        
                        ProgressView(value: route.progress)
                            .tint(.brandPrimary)
                            .scaleEffect(x: 1, y: 2, anchor: .center)
                    }
                    
                    // Stats
                    HStack(spacing: 16) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Total Earnings")
                                .font(.system(size: 12))
                                .foregroundColor(.secondary)
                            Text(route.formattedTotalValue)
                                .font(.system(size: 18, weight: .bold))
                                .foregroundColor(.green)
                        }
                        
                        Spacer()
                        
                        VStack(alignment: .trailing, spacing: 4) {
                            Text("Est. Duration")
                                .font(.system(size: 12))
                                .foregroundColor(.secondary)
                            Text(route.formattedDuration)
                                .font(.system(size: 18, weight: .bold))
                        }
                    }
                }
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(12)
                .shadow(color: Color.black.opacity(0.1), radius: 8, x: 0, y: 2)
                .padding(.horizontal)
                
                // Current Drop (if active)
                if let currentDrop = currentDrop, route.status == .active || route.status == .assigned {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Current Stop")
                                .font(.system(size: 18, weight: .bold))
                            
                            Spacer()
                            
                            Text("Stop \(viewModel.getCurrentDropIndex(for: route) + 1) of \(route.totalDrops)")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundColor(.brandPrimary)
                        }
                        
                        DropCardView(drop: currentDrop, isCurrentDrop: true)
                        
                        // Action Buttons
                        VStack(spacing: 12) {
                            // Navigate Button
                            Button {
                                openMaps(for: currentDrop)
                            } label: {
                                HStack {
                                    Image(systemName: "map.fill")
                                    Text("Navigate")
                                }
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(Color.blue)
                                .cornerRadius(10)
                            }
                            
                            // Call Customer Button
                            if let phone = currentDrop.customerPhone {
                                Button {
                                    callCustomer(phone: phone)
                                } label: {
                                    HStack {
                                        Image(systemName: "phone.fill")
                                        Text("Call Customer")
                                    }
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 14)
                                    .background(Color.green)
                                    .cornerRadius(10)
                                }
                            }
                            
                            HStack(spacing: 12) {
                                // Complete Button
                                Button {
                                    selectedDrop = currentDrop
                                    showingCompleteDropAlert = true
                                } label: {
                                    HStack {
                                        Image(systemName: "checkmark.circle.fill")
                                        Text("Complete")
                                    }
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 14)
                                    .background(Color.green)
                                    .cornerRadius(10)
                                }
                                
                                // Failed Button
                                Button {
                                    selectedDrop = currentDrop
                                    showingFailDropAlert = true
                                } label: {
                                    HStack {
                                        Image(systemName: "xmark.circle.fill")
                                        Text("Failed")
                                    }
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 14)
                                    .background(Color.red)
                                    .cornerRadius(10)
                                }
                            }
                        }
                    }
                    .padding()
                    .background(Color.brandPrimary.opacity(0.05))
                    .cornerRadius(12)
                    .padding(.horizontal)
                }
                
                // All Drops List
                VStack(alignment: .leading, spacing: 12) {
                    Text("All Stops (\(route.totalDrops))")
                        .font(.system(size: 18, weight: .bold))
                        .padding(.horizontal)
                    
                    ForEach(Array(route.drops.enumerated()), id: \.element.id) { index, drop in
                        DropCardView(
                            drop: drop,
                            isCurrentDrop: drop.id == currentDrop?.id
                        )
                        .padding(.horizontal)
                    }
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Route Details")
        .navigationBarTitleDisplayMode(.inline)
        .alert("Complete Drop", isPresented: $showingCompleteDropAlert) {
            TextField("Proof of Delivery (optional)", text: $proofOfDelivery)
            Button("Cancel", role: .cancel) {}
            Button("Complete") {
                Task {
                    await completeDrop(status: .delivered)
                }
            }
        } message: {
            Text("Mark this drop as delivered?")
        }
        .alert("Failed Drop", isPresented: $showingFailDropAlert) {
            TextField("Reason for failure", text: $failureReason)
            Button("Cancel", role: .cancel) {}
            Button("Mark as Failed", role: .destructive) {
                Task {
                    await completeDrop(status: .failed)
                }
            }
        } message: {
            Text("Why did this delivery fail?")
        }
    }
    
    private var statusBackgroundColor: Color {
        switch route.status {
        case .pendingAssignment:
            return .blue
        case .assigned:
            return .orange
        case .active:
            return .green
        case .completed:
            return .gray
        case .failed:
            return .red
        }
    }
    
    private func completeDrop(status: DropStatus) async {
        guard let drop = selectedDrop else { return }
        
        let success = await viewModel.completeDrop(
            routeId: route.id,
            dropId: drop.id,
            status: status,
            latitude: nil, // TODO: Get current location
            longitude: nil,
            proofOfDelivery: proofOfDelivery.isEmpty ? nil : proofOfDelivery,
            failureReason: status == .failed ? failureReason : nil
        )
        
        if success {
            proofOfDelivery = ""
            failureReason = ""
            
            // If all drops completed, navigate back
            if route.completedDrops + 1 >= route.totalDrops {
                dismiss()
            }
        }
    }
    
    private func openMaps(for drop: Drop) {
        guard let lat = drop.deliveryLatitude,
              let lng = drop.deliveryLongitude else { return }
        
        let coordinate = CLLocationCoordinate2D(latitude: lat, longitude: lng)
        let placemark = MKPlacemark(coordinate: coordinate)
        let mapItem = MKMapItem(placemark: placemark)
        mapItem.name = drop.deliveryAddress
        
        mapItem.openInMaps(launchOptions: [
            MKLaunchOptionsDirectionsModeKey: MKLaunchOptionsDirectionsModeDriving
        ])
    }
    
    private func callCustomer(phone: String) {
        let cleanedPhone = phone.replacingOccurrences(of: " ", with: "")
        if let url = URL(string: "tel://\(cleanedPhone)") {
            UIApplication.shared.open(url)
        }
    }
}

#Preview {
    NavigationView {
        RouteDetailView(route: Route(
            id: "route123",
            status: .active,
            serviceTier: "Standard",
            driverId: "driver1",
            totalDrops: 3,
            completedDrops: 1,
            estimatedDuration: 120,
            totalDistance: 15.5,
            totalValue: 8500,
            timeWindowStart: Date(),
            timeWindowEnd: Date().addingTimeInterval(7200),
            optimizedSequence: [1, 2, 3],
            createdAt: Date(),
            drops: []
        ))
    }
}

