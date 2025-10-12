import SwiftUI

struct AvailabilityToggleView: View {
    @ObservedObject var viewModel: DashboardViewModel
    @State private var showingConfirmation = false
    @State private var pendingStatus = false
    
    var body: some View {
        VStack(spacing: 15) {
            // Status indicator
            HStack {
                Circle()
                    .fill(viewModel.isOnline ? Color.green : Color.gray)
                    .frame(width: 12, height: 12)
                
                Text(viewModel.isOnline ? "You're Online" : "You're Offline")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(.primary)
                
                Spacer()
                
                Toggle("", isOn: Binding(
                    get: { viewModel.isOnline },
                    set: { newValue in
                        if viewModel.hasActiveOrders && !newValue {
                            // Prevent going offline with active orders
                            showingConfirmation = true
                        } else {
                            pendingStatus = newValue
                            Task {
                                await viewModel.updateAvailability(isOnline: newValue)
                            }
                        }
                    }
                ))
                .labelsHidden()
                .disabled(viewModel.isLoading)
            }
            
            // Additional info
            if viewModel.isOnline {
                HStack {
                    Image(systemName: "location.fill")
                        .foregroundColor(.blue)
                    
                    Text("Location sharing: \(viewModel.locationConsent ? "ON" : "OFF")")
                        .font(.system(size: 14))
                        .foregroundColor(.secondary)
                    
                    Spacer()
                }
                
                if viewModel.hasActiveOrders {
                    HStack {
                        Image(systemName: "exclamationmark.circle.fill")
                            .foregroundColor(.orange)
                        
                        Text("You have active jobs")
                            .font(.system(size: 14))
                            .foregroundColor(.secondary)
                        
                        Spacer()
                    }
                }
            } else {
                HStack {
                    Image(systemName: "info.circle")
                        .foregroundColor(.blue)
                    
                    Text("Turn on to start receiving jobs")
                        .font(.system(size: 14))
                        .foregroundColor(.secondary)
                    
                    Spacer()
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.1), radius: 10, x: 0, y: 5)
        )
        .alert("Cannot Go Offline", isPresented: $showingConfirmation) {
            Button("OK", role: .cancel) { }
        } message: {
            Text("You cannot go offline while you have active jobs. Please complete or cancel your active jobs first.")
        }
    }
}

#Preview {
    AvailabilityToggleView(viewModel: DashboardViewModel())
        .padding()
}

