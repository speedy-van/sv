import SwiftUI

// MARK: - Enhanced Job Detail View

struct EnhancedJobDetailView: View {
    let job: Job
    @Environment(\.dismiss) private var dismiss
    @State private var isAccepting = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Header
                jobHeader
                
                // Earnings Section
                earningsSection
                
                // Route Information
                routeSection
                
                // ULEZ/LEZ Warnings
                if job.ulezWarning?.inZone == true || job.lezWarning?.inZone == true {
                    warningsSection
                }
                
                // Pickup Details
                pickupSection
                
                // Dropoff Details
                dropoffSection
                
                // Items
                if let items = job.bookingItems, !items.isEmpty {
                    itemsSection(items: items)
                }
                
                // Floor & Elevator Info
                accessibilitySection
                
                // Action Buttons
                actionButtons
            }
            .padding()
        }
        .navigationTitle("Job Details")
        .navigationBarTitleDisplayMode(.inline)
    }
    
    // MARK: - Header
    
    private var jobHeader: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: "shippingbox.fill")
                    .font(.title)
                    .foregroundColor(.blue)
                
                VStack(alignment: .leading) {
                    Text(job.reference)
                        .font(.headline)
                    Text(job.date + " at " + job.time)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                StatusBadge(status: job.status)
            }
            
            Divider()
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
    
    // MARK: - Earnings
    
    private var earningsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "sterlingsign.circle.fill")
                    .foregroundColor(.green)
                Text("Your Earnings")
                    .font(.headline)
            }
            
            if let earnings = job.driverEarnings {
                VStack(spacing: 8) {
                    HStack {
                        Text("Total Earnings")
                            .font(.title2)
                            .fontWeight(.bold)
                        Spacer()
                        Text(earnings.displayTotal)
                            .font(.title)
                            .fontWeight(.bold)
                            .foregroundColor(.green)
                    }
                    
                    Divider()
                    
                    VStack(alignment: .leading, spacing: 6) {
                        EarningsRow(label: "Base Amount", value: earnings.baseAmount)
                        EarningsRow(label: "Distance", value: earnings.distanceAmount)
                        EarningsRow(label: "Time", value: earnings.timeAmount)
                        
                        if earnings.bonuses > 0 {
                            EarningsRow(label: "Bonuses", value: earnings.bonuses, color: .green)
                        }
                        
                        if earnings.penalties > 0 {
                            EarningsRow(label: "Penalties", value: -earnings.penalties, color: .red)
                        }
                    }
                }
            } else {
                HStack {
                    Text("Estimated")
                    Spacer()
                    Text("£\(job.estimatedEarnings)")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.green)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
    
    // MARK: - Route
    
    private var routeSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "map.fill")
                    .foregroundColor(.blue)
                Text("Route Information")
                    .font(.headline)
            }
            
            HStack(spacing: 16) {
                if let distance = job.distanceMiles {
                    InfoCard(
                        icon: "road.lanes",
                        title: "Distance",
                        value: String(format: "%.1f mi", distance)
                    )
                }
                
                if let duration = job.durationMinutes {
                    InfoCard(
                        icon: "clock.fill",
                        title: "Duration",
                        value: formatDuration(duration)
                    )
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
    
    // MARK: - Warnings
    
    private var warningsSection: some View {
        VStack(spacing: 12) {
            if let ulez = job.ulezWarning, ulez.inZone {
                WarningCard(
                    icon: "exclamationmark.triangle.fill",
                    title: "ULEZ Zone",
                    message: ulez.displayText,
                    color: .orange
                )
            }
            
            if let lez = job.lezWarning, lez.inZone {
                WarningCard(
                    icon: "exclamationmark.triangle.fill",
                    title: "LEZ Zone",
                    message: lez.displayText,
                    color: .orange
                )
            }
        }
    }
    
    // MARK: - Pickup
    
    private var pickupSection: some View {
        AddressCard(
            title: "Pickup Location",
            icon: "arrow.up.circle.fill",
            iconColor: .blue,
            address: job.pickupAddress?.fullAddress ?? job.from
        )
    }
    
    // MARK: - Dropoff
    
    private var dropoffSection: some View {
        AddressCard(
            title: "Dropoff Location",
            icon: "arrow.down.circle.fill",
            iconColor: .green,
            address: job.dropoffAddress?.fullAddress ?? job.to
        )
    }
    
    // MARK: - Items
    
    private func itemsSection(items: [BookingItem]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "shippingbox.fill")
                    .foregroundColor(.purple)
                Text("Items to Move")
                    .font(.headline)
            }
            
            ForEach(items) { item in
                HStack {
                    Image(systemName: "cube.fill")
                        .foregroundColor(.purple)
                    Text(item.displayName)
                    Spacer()
                    if let weight = item.weight {
                        Text("\(String(format: "%.1f", weight)) kg")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                .padding(.vertical, 4)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
    
    // MARK: - Accessibility
    
    private var accessibilitySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "building.2.fill")
                    .foregroundColor(.indigo)
                Text("Access Information")
                    .font(.headline)
            }
            
            if let floor = job.floorNumber {
                HStack {
                    Image(systemName: "arrow.up.arrow.down")
                        .foregroundColor(.indigo)
                    Text("Floor \(floor)")
                    Spacer()
                }
            }
            
            if let elevator = job.elevatorAvailable {
                HStack {
                    Image(systemName: elevator ? "checkmark.circle.fill" : "xmark.circle.fill")
                        .foregroundColor(elevator ? .green : .red)
                    Text(elevator ? "Elevator Available" : "No Elevator")
                    Spacer()
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
    
    // MARK: - Actions
    
    private var actionButtons: some View {
        VStack(spacing: 12) {
            Button(action: acceptJob) {
                HStack {
                    if isAccepting {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    } else {
                        Image(systemName: "checkmark.circle.fill")
                        Text("Accept Job")
                            .fontWeight(.semibold)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.green)
                .foregroundColor(.white)
                .cornerRadius(12)
            }
            .disabled(isAccepting)
            
            Button(action: { dismiss() }) {
                Text("Decline")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color(.systemGray5))
                    .foregroundColor(.primary)
                    .cornerRadius(12)
            }
        }
    }
    
    // MARK: - Helper Functions
    
    private func formatDuration(_ minutes: Int) -> String {
        let hours = minutes / 60
        let mins = minutes % 60
        if hours > 0 {
            return "\(hours)h \(mins)m"
        }
        return "\(mins)m"
    }
    
    private func acceptJob() {
        isAccepting = true
        // TODO: Call API to accept job
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            isAccepting = false
            dismiss()
        }
    }
}

// MARK: - Supporting Views

struct StatusBadge: View {
    let status: JobStatus
    
    var body: some View {
        Text(status.displayName)
            .font(.caption)
            .fontWeight(.semibold)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(badgeColor)
            .foregroundColor(.white)
            .cornerRadius(8)
    }
    
    private var badgeColor: Color {
        switch status {
        case .available: return .blue
        case .assigned, .accepted: return .green
        case .enRoute, .arrived, .loading: return .orange
        case .inTransit, .unloading: return .purple
        case .completed: return .gray
        case .cancelled: return .red
        }
    }
}

struct EarningsRow: View {
    let label: String
    let value: Double
    var color: Color = .primary
    
    var body: some View {
        HStack {
            Text(label)
                .foregroundColor(.secondary)
            Spacer()
            Text("£\(String(format: "%.2f", value))")
                .fontWeight(.medium)
                .foregroundColor(color)
        }
    }
}

struct InfoCard: View {
    let icon: String
    let title: String
    let value: String
    
    var body: some View {
        VStack {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(.blue)
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
            Text(value)
                .font(.headline)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(8)
    }
}

struct WarningCard: View {
    let icon: String
    let title: String
    let message: String
    let color: Color
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                    .foregroundColor(color)
                Text(message)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
        }
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(12)
    }
}

struct AddressCard: View {
    let title: String
    let icon: String
    let iconColor: Color
    let address: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(iconColor)
                Text(title)
                    .font(.headline)
            }
            
            Text(address)
                .font(.body)
                .foregroundColor(.secondary)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
}

