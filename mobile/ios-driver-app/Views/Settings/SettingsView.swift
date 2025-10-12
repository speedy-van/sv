import SwiftUI

struct SettingsView: View {
    @StateObject private var viewModel = SettingsViewModel()
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var selectedTab = 0
    @State private var showingLogoutAlert = false
    @State private var showingSuccessToast = false
    
    var body: some View {
        NavigationView {
            ZStack {
                if viewModel.isLoading && viewModel.profile == nil {
                    VStack(spacing: 20) {
                        ProgressView()
                        Text("Loading settings...")
                            .foregroundColor(.secondary)
                    }
                } else {
                    VStack(spacing: 0) {
                        // Tab Selector
                        HStack(spacing: 0) {
                            SettingsTabButton(
                                title: "Profile",
                                icon: "person.fill",
                                isSelected: selectedTab == 0
                            ) {
                                selectedTab = 0
                            }
                            
                            SettingsTabButton(
                                title: "Notifications",
                                icon: "bell.fill",
                                isSelected: selectedTab == 1
                            ) {
                                selectedTab = 1
                            }
                            
                            SettingsTabButton(
                                title: "Security",
                                icon: "lock.fill",
                                isSelected: selectedTab == 2
                            ) {
                                selectedTab = 2
                            }
                        }
                        .padding(.horizontal)
                        .padding(.top)
                        
                        Divider()
                            .padding(.top)
                        
                        // Tab Content
                        ScrollView {
                            if selectedTab == 0 {
                                ProfileTabContent(viewModel: viewModel)
                            } else if selectedTab == 1 {
                                NotificationsTabContent(viewModel: viewModel)
                            } else {
                                SecurityTabContent(
                                    authViewModel: authViewModel,
                                    showingLogoutAlert: $showingLogoutAlert
                                )
                            }
                        }
                    }
                }
                
                // Success Toast
                if showingSuccessToast, let message = viewModel.successMessage {
                    VStack {
                        Spacer()
                        HStack {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.white)
                            Text(message)
                                .foregroundColor(.white)
                        }
                        .padding()
                        .background(Color.green)
                        .cornerRadius(10)
                        .padding()
                    }
                    .transition(.move(edge: .bottom))
                }
                
                // Error Message
                if let errorMessage = viewModel.errorMessage {
                    VStack {
                        Spacer()
                        Text(errorMessage)
                            .font(.system(size: 14))
                            .foregroundColor(.white)
                            .padding()
                            .background(Color.red)
                            .cornerRadius(10)
                            .padding()
                    }
                }
            }
            .navigationTitle("Settings")
            .task {
                await viewModel.fetchData()
            }
            .alert("Logout", isPresented: $showingLogoutAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Logout", role: .destructive) {
                    Task {
                        await authViewModel.logout()
                    }
                }
            } message: {
                Text("Are you sure you want to logout?")
            }
            .onChange(of: viewModel.successMessage) { newValue in
                if newValue != nil {
                    showingSuccessToast = true
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                        showingSuccessToast = false
                        viewModel.successMessage = nil
                    }
                }
            }
        }
    }
}

// MARK: - Tab Button

