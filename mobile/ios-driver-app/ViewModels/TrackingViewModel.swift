import Foundation
import SwiftUI
import CoreLocation

@MainActor
class TrackingViewModel: ObservableObject {
    @Published var currentJob: Job?
    @Published var currentStep: JobProgressStep = .enRoute
    @Published var isUpdating = false
    @Published var errorMessage: String?
    @Published var currentLocation: CLLocation?
    
    private let jobService = JobService.shared
    private let locationService = LocationService.shared
    private let stateMachine = JobStateMachine.shared
    
    // MARK: - Start Tracking Job
    
    func startTracking(job: Job) {
        currentJob = job
        
        // Determine current step based on job status
        switch job.status {
        case .accepted, .assigned:
            currentStep = .enRoute
        case .enRoute:
            currentStep = .enRoute
        case .arrived:
            currentStep = .arrived
        case .loading:
            currentStep = .loading
        case .inTransit:
            currentStep = .inTransit
        case .unloading:
            currentStep = .unloading
        case .completed:
            currentStep = .completed
        default:
            currentStep = .enRoute
        }
        
        // Start location tracking
        locationService.startTracking(for: job.id)
    }
    
    func stopTracking() {
        currentJob = nil
        locationService.stopTracking()
    }
    
    // MARK: - Update Progress
    
    func updateProgress(to step: JobProgressStep, notes: String? = nil) async -> Bool {
        guard let job = currentJob else {
            errorMessage = "No active job"
            return false
        }
        
        // Convert JobProgressStep to JobStatus
        let targetStatus = stepToStatus(step)
        let currentStatus = stepToStatus(currentStep)
        
        // Validate state transition
        guard stateMachine.canTransition(from: currentStatus, to: targetStatus) else {
            errorMessage = stateMachine.getTransitionErrorMessage(from: currentStatus, to: targetStatus)
            print("❌ \(errorMessage ?? "")")
            return false
        }
        
        isUpdating = true
        errorMessage = nil
        
        do {
            // Get current location
            var location: (latitude: Double, longitude: Double)?
            if let currentLoc = locationService.currentLocation {
                location = (
                    latitude: currentLoc.coordinate.latitude,
                    longitude: currentLoc.coordinate.longitude
                )
            }
            
            // Update progress
            let response = try await jobService.updateProgress(
                jobId: job.id,
                step: step,
                notes: notes,
                location: location
            )
            
            if response.success {
                currentStep = step
                print("✅ Progress updated to: \(step.displayName)")
                
                // Save state locally for offline support
                stateMachine.saveJobState(jobId: job.id, state: targetStatus)
                
                // If completed, stop tracking
                if step == .completed {
                    stopTracking()
                }
                
                isUpdating = false
                return true
            } else if let error = response.error {
                errorMessage = error
                isUpdating = false
                return false
            }
        } catch {
            errorMessage = "Failed to update progress: \(error.localizedDescription)"
            print("❌ \(errorMessage ?? "")")
            
            // Queue for offline sync if network error
            if let networkError = error as? NetworkError,
               case .networkError = networkError {
                stateMachine.queueStateTransition(jobId: job.id, from: currentStatus, to: targetStatus)
                print("📥 Queued state transition for offline sync")
            }
        }
        
        isUpdating = false
        return false
    }
    
    // MARK: - Progress Helpers
    
    func canProgressTo(_ step: JobProgressStep) -> Bool {
        // Check if the step is the next logical step
        return currentStep.nextStep == step
    }
    
    func nextStep() -> JobProgressStep? {
        return currentStep.nextStep
    }
    
    var progressPercentage: Double {
        switch currentStep {
        case .enRoute: return 0.15
        case .arrived: return 0.30
        case .loading: return 0.45
        case .inTransit: return 0.70
        case .unloading: return 0.85
        case .completed: return 1.0
        }
    }
    
    var progressText: String {
        switch currentStep {
        case .enRoute: return "Heading to pickup location"
        case .arrived: return "Arrived at pickup location"
        case .loading: return "Loading items"
        case .inTransit: return "Heading to dropoff location"
        case .unloading: return "Unloading items"
        case .completed: return "Job completed"
        }
    }
    
    // MARK: - Helper Methods
    
    private func stepToStatus(_ step: JobProgressStep) -> JobStatus {
        switch step {
        case .enRoute: return .enRoute
        case .arrived: return .arrived
        case .loading: return .loading
        case .inTransit: return .inTransit
        case .unloading: return .unloading
        case .completed: return .completed
        }
    }
}

