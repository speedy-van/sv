import SwiftUI
import MapKit

struct JobDetailView: View {
    let job: Job
    @ObservedObject var viewModel: JobsViewModel
    @StateObject private var trackingViewModel = TrackingViewModel()
    @Environment(\.dismiss) var dismiss
    
    @State private var showingAcceptConfirmation = false
    @State private var showingDeclineSheet = false
    @State private var declineReason = ""
    @State private var showingTrackingView = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Status header
                VStack(spacing: 10) {
                    StatusBadge(status: job.status)
                    
                    Text(job.reference)
                        .font(.system(size: 24, weight: .bold))
                    
                    Text(job.customer)
                        .font(.system(size: 18))
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(16)
                
                // Route section
                VStack(alignment: .leading, spacing: 15) {
                    Text("Route")
                        .font(.system(size: 18, weight: .bold))
                    
                    // Pickup location
                    HStack(alignment: .top, spacing: 12) {
                        Image(systemName: "circle.fill")
                            .foregroundColor(.green)
                            .font(.system(size: 12))
                            .padding(.top, 4)
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Pickup")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(.secondary)
                            
                            Text(job.from)
                                .font(.system(size: 15))
                        }
                    }
                    
                    // Dropoff
                    HStack(alignment: .top, spacing: 12) {
                        Image(systemName: "circle.fill")
                            .foregroundColor(.red)
                            .font(.system(size: 12))
                            .padding(.top, 4)
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Dropoff")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(.secondary)
                            
                            Text(job.to)
                                .font(.system(size: 15))
                        }
                    }
                    