// MARK: - Preview

struct EnhancedJobDetailView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            EnhancedJobDetailView(job: sampleJob)
        }
    }
    
    static var sampleJob: Job {
        Job(
            id: "1",
            reference: "SV-12345",
            customer: "John Smith",
            customerPhone: "07700900123",
            date: "2025-01-15",
            time: "14:00",
            from: "London SW1A 1AA",
            to: "Manchester M1 1AA",
            distance: "200 mi",
            vehicleType: "Large Van",
            items: "Furniture, Boxes",
            estimatedEarnings: "125.50",
            status: .available,
            priority: .normal,
            duration: "4h 30m",
            crew: "1 Driver",
            pickupAddress: BookingAddress(
                id: "1",
                label: "Pickup",
                line1: "10 Downing Street",
                line2: nil,
                city: "London",
                postcode: "SW1A 1AA",
                lat: 51.5034,
                lng: -0.1276
            ),
            dropoffAddress: BookingAddress(
                id: "2",
                label: "Dropoff",
                line1: "1 Deansgate",
                line2: nil,
                city: "Manchester",
                postcode: "M1 1AA",
                lat: 53.4808,
                lng: -2.2426
            ),
            bookingItems: [
                BookingItem(id: "1", name: "Sofa", quantity: 1, weight: 50, dimensions: "200x90x80cm"),
                BookingItem(id: "2", name: "Boxes", quantity: 10, weight: 15, dimensions: "40x40x40cm")
            ],
            assignmentId: nil,
            scheduledAt: nil,
            floorNumber: 3,
            elevatorAvailable: true,
            ulezWarning: ULEZWarning(inZone: true, charge: 12.50, zones: ["Central London"], message: "ULEZ charge applies"),
            lezWarning: nil,
            driverEarnings: DriverEarnings(
                baseAmount: 25.00,
                distanceAmount: 110.00,
                timeAmount: 67.50,
                bonuses: 15.00,
                penalties: 0,
                total: 217.50,
                breakdown: nil
            ),
            distanceMiles: 200.0,
            durationMinutes: 270
        )
    }
}

