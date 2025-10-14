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

// MARK: - Profile Tab (FIXED - Editable Fields)

struct ProfileTabContent: View {
    @ObservedObject var viewModel: SettingsViewModel
    
    // Local state for editing
    @State private var editedName: String = ""
    @State private var editedEmail: String = ""
    @State private var editedPhone: String = ""
    @State private var editedEmergencyContact: String = ""
    @State private var editedDrivingLicense: String = ""
    @State private var editedVehicleReg: String = ""
    
    var body: some View {
        VStack(spacing: 20) {
            if let profile = viewModel.profile {
                VStack(spacing: 16) {
                    // Avatar
                    Image(systemName: "person.circle.fill")
                        .font(.system(size: 80))
                        .foregroundColor(.brandPrimary)
                    
                    Text(editedName.isEmpty ? profile.name : editedName)
                        .font(.system(size: 24, weight: .bold))
                    
                    Text(editedEmail.isEmpty ? profile.email : editedEmail)
                        .font(.system(size: 14))
                        .foregroundColor(.secondary)
                }
                .padding(.vertical)
                
                VStack(spacing: 16) {
                    SettingsTextField(
                        label: "Full Name",
                        text: $editedName
                    )
                    
                    SettingsTextField(
                        label: "Email",
                        text: $editedEmail,
                        keyboardType: .emailAddress
                    )
                    
                    SettingsTextField(
                        label: "Phone Number",
                        text: $editedPhone,
                        keyboardType: .phonePad
                    )
                    
                    SettingsTextField(
                        label: "Emergency Contact",
                        text: $editedEmergencyContact,
                        keyboardType: .phonePad
                    )
                    
                    SettingsTextField(
                        label: "Driving License",
                        text: $editedDrivingLicense
                    )
                    
                    SettingsTextField(
                        label: "Vehicle Registration",
                        text: $editedVehicleReg
                    )
                }
                .padding(.horizontal)
                
                Button {
                    Task {
                        await saveProfile()
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
        .onAppear {
            // Initialize local state with profile data
            if let profile = viewModel.profile {
                editedName = profile.name
                editedEmail = profile.email
                editedPhone = profile.phone ?? ""
                editedEmergencyContact = profile.emergencyContact ?? ""
                editedDrivingLicense = profile.drivingLicense ?? ""
                editedVehicleReg = profile.vehicleReg ?? ""
            }
        }
        .onChange(of: viewModel.profile) { newProfile in
            // Update local state when profile changes
            if let profile = newProfile {
                editedName = profile.name
                editedEmail = profile.email
                editedPhone = profile.phone ?? ""
                editedEmergencyContact = profile.emergencyContact ?? ""
                editedDrivingLicense = profile.drivingLicense ?? ""
                editedVehicleReg = profile.vehicleReg ?? ""
            }
        }
    }
    
    private func saveProfile() async {
        // Update viewModel.profile with edited values
        viewModel.profile?.name = editedName
        viewModel.profile?.email = editedEmail
        viewModel.profile?.phone = editedPhone.isEmpty ? nil : editedPhone
        viewModel.profile?.emergencyContact = editedEmergencyContact.isEmpty ? nil : editedEmergencyContact
        viewModel.profile?.drivingLicense = editedDrivingLicense.isEmpty ? nil : editedDrivingLicense
        viewModel.profile?.vehicleReg = editedVehicleReg.isEmpty ? nil : editedVehicleReg
        
        // Call the update function
        await viewModel.updateProfile()
    }
}

// MARK: - Notifications Tab (FIXED - Editable Toggles)

struct NotificationsTabContent: View {
    @ObservedObject var viewModel: SettingsViewModel
    
    // Local state for editing
    @State private var editedJobAlerts: Bool = false
    @State private var editedPushNotifications: Bool = false
    @State private var editedEmailNotifications: Bool = false
    @State private var editedSmsNotifications: Bool = false
    @State private var editedWeeklyReports: Bool = false
    @State private var editedMarketingEmails: Bool = false
    
    var body: some View {
        VStack(spacing: 20) {
            if let prefs = viewModel.notificationPreferences {
                VStack(spacing: 0) {
                    NotificationToggle(
                        title: "Job Alerts",
                        subtitle: "Receive notifications for new job opportunities",
                        isOn: $editedJobAlerts
                    )
                    
                    Divider().padding(.leading, 60)
                    
                    NotificationToggle(
                        title: "Push Notifications",
                        subtitle: "Instant notifications on your device",
                        isOn: $editedPushNotifications
                    )
                    
                    Divider().padding(.leading, 60)
                    
                    NotificationToggle(
                        title: "Email Notifications",
                        subtitle: "Job updates via email",
                        isOn: $editedEmailNotifications
                    )
                    
                    Divider().padding(.leading, 60)
                    
                    NotificationToggle(
                        title: "SMS Notifications",
                        subtitle: "Text messages for urgent updates",
                        isOn: $editedSmsNotifications
                    )
                    
                    Divider().padding(.leading, 60)
                    
                    NotificationToggle(
                        title: "Weekly Reports",
                        subtitle: "Summary of weekly performance",
                        isOn: $editedWeeklyReports
                    )
                    
                    Divider().padding(.leading, 60)
                    
                    NotificationToggle(
                        title: "Marketing Emails",
                        subtitle: "Promotional offers and updates",
                        isOn: $editedMarketingEmails
                    )
                }
                .background(Color(.systemBackground))
                .cornerRadius(12)
                .shadow(color: Color.black.opacity(0.1), radius: 8, x: 0, y: 2)
                .padding(.horizontal)
                
                Button {
                    Task {
                        await savePreferences()
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
        .onAppear {
            // Initialize local state with preferences data
            if let prefs = viewModel.notificationPreferences {
                editedJobAlerts = prefs.jobAlerts
                editedPushNotifications = prefs.pushNotifications
                editedEmailNotifications = prefs.emailNotifications
                editedSmsNotifications = prefs.smsNotifications
                editedWeeklyReports = prefs.weeklyReports
                editedMarketingEmails = prefs.marketingEmails
            }
        }
        .onChange(of: viewModel.notificationPreferences) { newPrefs in
            // Update local state when preferences change
            if let prefs = newPrefs {
                editedJobAlerts = prefs.jobAlerts
                editedPushNotifications = prefs.pushNotifications
                editedEmailNotifications = prefs.emailNotifications
                editedSmsNotifications = prefs.smsNotifications
                editedWeeklyReports = prefs.weeklyReports
                editedMarketingEmails = prefs.marketingEmails
            }
        }
    }
    
    private func savePreferences() async {
        // Update viewModel.notificationPreferences with edited values
        viewModel.notificationPreferences?.jobAlerts = editedJobAlerts
        viewModel.notificationPreferences?.pushNotifications = editedPushNotifications
        viewModel.notificationPreferences?.emailNotifications = editedEmailNotifications
        viewModel.notificationPreferences?.smsNotifications = editedSmsNotifications
        viewModel.notificationPreferences?.weeklyReports = editedWeeklyReports
        viewModel.notificationPreferences?.marketingEmails = editedMarketingEmails
        
        // Call the update function
        await viewModel.updateNotificationPreferences()
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

