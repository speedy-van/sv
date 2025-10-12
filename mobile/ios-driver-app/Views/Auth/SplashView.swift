import SwiftUI

struct SplashView: View {
    var body: some View {
        ZStack {
            Color.brandPrimary
                .ignoresSafeArea()
            
            VStack(spacing: 20) {
                Image(systemName: "box.truck.fill")
                    .font(.system(size: 80))
                    .foregroundColor(.white)
                
                Text("Speedy Van")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundColor(.white)
                
                Text("Driver")
                    .font(.system(size: 24, weight: .medium))
                    .foregroundColor(.white.opacity(0.8))
                
                ProgressView()
                    .tint(.white)
                    .padding(.top, 20)
            }
        }
    }
}

#Preview {
    SplashView()
}

