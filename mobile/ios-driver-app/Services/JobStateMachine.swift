import Foundation

// MARK: - Job State Machine
// Enforces strict forward-only state transitions with validation

class JobStateMachine {
    static let shared = JobStateMachine()
    
    private init() {}
    
    // MARK: - State Transition Rules
    
    private let validTransitions: [JobStatus: [JobStatus]] = [
        .available: [.assigned],
        .assigned: [.accepted],
        .accepted: [.enRoute],
        .enRoute: [.arrived],
        .arrived: [.loading],
        .loading: [.inTransit],
        .inTransit: [.unloading],
        .unloading: [.completed],
        .completed: [],
        .cancelled: []
    ]
    
    // MARK: - Validation
    
    func canTransition(from currentState: JobStatus, to nextState: JobStatus) -> Bool {
        guard let allowedStates = validTransitions[currentState] else {
            print("❌ Invalid current state: \(currentState)")
            return false
        }
        
        let isValid = allowedStates.contains(nextState)
        
        if !isValid {
            print("❌ Invalid transition: \(currentState) → \(nextState)")
            print("   Allowed transitions from \(currentState): \(allowedStates)")
        }
        
        return isValid
    }
    
    func getNextValidState(from currentState: JobStatus) -> JobStatus? {
        guard let allowedStates = validTransitions[currentState],
              let nextState = allowedStates.first else {
            return nil
        }
        
        return nextState
    }
    
    func getAllowedTransitions(from currentState: JobStatus) -> [JobStatus] {
        return validTransitions[currentState] ?? []
    }
    
    // MARK: - State Progress
    
    func getProgressPercentage(for state: JobStatus) -> Double {
        let stateOrder: [JobStatus] = [
            .available,
            .assigned,
            .accepted,
            .enRoute,
            .arrived,
            .loading,
            .inTransit,
            .unloading,
            .completed
        ]
        
        guard let index = stateOrder.firstIndex(of: state) else {
            return 0.0
        }
        
        return Double(index) / Double(stateOrder.count - 1)
    }
    
    func getStepNumber(for state: JobStatus) -> Int {
        let stateOrder: [JobStatus] = [
            .available,
            .assigned,
            .accepted,
            .enRoute,
            .arrived,
            .loading,
            .inTransit,
            .unloading,
            .completed
        ]
        
        guard let index = stateOrder.firstIndex(of: state) else {
            return 0
        }
        
        return index + 1
    }
    
    func getTotalSteps() -> Int {
        return 9 // Total number of states
    }
    
    // MARK: - Validation Messages
    
    func getTransitionErrorMessage(from currentState: JobStatus, to nextState: JobStatus) -> String {
        if currentState == .completed {
            return "This job is already completed. No further actions are allowed."
        }
        
        if currentState == .cancelled {
            return "This job has been cancelled. No further actions are allowed."
        }
        
        guard let allowedStates = validTransitions[currentState] else {
            return "Invalid job state: \(currentState.displayName)"
        }
        
        if allowedStates.isEmpty {
            return "No further transitions are allowed from \(currentState.displayName)"
        }
        
        let allowedNames = allowedStates.map { $0.displayName }.joined(separator: ", ")
        return "Cannot transition from \(currentState.displayName) to \(nextState.displayName). Allowed next states: \(allowedNames)"
    }
    
    // MARK: - State Persistence
    
    func saveJobState(jobId: String, state: JobStatus, timestamp: Date = Date()) {
        let key = "job_state_\(jobId)"
        let data: [String: Any] = [
            "state": state.rawValue,
            "timestamp": timestamp.timeIntervalSince1970
        ]
        
        UserDefaults.standard.set(data, forKey: key)
        print("💾 Saved job state: \(jobId) → \(state.displayName)")
    }
    
    func loadJobState(jobId: String) -> (state: JobStatus, timestamp: Date)? {
        let key = "job_state_\(jobId)"
        
        guard let data = UserDefaults.standard.dictionary(forKey: key),
              let stateString = data["state"] as? String,
              let state = JobStatus(rawValue: stateString),
              let timestampInterval = data["timestamp"] as? TimeInterval else {
            return nil
        }
        
        let timestamp = Date(timeIntervalSince1970: timestampInterval)
        return (state, timestamp)
    }
    
    func clearJobState(jobId: String) {
        let key = "job_state_\(jobId)"
        UserDefaults.standard.removeObject(forKey: key)
        print("🗑️ Cleared job state: \(jobId)")
    }
    
    // MARK: - Offline Queue
    
    func queueStateTransition(jobId: String, from currentState: JobStatus, to nextState: JobStatus) {
        let transition = StateTransition(
            id: UUID().uuidString,
            jobId: jobId,
            fromState: currentState,
            toState: nextState,
            timestamp: Date(),
            synced: false
        )
        
        var queue = loadTransitionQueue()
        queue.append(transition)
        saveTransitionQueue(queue)
        
        print("📥 Queued state transition: \(jobId) \(currentState.displayName) → \(nextState.displayName)")
    }
    
    func getQueuedTransitions() -> [StateTransition] {
        return loadTransitionQueue().filter { !$0.synced }
    }
    
    func markTransitionSynced(transitionId: String) {
        var queue = loadTransitionQueue()
        
        if let index = queue.firstIndex(where: { $0.id == transitionId }) {
            queue[index].synced = true
            saveTransitionQueue(queue)
            print("✅ Marked transition as synced: \(transitionId)")
        }
    }
    
    private func loadTransitionQueue() -> [StateTransition] {
        guard let data = UserDefaults.standard.data(forKey: "state_transition_queue"),
              let queue = try? JSONDecoder().decode([StateTransition].self, from: data) else {
            return []
        }
        return queue
    }
    
    private func saveTransitionQueue(_ queue: [StateTransition]) {
        if let data = try? JSONEncoder().encode(queue) {
            UserDefaults.standard.set(data, forKey: "state_transition_queue")
        }
    }
}

// MARK: - State Transition Model

struct StateTransition: Codable, Identifiable {
    let id: String
    let jobId: String
    let fromState: JobStatus
    let toState: JobStatus
    let timestamp: Date
    var synced: Bool
}

