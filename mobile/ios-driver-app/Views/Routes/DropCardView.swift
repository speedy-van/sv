import SwiftUI

struct DropCardView: View {
    let drop: Drop
    let isCurrentDrop: Bool
    
    var body: some View {
        HStack(spacing: 12) {
            // Sequence Number Circle
            ZStack {
                Circle()
                    .fill(isCurrentDrop ? Color.brandPrimary : Color.gray.opacity(0.3))
                    .frame(width: 40, height: 40)
                
                if drop.isCompleted {
                    Image(systemName: "checkmark")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.white)
                } else {
                    Text("\(drop.sequenceNumber ?? 0)")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(isCurrentDrop ? .white : .gray)
                }
            }
            
            // Drop Info
            VStack(alignment: .leading, spacing: 8) {
                // Status Badge
                HStack {
                    Text(drop.status.displayName)
                        .font(.system(size: 11, weight: .semibold))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(statusBackgroundColor)
                        .foregroundColor(.white)
                        .cornerRadius(8)
                    
                    if isCurrentDrop {
                        Text("CURRENT")
                            .font(.system(size: 11, weight: .bold))
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.orange)
                            .foregroundColor(.white)
                            .cornerRadius(8)
                    }
                }
                
                // Customer Info
                if let customerName = drop.customerName {
                    HStack(spacing: 4) {
                        Image(systemName: "person.fill")
                            .font(.system(size: 12))
                        Text(customerName)
                            .font(.system(size: 14, weight: .medium))
                    }
                }
                
                // Pickup Address
                HStack(alignment: .top, spacing: 4) {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.system(size: 12))
                        .foregroundColor(.green)
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Pickup")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(.secondary)
                        Text(drop.pickupAddress)
                            .font(.system(size: 13))
                            .lineLimit(2)
                    }
                }
                
                // Delivery Address
                HStack(alignment: .top, spacing: 4) {
                    Image(systemName: "arrow.down.circle.fill")
                        .font(.system(size: 12))
                        .foregroundColor(.red)
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Delivery")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(.secondary)
                        Text(drop.deliveryAddress)
                            .font(.system(size: 13))
                            .lineLimit(2)
                    }
                }
                
                // Price and Time Window
                HStack {
                    HStack(spacing: 4) {
                        Image(systemName: "banknote.fill")
                            .font(.system(size: 12))
                            .foregroundColor(.green)
                        Text(drop.formattedPrice)
                            .font(.system(size: 13, weight: .semibold))
                    }
                    
                    Spacer()
                    
                    HStack(spacing: 4) {
                        Image(systemName: "clock")
                            .font(.system(size: 12))
                            .foregroundColor(.secondary)
                        Text(formattedTime(drop.timeWindowEnd))
                            .font(.system(size: 12))
                            .foregroundColor(.secondary)
                    }
                }
                
                // Special Instructions
                if let instructions = drop.specialInstructions, !instructions.isEmpty {
                    HStack(alignment: .top, spacing: 4) {
                        Image(systemName: "exclamationmark.circle.fill")
                            .font(.system(size: 12))
                            .foregroundColor(.orange)
                        Text(instructions)
                            .font(.system(size: 12))
                            .foregroundColor(.secondary)
                            .lineLimit(2)
                    }
                    .padding(8)
                    .background(Color.orange.opacity(0.1))
                    .cornerRadius(6)
                }
            }
            
            Spacer()
            
            // Navigation Arrow
            if !drop.isCompleted {
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.gray)
            }
        }
        .padding(12)
        .background(isCurrentDrop ? Color.brandPrimary.opacity(0.1) : Color(.systemGray6))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(isCurrentDrop ? Color.brandPrimary : Color.clear, lineWidth: 2)
        )
    }
    
    private var statusBackgroundColor: Color {
        switch drop.status {
        case .pending:
            return .gray
        case .assignedToRoute:
            return .blue
        case .pickedUp:
            return .orange
        case .inTransit:
            return .green
        case .delivered:
            return .green
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

#Preview {
    VStack(spacing: 12) {
        DropCardView(
            drop: Drop(
                id: "drop1",
                routeId: "route1",
                bookingId: "booking1",
                customerId: "customer1",
                customerName: "John Smith",
                customerPhone: "07901846297",
                pickupAddress: "123 High Street, Glasgow, G1 1AA",
                deliveryAddress: "456 Main Road, Edinburgh, EH1 1BB",
                pickupLatitude: 55.8642,
                pickupLongitude: -4.2518,
                deliveryLatitude: 55.9533,
                deliveryLongitude: -3.1883,
                timeWindowStart: Date(),
                timeWindowEnd: Date().addingTimeInterval(3600),
                serviceTier: "Standard",
                status: .inTransit,
                quotedPrice: 2500,
                weight: 10.5,
                volume: 0.5,
                specialInstructions: "Please call when arriving",
                proofOfDelivery: nil,
                failureReason: nil,
                completedAt: nil,
                createdAt: Date(),
                sequenceNumber: 1
            ),
            isCurrentDrop: true
        )
        
        DropCardView(
            drop: Drop(
                id: "drop2",
                routeId: "route1",
                bookingId: "booking2",
                customerId: "customer2",
                customerName: "Jane Doe",
                customerPhone: "07901846297",
                pickupAddress: "789 Park Avenue, Glasgow, G2 2BB",
                deliveryAddress: "321 Queen Street, Edinburgh, EH2 2CC",
                pickupLatitude: 55.8642,
                pickupLongitude: -4.2518,
                deliveryLatitude: 55.9533,
                deliveryLongitude: -3.1883,
                timeWindowStart: Date(),
                timeWindowEnd: Date().addingTimeInterval(7200),
                serviceTier: "Standard",
                status: .assignedToRoute,
                quotedPrice: 3000,
                weight: 15.0,
                volume: 0.8,
                specialInstructions: nil,
                proofOfDelivery: nil,
                failureReason: nil,
                completedAt: nil,
                createdAt: Date(),
                sequenceNumber: 2
            ),
            isCurrentDrop: false
        )
    }
    .padding()
}

