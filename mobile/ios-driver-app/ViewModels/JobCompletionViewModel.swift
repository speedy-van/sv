//
//  JobCompletionViewModel.swift
//  Speedy Van Driver
//
//  Handles job completion logic with photos and signature
//

import Foundation
import SwiftUI
import PhotosUI

@MainActor
class JobCompletionViewModel: ObservableObject {
    @Published var photos: [UIImage] = []
    @Published var signature: UIImage?
    @Published var deliveryNotes: String = ""
    @Published var selectedPhotoItem: PhotosPickerItem? {
        didSet {
            Task {
                if let data = try? await selectedPhotoItem?.loadTransferable(type: Data.self),
                   let image = UIImage(data: data) {
                    photos.append(image)
                }
            }
        }
    }
    
    @Published var showSignaturePad = false
    @Published var isSubmitting = false
    @Published var showingSuccess = false
    @Published var showingError = false
    @Published var errorMessage = ""
    @Published var finalEarnings: Double = 0.0
    
    private let job: Job
    private let apiService = APIService.shared
    
    var canSubmit: Bool {
        !photos.isEmpty && signature != nil && !isSubmitting
    }
    
    init(job: Job) {
        self.job = job
    }
    
    func removePhoto(at index: Int) {
        photos.remove(at: index)
    }
    
    func clearSignature() {
        signature = nil
    }
    
    func submitCompletion() {
        guard canSubmit else { return }
        
        isSubmitting = true
        
        Task {
            do {
                // Upload photos
                let photoUrls = try await uploadPhotos()
                
                // Upload signature
                let signatureUrl = try await uploadSignature()
                
                // Submit completion
                let response = try await apiService.completeJob(
                    jobId: job.id,
                    photoUrls: photoUrls,
                    signatureUrl: signatureUrl,
                    notes: deliveryNotes
                )
                
                // Success
                finalEarnings = response.earnings
                isSubmitting = false
                showingSuccess = true
                
                // Notify system
                NotificationCenter.default.post(
                    name: .jobCompleted,
                    object: nil,
                    userInfo: ["jobId": job.id]
                )
                
            } catch {
                isSubmitting = false
                errorMessage = error.localizedDescription
                showingError = true
            }
        }
    }
    
    private func uploadPhotos() async throws -> [String] {
        var urls: [String] = []
        
        for (index, photo) in photos.enumerated() {
            guard let imageData = photo.jpegData(compressionQuality: 0.7) else {
                continue
            }
            
            let url = try await apiService.uploadImage(
                imageData: imageData,
                filename: "proof_\(job.id)_\(index).jpg",
                type: "proof_of_delivery"
            )
            
            urls.append(url)
        }
        
        return urls
    }
    
    private func uploadSignature() async throws -> String {
        guard let signature = signature,
              let imageData = signature.pngData() else {
            throw NSError(domain: "JobCompletion", code: -1,
                         userInfo: [NSLocalizedDescriptionKey: "Invalid signature"])
        }
        
        return try await apiService.uploadImage(
            imageData: imageData,
            filename: "signature_\(job.id).png",
            type: "signature"
        )
    }
}

// MARK: - Notification Names
extension Notification.Name {
    static let jobCompleted = Notification.Name("jobCompleted")
}

