import SwiftUI

struct JobCardView: View {
    let job: Job
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header: Reference and status
            HStack {
                Text(job.reference)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.primary)
                
                Spacer()
                
                StatusBadge(status: job.status)
            }
            
            // Customer info
            HStack(spacing: 8) {
                Image(systemName: "person.fill")
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
                
                Text(job.customer)
                    .font(.system(size: 14))
                    .foregroundColor(.primary)
                
                Spacer()
                
                if job.priority != .normal {
                    Image(systemName: "exclamationmark.circle.fill")
                        .foregroundColor(.red)
                        .font(.system(size: 14))
                }
            }
            
            Divider()
            
            // Route info
            VStack(spacing: 8) {
                // Pickup
                HStack(spacing: 8) {
                    Image(systemName: "circle.fill")
                        .font(.system(size: 8))
                        .foregroundColor(.green)
                    
                    Text(job.from)
                        .font(.system(size: 13))
                        .foregroundColor(.primary)
                        .lineLimit(1)
                    
                    Spacer()
                }
                
                // Dropoff
                HStack(spacing: 8) {
                    Image(systemName: "circle.fill")
                        .font(.system(size: 8))
                        .foregroundColor(.red)
                    
                    Text(job.to)
                        .font(.system(size: 13))
                        .foregroundColor(.primary)
                        .lineLimit(1)
                    
                    Spacer()
                }
            }
            
            Divider()
            
            // Bottom info: Date, time, distance, earnings
            HStack {
                // Date and time
                HStack(spacing: 4) {
                    Image(systemName: "calendar")
                        .font(.system(size: 12))
                        .foregroundColor(.secondary)
                    
                    Text(job.date)
                        .font(.system(size: 12))
                        .foregroundColor(.secondary)
                    
                    Text(job.time)
                        .font(.system(size: 12))
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                // Distance
                HStack(spacing: 4) {
                    Image(systemName: "road.lanes")
                        .font(.system(size: 12))
                        .foregroundColor(.secondary)
                    
                    Text(job.distance)
                        .font(.system(size: 12))
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                // Earnings
                Text(job.estimatedEarnings)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.green)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 4)
        )
    }
}

// MARK: - Status Badge

struct StatusBadge: View {
    let status: JobStatus
    
    var body: some View {
        Text(status.displayName)
            .font(.system(size: 11, weight: .semibold))
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(backgroundColor)
            .foregroundColor(.white)
            .cornerRadius(12)
    }
    
    var backgroundColor: Color {
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

#Preview {
    VStack(spacing: 20) {
        JobCardView(job: Job(
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
        ))
        
        JobCardView(job: Job(
            id: "2",
            reference: "SV-12346",
            customer: "Jane Doe",
            customerPhone: "07901846297",
            date: "2024-01-15",
            time: "16:00",
            from: "10 High Street, Glasgow G1 1AB",
            to: "5 Queen Street, Aberdeen AB10 1XL",
            distance: "120.5 miles",
            vehicleType: "Van",
            items: "5x Box",
            estimatedEarnings: "£145.00",
            status: .accepted,
            priority: .urgent,
            duration: "4-5 hours",
            crew: "2 people"
        ))
    }
    .padding()
}

