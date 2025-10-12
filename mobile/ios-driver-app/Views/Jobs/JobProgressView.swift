import SwiftUI

struct JobProgressView: View {
    let job: Job
    @ObservedObject var viewModel: TrackingViewModel
    @Environment(\.dismiss) var dismiss
    @State private var showingCompleteConfirmation = false
    @State private var showingStopConfirmation = false
    @State private var notes = ""
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Job header
                    VStack(spacing: 10) {
                        Text(job.reference)
                            .font(.system(size: 24, weight: .bold))
                        
                        Text(job.customer)
                            .font(.system(size: 16))
                            .foregroundColor(.secondary)
                        
                        StatusBadge(status: JobStatus(rawValue: viewModel.currentStep.rawValue) ?? .enRoute)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(16)
                    
                    // Progress bar
                    VStack(spacing: 10) {
                        Text("Progress: \(Int(viewModel.progressPercentage * 100))%")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.secondary)
                        
                        ProgressView(value: viewModel.progressPercentage)
                            .tint(.brandPrimary)
                            .scaleEffect(x: 1, y: 2, anchor: .center)
                        
                        Text(viewModel.progressText)
                            .font(.system(size: 13))
                            .foregroundColor(.secondary)
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(16)
                    .shadow(color: .black.opacity(0.05), radius: 5)
                    
                    // Progress steps
                    VStack(alignment: .leading, spacing: 15) {
                        Text("Job Steps")
                            .font(.system(size: 18, weight: .bold))
                            .padding(.horizontal)
                        
                        ForEach([
                            JobProgressStep.enRoute,
                            .arrived,
                            .loading,
                            .inTransit,
                            .unloading,
                            .completed
                        ], id: \.rawValue) { step in
                            ProgressStepRow(
                                step: step,
                                currentStep: viewModel.currentStep,
                                isCompleted: isStepCompleted(step),
                                isCurrent: step == viewModel.currentStep
                            )
                        }
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(16)
                    .shadow(color: .black.opacity(0.05), radius: 5)
                    
                    // Notes section
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Add Notes (Optional)")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.secondary)
                        
                        TextEditor(text: $notes)
                            .frame(height: 100)
                            .padding(8)
                            .background(Color(.systemGray6))
                            .cornerRadius(8)
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(16)
                    .shadow(color: .black.opacity(0.05), radius: 5)
                    
                    // Action buttons
                    VStack(spacing: 12) {
                        if let nextStep = viewModel.nextStep() {
                            Button {
                                Task {
                                    let success = await viewModel.updateProgress(
                                        to: nextStep,
                                        notes: notes.isEmpty ? nil : notes
                                    )
                                    if success {
                                        notes = "" // Clear notes after successful update
                                        if nextStep == .completed {
                                            dismiss()
                                        }
                                    }
                                }
                            } label: {
                                HStack {
                                    if viewModel.isUpdating {
                                        ProgressView()
                                            .tint(.white)
                                    } else {
                                        Image(systemName: nextStep == .completed ? "checkmark.circle.fill" : "arrow.right.circle.fill")
                                        Text(nextStep == .completed ? "Complete Job" : "Update to \(nextStep.displayName)")
                                            .font(.system(size: 18, weight: .semibold))
                                    }
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(nextStep == .completed ? Color.green : Color.brandPrimary)
                                .foregroundColor(.white)
                                .cornerRadius(12)
                            }
                            .disabled(viewModel.isUpdating)
                        }
                        
                        Button {
                            showingStopConfirmation = true
                        } label: {
                            HStack {
                                Image(systemName: "stop.circle.fill")
                                Text("Stop Tracking")
                                    .font(.system(size: 16, weight: .semibold))
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.red.opacity(0.1))
                            .foregroundColor(.red)
                            .cornerRadius(12)
                        }
                    }
                    .padding(.horizontal)
                    
                    // Location info
                    if let location = viewModel.currentLocation {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Image(systemName: "location.fill")
                                    .foregroundColor(.blue)
                                
                                Text("Your Location")
                                    .font(.system(size: 14, weight: .medium))
                            }
                            
                            Text("Lat: \(location.coordinate.latitude, specifier: "%.6f"), Lng: \(location.coordinate.longitude, specifier: "%.6f")")
                                .font(.system(size: 12))
                                .foregroundColor(.secondary)
                            
                            Text("Accuracy: ± \(Int(location.horizontalAccuracy))m")
                                .font(.system(size: 12))
                                .foregroundColor(.secondary)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(12)
                    }
                }
                .padding()
            }
            .navigationTitle("Job Progress")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") {
                        showingStopConfirmation = true
                    }
                }
            }
        }
        .alert("Stop Tracking?", isPresented: $showingStopConfirmation) {
            Button("Cancel", role: .cancel) { }
            Button("Stop", role: .destructive) {
                viewModel.stopTracking()
                dismiss()
            }
        } message: {
            Text("Are you sure you want to stop tracking this job? Your progress will be saved.")
        }
    }
    
    private func isStepCompleted(_ step: JobProgressStep) -> Bool {
        let steps: [JobProgressStep] = [.enRoute, .arrived, .loading, .inTransit, .unloading, .completed]
        guard let currentIndex = steps.firstIndex(of: viewModel.currentStep),
              let stepIndex = steps.firstIndex(of: step) else {
            return false
        }
        return stepIndex < currentIndex
    }
}

// MARK: - Progress Step Row

struct ProgressStepRow: View {
    let step: JobProgressStep
    let currentStep: JobProgressStep
    let isCompleted: Bool
    let isCurrent: Bool
    
    var body: some View {
        HStack(spacing: 15) {
            // Icon
            ZStack {
                Circle()
                    .fill(backgroundColor)
                    .frame(width: 40, height: 40)
                
                Image(systemName: isCompleted ? "checkmark" : step.icon)
                    .foregroundColor(.white)
                    .font(.system(size: 16, weight: .semibold))
            }
            
            // Text
            VStack(alignment: .leading, spacing: 4) {
                Text(step.displayName)
                    .font(.system(size: 15, weight: isCurrent ? .semibold : .regular))
                    .foregroundColor(isCurrent ? .primary : .secondary)
                
                if isCurrent {
                    Text("Current step")
                        .font(.system(size: 12))
                        .foregroundColor(.brandPrimary)
                } else if isCompleted {
                    Text("Completed")
                        .font(.system(size: 12))
                        .foregroundColor(.green)
                }
            }
            
            Spacer()
        }
        .padding()
        .background(isCurrent ? Color.brandPrimary.opacity(0.1) : Color(.systemBackground))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(isCurrent ? Color.brandPrimary : Color.clear, lineWidth: 2)
        )
    }
    
    var backgroundColor: Color {
        if isCompleted {
            return .green
        } else if isCurrent {
            return .brandPrimary
        } else {
            return .gray
        }
    }
}

#Preview {
    JobProgressView(
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
            status: .enRoute,
            priority: .normal,
            duration: "2-3 hours",
            crew: "1 person"
        ),
        viewModel: TrackingViewModel()
    )
}