struct SettingsTabButton: View {
    let title: String
    let icon: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 18))
                
                Text(title)
                    .font(.system(size: 12, weight: isSelected ? .semibold : .regular))
                
                if isSelected {
                    Rectangle()
                        .fill(Color.brandPrimary)
                        .frame(height: 2)
                } else {
                    Rectangle()
                        .fill(Color.clear)
                        .frame(height: 2)
                }
            }
            .foregroundColor(isSelected ? .brandPrimary : .secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Profile Tab

struct ProfileTabContent: View {
    @ObservedObject var viewModel: SettingsViewModel
    
    var body: some View {
        VStack(spacing: 20) {
            if let profile = viewModel.profile {
                VStack(spacing: 16) {
                    // Avatar
                    Image(systemName: "person.circle.fill")
                        .font(.system(size: 80))
                        .foregroundColor(.brandPrimary)
                    
                    Text(profile.name)
                        .font(.system(size: 24, weight: .bold))
                    
                    Text(profile.email)
                        .font(.system(size: 14))
                        .foregroundColor(.secondary)
                }
                .padding(.vertical)
                
                VStack(spacing: 16) {
                    SettingsTextField(
                        label: "Full Name",
                        text: Binding(
                            get: { viewModel.profile?.name ?? "" },
                            set: { viewModel.profile?.name = $0 }
                        )
                    )
                    
                    SettingsTextField(
                        label: "Email",
                        text: Binding(
                            get: { viewModel.profile?.email ?? "" },
                            set: { viewModel.profile?.email = $0 }
                        ),
                        keyboardType: .emailAddress
                    )
                    
                    SettingsTextField(
                        label: "Phone Number",
                        text: Binding(
                            get: { viewModel.profile?.phone ?? "" },
                            set: { viewModel.profile?.phone = $0 }
                        ),
                        keyboardType: .phonePad
                    )
                    
                    SettingsTextField(
                        label: "Emergency Contact",
                        text: Binding(
                            get: { viewModel.profile?.emergencyContact ?? "" },
                            set: { viewModel.profile?.emergencyContact = $0 }
                        ),
                        keyboardType: .phonePad
                    )
                    
                    SettingsTextField(
                        label: "Driving License",
                        text: Binding(
                            get: { viewModel.profile?.drivingLicense ?? "" },
                            set: { viewModel.profile?.drivingLicense = $0 }
                        )
                    )
                    
                    SettingsTextField(
                        label: "Vehicle Registration",
                        text: Binding(
                            get: { viewModel.profile?.vehicleReg ?? "" },
                            set: { viewModel.profile?.vehicleReg = $0 }
                        )
                    )
                }
                .padding(.horizontal)
                
                Button {
                    Task {
                        await viewModel.updateProfile()
                    }
                } label: {
                    HStack {
                        if viewModel.isSaving {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Image(systemName: "checkmark.circle.fill")
                        }
                        Text("Save Profile")
                    }
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Color.brandPrimary)
                    .cornerRadius(10)
                }
                .disabled(viewModel.isSaving)
                .padding(.horizontal)
            }
        }
        .padding(.vertical)
    }
}

// MARK: - Notifications Tab

struct NotificationsTabContent: View {
    @ObservedObject var viewModel: SettingsViewModel
    
    var body: some View {
        VStack(spacing: 20) {
            if let prefs = viewModel.notificationPreferences {
                VStack(spacing: 0) {
                    NotificationToggle(
                        title: "Job Alerts",
                        subtitle: "Receive notifications for new job opportunities",
                        isOn: Binding(
                            get: { viewModel.notificationPreferences?.jobAlerts ?? false },
                            set: { viewModel.notificationPreferences?.jobAlerts = $0 }
                        )
                    )
                    
                    Divider().padding(.leading, 60)
                    
                    NotificationToggle(
                        title: "Push Notifications",
                        subtitle: "Instant notifications on your device",
                        isOn: Binding(
                            get: { viewModel.notificationPreferences?.pushNotifications ?? false },
                            set: { viewModel.notificationPreferences?.pushNotifications = $0 }
                        )
                    )
                    
                    Divider().padding(.leading, 60)
                    
                    NotificationToggle(
                        title: "Email Notifications",
                        subtitle: "Job updates via email",
                        isOn: Binding(
                            get: { viewModel.notificationPreferences?.emailNotifications ?? false },
                            set: { viewModel.notificationPreferences?.emailNotifications = $0 }
                        )
                    )
                    
                    Divider().padding(.leading, 60)
                    
                    NotificationToggle(
                        title: "SMS Notifications",
                        subtitle: "Text messages for urgent updates",
                        isOn: Binding(
                            get: { viewModel.notificationPreferences?.smsNotifications ?? false },
                            set: { viewModel.notificationPreferences?.smsNotifications = $0 }
                        )
                    )
                    
                    Divider().padding(.leading, 60)
                    
                    NotificationToggle(
                        title: "Weekly Reports",
                        subtitle: "Summary of weekly performance",
                        isOn: Binding(
                            get: { viewModel.notificationPreferences?.weeklyReports ?? false },
                            set: { viewModel.notificationPreferences?.weeklyReports = $0 }
                        )
                    )
                    
                    Divider().padding(.leading, 60)
                    
                    NotificationToggle(
                        title: "Marketing Emails",
                        subtitle: "Promotional offers and updates",
                        isOn: Binding(
                            get: { viewModel.notificationPreferences?.marketingEmails ?? false },
                            set: { viewModel.notificationPreferences?.marketingEmails = $0 }
                        )
                    )
                }
                .background(Color(.systemBackground))
                .cornerRadius(12)
                .shadow(color: Color.black.opacity(0.1), radius: 8, x: 0, y: 2)
                .padding(.horizontal)
                
                Button {
                    Task {
                        await viewModel.updateNotificationPreferences()
                    }
                } label: {
                    HStack {
                        if viewModel.isSaving {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Image(systemName: "checkmark.circle.fill")
                        }
                        Text("Save Preferences")
                    }
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Color.brandPrimary)
                    .cornerRadius(10)
                }
                .disabled(viewModel.isSaving)
                .padding(.horizontal)
            }
        }
        .padding(.vertical)
    }
}

