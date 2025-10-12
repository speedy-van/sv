import SwiftUI

struct RouteCardView: View {
    let route: Route
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Route #\(route.id.prefix(8))")
                        .font(.system(size: 16, weight: .bold))
                    
                    Text(route.serviceTier)
                        .font(.system(size: 12))
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                // Status Badge
                Text(route.status.displayName)
                    .font(.system(size: 12, weight: .semibold))
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(statusBackgroundColor)
                    .foregroundColor(.white)
                    .cornerRadius(12)
            }
            
            // Progress Bar
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text("Progress")
                        .font(.system(size: 12, weight: .medium))
                    Spacer()
                    Text("\(route.completedDrops)/\(route.totalDrops) drops")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(.brandPrimary)
                }
                
                ProgressView(value: route.progress)
                    .tint(.brandPrimary)
            }
            
            // Stats Grid
            HStack(spacing: 16) {
                StatItem(
                    icon: "mappin.and.ellipse",
                    value: "\(route.totalDrops)",
                    label: "Stops"
                )
                
                StatItem(
                    icon: "clock.fill",
                    value: route.formattedDuration,
                    label: "Duration"
                )
                
                StatItem(
                    icon: "arrow.triangle.swap",
                    value: route.formattedDistance,
                    label: "Distance"
                )
                
                StatItem(
                    icon: "banknote.fill",
                    value: route.formattedTotalValue,
                    label: "Earnings"
                )
            }
            
            // Time Window
            HStack(spacing: 8) {
                Image(systemName: "calendar")
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
                
                Text("\(formattedTime(route.timeWindowStart)) - \(formattedTime(route.timeWindowEnd))")
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
            }
        }
        .padding(16)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 8, x: 0, y: 2)
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
    
    private func formattedTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

struct StatItem: View {
    let icon: String
    let value: String
    let label: String
    
    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundColor(.brandPrimary)
            
            Text(value)
                .font(.system(size: 14, weight: .semibold))
            
            Text(label)
                .font(.system(size: 10))
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

#Preview {
    RouteCardView(route: Route(
        id: "route123",
        status: .assigned,
        serviceTier: "Standard",
        driverId: "driver1",
        totalDrops: 5,
        completedDrops: 2,
        estimatedDuration: 120,
        totalDistance: 15.5,
        totalValue: 8500,
        timeWindowStart: Date(),
        timeWindowEnd: Date().addingTimeInterval(7200),
        optimizedSequence: [1, 2, 3, 4, 5],
        createdAt: Date(),
        drops: []
    ))
    .padding()
}

