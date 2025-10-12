import Foundation
import CoreLocation
import Combine

// MARK: - Location Service

class LocationService: NSObject, ObservableObject {
    static let shared = LocationService()
    
    @Published var currentLocation: CLLocation?
    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined
    @Published var isTracking = false
    
    private let locationManager = CLLocationManager()
    private let network = NetworkService.shared
    private var updateTimer: Timer?
    private var activeJobId: String?
    
    private override init() {
        super.init()
        setupLocationManager()
    }
    
    // MARK: - Setup
    
    private func setupLocationManager() {
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.distanceFilter = AppConfig.minimumDistanceFilter
        locationManager.allowsBackgroundLocationUpdates = AppConfig.backgroundLocationEnabled
        locationManager.pausesLocationUpdatesAutomatically = false
        locationManager.showsBackgroundLocationIndicator = true
        
        // Check initial authorization status
        if #available(iOS 14.0, *) {
            authorizationStatus = locationManager.authorizationStatus
        } else {
            authorizationStatus = CLLocationManager.authorizationStatus()
        }
    }
    
    // MARK: - Permission Management
    
    func requestPermission() {
        print("📍 Requesting location permission...")
        
        switch authorizationStatus {
        case .notDetermined:
            locationManager.requestWhenInUseAuthorization()
            
        case .authorizedWhenInUse:
            // Request always authorization for background tracking
            locationManager.requestAlwaysAuthorization()
            
        case .denied, .restricted:
            print("⚠️ Location permission denied or restricted")
            
        case .authorizedAlways:
            print("✅ Location permission already granted (always)")
            
        @unknown default:
            break
        }
    }
    
    // MARK: - Tracking Control
    
    func startTracking(for jobId: String) {
        print("📍 Starting location tracking for job: \(jobId)")
        
        activeJobId = jobId
        isTracking = true
        
        // Request permission if needed
        if authorizationStatus == .notDetermined {
            requestPermission()
        }
        
        // Start location updates
        locationManager.startUpdatingLocation()
        
        // Start timer for periodic updates
        updateTimer = Timer.scheduledTimer(
            withTimeInterval: AppConfig.locationUpdateInterval,
            repeats: true
        ) { [weak self] _ in
            self?.sendLocationUpdate()
        }
    }
    
    func stopTracking() {
        print("📍 Stopping location tracking")
        
        isTracking = false
        activeJobId = nil
        
        locationManager.stopUpdatingLocation()
        updateTimer?.invalidate()
        updateTimer = nil
    }
    
    // MARK: - Location Updates
    
    private func sendLocationUpdate() {
        guard let location = currentLocation,
              let jobId = activeJobId else {
            print("⚠️ Cannot send location update: no location or job ID")
            return
        }
        
        print("📍 Sending location update...")
        
        Task {
            do {
                let request = LocationUpdateRequest(
                    bookingId: jobId,
                    latitude: location.coordinate.latitude,
                    longitude: location.coordinate.longitude,
                    accuracy: location.horizontalAccuracy
                )
                
                let response: LocationUpdateResponse = try await network.request(
                    .sendLocation,
                    method: .post,
                    body: request
                )
                
                if response.success {
                    print("✅ Location update sent successfully")
                } else {
                    print("⚠️ Location update failed: \(response.error ?? "Unknown error")")
                }
            } catch {
                print("❌ Failed to send location update: \(error.localizedDescription)")
            }
        }
    }
    
    // MARK: - Manual Location Update
    
    func sendManualUpdate(for jobId: String) {
        guard let location = currentLocation else { return }
        
        Task {
            do {
                let request = LocationUpdateRequest(
                    bookingId: jobId,
                    latitude: location.coordinate.latitude,
                    longitude: location.coordinate.longitude,
                    accuracy: location.horizontalAccuracy
                )
                
                let _: LocationUpdateResponse = try await network.request(
                    .sendLocation,
                    method: .post,
                    body: request
                )
            } catch {
                print("❌ Manual location update failed: \(error.localizedDescription)")
            }
        }
    }
}

// MARK: - CLLocationManagerDelegate

extension LocationService: CLLocationManagerDelegate {
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        
        currentLocation = location
        
        print("📍 Location updated: \(location.coordinate.latitude), \(location.coordinate.longitude)")
        
        // Send immediate update if tracking
        if isTracking {
            sendLocationUpdate()
        }
    }
    
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("❌ Location error: \(error.localizedDescription)")
    }
    
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        if #available(iOS 14.0, *) {
            authorizationStatus = manager.authorizationStatus
        } else {
            authorizationStatus = CLLocationManager.authorizationStatus()
        }
        
        print("📍 Location authorization changed: \(authorizationStatus.rawValue)")
        
        // Start tracking if authorized and tracking was requested
        if authorizationStatus == .authorizedAlways || authorizationStatus == .authorizedWhenInUse {
            if isTracking {
                locationManager.startUpdatingLocation()
            }
        }
    }
}