// MARK: - Security Tab

struct SecurityTabContent: View {
    @ObservedObject var authViewModel: AuthViewModel
    @Binding var showingLogoutAlert: Bool
    
    var body: some View {
        VStack(spacing: 20) {
            // App Version
            VStack(spacing: 8) {
                Text("App Version")
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
                
                Text(AppConfig.appVersion)
                    .font(.system(size: 16, weight: .semibold))
            }
            .padding(.vertical)
            
            // Support Links
            VStack(spacing: 0) {
                Link(destination: URL(string: "mailto:\(AppConfig.supportEmail)")!) {
                    SettingsRow(
                        icon: "envelope.fill",
                        title: "Email Support",
                        subtitle: AppConfig.supportEmail,
                        showChevron: false
                    )
                }
                
                Divider().padding(.leading, 60)
                
                Link(destination: URL(string: "tel:\(AppConfig.supportPhone.replacingOccurrences(of: " ", with: ""))")!) {
                    SettingsRow(
                        icon: "phone.fill",
                        title: "Call Support",
                        subtitle: AppConfig.supportPhone,
                        showChevron: false
                    )
                }
            }
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.1), radius: 8, x: 0, y: 2)
            .padding(.horizontal)
            
            // Logout Button
            Button {
                showingLogoutAlert = true
            } label: {
                HStack {
                    Image(systemName: "rectangle.portrait.and.arrow.right")
                    Text("Logout")
                }
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(Color.red)
                .cornerRadius(10)
            }
            .padding(.horizontal)
        }
        .padding(.vertical)
    }
}

// MARK: - Helper Views

struct SettingsTextField: View {
    let label: String
    @Binding var text: String
    var keyboardType: UIKeyboardType = .default
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(.secondary)
            
            TextField(label, text: $text)
                .keyboardType(keyboardType)
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(10)
        }
    }
}

struct NotificationToggle: View {
    let title: String
    let subtitle: String
    @Binding var isOn: Bool
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "bell.fill")
                .font(.system(size: 20))
                .foregroundColor(.brandPrimary)
                .frame(width: 40)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 15, weight: .medium))
                
                Text(subtitle)
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Toggle("", isOn: $isOn)
                .labelsHidden()
        }
        .padding()
    }
}

struct SettingsRow: View {
    let icon: String
    let title: String
    let subtitle: String
    var showChevron: Bool = true
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 20))
                .foregroundColor(.brandPrimary)
                .frame(width: 40)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 15, weight: .medium))
                
                Text(subtitle)
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            if showChevron {
                Image(systemName: "chevron.right")
                    .font(.system(size: 14))
                    .foregroundColor(.gray)
            }
        }
        .padding()
    }
}

#Preview {
    SettingsView()
        .environmentObject(AuthViewModel())
}