                    // Distance
                    HStack {
                        Image(systemName: "road.lanes")
                            .foregroundColor(.blue)
                        
                        Text("Distance: \(job.distance)")
                            .font(.system(size: 14))
                            .foregroundColor(.secondary)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(16)
                .shadow(color: .black.opacity(0.05), radius: 5)
                
                // Job details section
                VStack(alignment: .leading, spacing: 15) {
                    Text("Details")
                        .font(.system(size: 18, weight: .bold))
                    
                    DetailRow(icon: "calendar", title: "Date", value: job.date)
                    DetailRow(icon: "clock", title: "Time", value: job.time)
                    DetailRow(icon: "box.truck.fill", title: "Vehicle", value: job.vehicleType)
                    DetailRow(icon: "clock.arrow.circlepath", title: "Duration", value: job.duration)
                    DetailRow(icon: "person.2.fill", title: "Crew", value: job.crew)
                    DetailRow(icon: "shippingbox.fill", title: "Items", value: job.items)
                    DetailRow(icon: "banknote.fill", title: "Earnings", value: job.estimatedEarnings)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(16)
                .shadow(color: .black.opacity(0.05), radius: 5)
                
                // Contact section
                VStack(alignment: .leading, spacing: 15) {
                    Text("Contact")
                        .font(.system(size: 18, weight: .bold))
                    
                    HStack {
                        Button {
                            if let url = URL(string: "tel://\(job.customerPhone.replacingOccurrences(of: " ", with: ""))") {
                                UIApplication.shared.open(url)
                            }
                        } label: {
                            HStack {
                                Image(systemName: "phone.fill")
                                Text("Call Customer")
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }
                        
                        Button {
                            if let url = URL(string: "sms:\(job.customerPhone.replacingOccurrences(of: " ", with: ""))") {
                                UIApplication.shared.open(url)
                            }
                        } label: {
                            HStack {
                                Image(systemName: "message.fill")
                                Text("Message")
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.green)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(16)
                .shadow(color: .black.opacity(0.05), radius: 5)
                
                // Action buttons
                if job.status == .available {
                    VStack(spacing: 12) {
                        Button {
                            showingAcceptConfirmation = true
                        } label: {
                            HStack {
                                Image(systemName: "checkmark.circle.fill")
                                Text("Accept Job")
                                    .font(.system(size: 18, weight: .semibold))
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.green)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }
                        
                        Button {
                            showingDeclineSheet = true
                        } label: {
                            HStack {
                                Image(systemName: "xmark.circle.fill")
                                Text("Decline Job")
                                    .font(.system(size: 18, weight: .semibold))
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.red)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }
                    }
                } else if job.status == .accepted || job.status == .assigned {
                    Button {
                        trackingViewModel.startTracking(job: job)
                        showingTrackingView = true
                    } label: {
                        HStack {
                            Image(systemName: "location.fill")
                            Text("Start Job")
                                .font(.system(size: 18, weight: .semibold))
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.brandPrimary)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                } else if job.status == .enRoute || job.status == .arrived || 
                          job.status == .loading || job.status == .inTransit || 
                          job.status == .unloading {
                    Button {
                        trackingViewModel.startTracking(job: job)
                        showingTrackingView = true
                    } label: {
                        HStack {
                            Image(systemName: "arrow.forward.circle.fill")
                            Text("Continue Job")
                                .font(.system(size: 18, weight: .semibold))
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.orange)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                }
            }
            .padding()
        }
        .navigationTitle("Job Details")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showingDeclineSheet) {
            DeclineJobSheet(
                job: job,
                viewModel: viewModel,
                isPresented: $showingDeclineSheet,
                declineReason: $declineReason
            )
        }
        .sheet(isPresented: $showingTrackingView) {
            JobProgressView(job: job, viewModel: trackingViewModel)
        }
        .alert("Accept Job?", isPresented: $showingAcceptConfirmation) {
            Button("Cancel", role: .cancel) { }
            Button("Accept") {
                Task {
                    let success = await viewModel.acceptJob(job)
                    if success {
                        dismiss()
                    }
                }
            }
        } message: {
            Text("Do you want to accept this job? You'll be expected to complete it as scheduled.")
        }
    }
}

// MARK: - Detail Row

struct DetailRow: View {
    let icon: String
    let title: String
    let value: String
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(.brandPrimary)
                .frame(width: 24)
            
            Text(title)
                .font(.system(size: 14))
                .foregroundColor(.secondary)
            
            Spacer()
            
            Text(value)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(.primary)
        }
    }
}

// MARK: - Decline Sheet

struct DeclineJobSheet: View {
    let job: Job
    @ObservedObject var viewModel: JobsViewModel
    @Binding var isPresented: Bool
    @Binding var declineReason: String
    @Environment(\.dismiss) var dismiss
    
    let reasons = [
        "Too far from current location",
        "Not available at that time",
        "Vehicle not suitable",
        "Already have too many jobs",
        "Other"
    ]
    
    var body: some View {
        NavigationView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Why are you declining this job?")
                    .font(.system(size: 18, weight: .semibold))
                    .padding(.horizontal)
                
                List(reasons, id: \.self) { reason in
                    Button {
                        declineReason = reason
                    } label: {
                        HStack {
                            Text(reason)
                                .foregroundColor(.primary)
                            
                            Spacer()
                            
                            if declineReason == reason {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(.brandPrimary)
                            }
                        }
                    }
                }
                .listStyle(.plain)
                
                Button {
                    Task {
                        let success = await viewModel.declineJob(job, reason: declineReason)
                        if success {
                            isPresented = false
                        }
                    }
                } label: {
                    Text("Decline Job")
                        .font(.system(size: 18, weight: .semibold))
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(declineReason.isEmpty ? Color.gray : Color.red)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                }
                .disabled(declineReason.isEmpty)
                .padding()
            }
            .navigationTitle("Decline Job")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        isPresented = false
                    }
                }
            }
        }
    }
}

#Preview {
    NavigationView {
        JobDetailView(
            job: Job(
                id: "1",
                reference: "SV-12345",
                customer: "John Smith",
                customerPhone: "07901846297",
                date: "2024-01-15",
                time: "14:30",
                from: "123 Main Street, Glasgow G1 1AB",
                to: "25 Baker Street, Edinburgh EH1 3AT",
                distance: "45.2 miles",
                vehicleType: "Van",
                items: "2x Large Box, 1x Sofa",
                estimatedEarnings: "£85.50",
                status: .available,
                priority: .normal,
                duration: "2-3 hours",
                crew: "1 person"
            ),
            viewModel: JobsViewModel()
        )
    }
}

