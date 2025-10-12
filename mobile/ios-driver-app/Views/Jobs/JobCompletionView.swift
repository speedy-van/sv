//
//  JobCompletionView.swift
//  Speedy Van Driver
//
//  Complete job with proof of delivery (photos + signature)
//

import SwiftUI
import PhotosUI

struct JobCompletionView: View {
    @StateObject private var viewModel: JobCompletionViewModel
    @Environment(\.dismiss) private var dismiss
    
    let job: Job
    
    init(job: Job) {
        self.job = job
        _viewModel = StateObject(wrappedValue: JobCompletionViewModel(job: job))
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Job Summary
                    jobSummary
                    
                    // Photo Upload Section
                    photoSection
                    
                    // Signature Section
                    signatureSection
                    
                    // Notes Section
                    notesSection
                    
                    // Completion Button
                    completionButton
                }
                .padding()
            }
            .navigationTitle("Complete Job")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
            .alert("Job Completed!", isPresented: $viewModel.showingSuccess) {
                Button("OK") {
                    dismiss()
                }
            } message: {
                Text("You earned £\(viewModel.finalEarnings, specifier: "%.2f")")
            }
            .alert("Error", isPresented: $viewModel.showingError) {
                Button("OK") {}
            } message: {
                Text(viewModel.errorMessage)
            }
            .overlay {
                if viewModel.isSubmitting {
                    ProgressView("Submitting...")
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(12)
                        .shadow(radius: 10)
                }
            }
        }
    }
    
    // MARK: - Job Summary
    private var jobSummary: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Job #\(job.reference)")
                .font(.headline)
            
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Customer")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(job.customer)
                        .font(.subheadline.bold())
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text("Earnings")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("£\(job.estimatedEarnings)")
                        .font(.title3.bold())
                        .foregroundColor(.green)
                }
            }
            
            Divider()
            
            HStack {
                Image(systemName: "mappin.circle.fill")
                    .foregroundColor(.green)
                Text(job.from)
                    .font(.caption)
                    .lineLimit(1)
            }
            
            HStack {
                Image(systemName: "flag.circle.fill")
                    .foregroundColor(.red)
                Text(job.to)
                    .font(.caption)
                    .lineLimit(1)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
    
    // MARK: - Photo Section
    private var photoSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Proof of Delivery Photos")
                    .font(.headline)
                
                Spacer()
                
                Text("\(viewModel.photos.count)/5")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Text("Take photos of the delivered items")
                .font(.caption)
                .foregroundColor(.secondary)
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    // Existing photos
                    ForEach(viewModel.photos.indices, id: \.self) { index in
                        ZStack(alignment: .topTrailing) {
                            Image(uiImage: viewModel.photos[index])
                                .resizable()
                                .scaledToFill()
                                .frame(width: 120, height: 120)
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                            
                            Button(action: { viewModel.removePhoto(at: index) }) {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.white)
                                    .background(Color.red.clipShape(Circle()))
                                    .padding(4)
                            }
                        }
                    }
                    
                    // Add photo button
                    if viewModel.photos.count < 5 {
                        PhotosPicker(selection: $viewModel.selectedPhotoItem,
                                   matching: .images) {
                            VStack {
                                Image(systemName: "camera.fill")
                                    .font(.title)
                                Text("Add Photo")
                                    .font(.caption)
                            }
                            .frame(width: 120, height: 120)
                            .background(Color(.systemGray5))
                            .foregroundColor(.primary)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                    }
                }
            }
            
            if viewModel.photos.isEmpty {
                Text("⚠️ At least one photo is required")
                    .font(.caption)
                    .foregroundColor(.orange)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 5)
    }
    
    // MARK: - Signature Section
    private var signatureSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Customer Signature")
                .font(.headline)
            
            Text("Ask customer to sign below")
                .font(.caption)
                .foregroundColor(.secondary)
            
            ZStack {
                Rectangle()
                    .fill(Color(.systemGray6))
                    .frame(height: 200)
                    .cornerRadius(12)
                
                if let signature = viewModel.signature {
                    Image(uiImage: signature)
                        .resizable()
                        .scaledToFit()
                        .frame(height: 200)
                } else {
                    VStack {
                        Image(systemName: "pencil.tip")
                            .font(.title)
                            .foregroundColor(.secondary)
                        Text("Tap to sign")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .onTapGesture {
                viewModel.showSignaturePad = true
            }
            
            if viewModel.signature != nil {
                Button(action: { viewModel.clearSignature() }) {
                    HStack {
                        Image(systemName: "arrow.counterclockwise")
                        Text("Clear Signature")
                    }
                    .font(.caption)
                    .foregroundColor(.red)
                }
            }
            
            if viewModel.signature == nil {
                Text("⚠️ Signature is required")
                    .font(.caption)
                    .foregroundColor(.orange)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 5)
        .sheet(isPresented: $viewModel.showSignaturePad) {
            SignaturePadView(signature: $viewModel.signature)
        }
    }
    
    // MARK: - Notes Section
    private var notesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Delivery Notes (Optional)")
                .font(.headline)
            
            TextEditor(text: $viewModel.deliveryNotes)
                .frame(height: 100)
                .padding(8)
                .background(Color(.systemGray6))
                .cornerRadius(8)
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color(.systemGray4), lineWidth: 1)
                )
            
            Text("Any special notes about the delivery")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 5)
    }
    
    // MARK: - Completion Button
    private var completionButton: some View {
        Button(action: { viewModel.submitCompletion() }) {
            HStack {
                Image(systemName: "checkmark.circle.fill")
                Text("Complete Job")
                    .font(.headline)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(viewModel.canSubmit ? Color.green : Color.gray)
            .foregroundColor(.white)
            .cornerRadius(12)
        }
        .disabled(!viewModel.canSubmit)
    }
}

// MARK: - Signature Pad View

struct SignaturePadView: View {
    @Binding var signature: UIImage?
    @Environment(\.dismiss) private var dismiss
    @State private var currentPath = Path()
    @State private var paths: [Path] = []
    
    var body: some View {
        NavigationView {
            VStack {
                Canvas { context, size in
                    for path in paths {
                        context.stroke(path, with: .color(.black), lineWidth: 2)
                    }
                    context.stroke(currentPath, with: .color(.black), lineWidth: 2)
                }
                .background(Color.white)
                .gesture(
                    DragGesture(minimumDistance: 0)
                        .onChanged { value in
                            let point = value.location
                            if currentPath.isEmpty {
                                currentPath.move(to: point)
                            } else {
                                currentPath.addLine(to: point)
                            }
                        }
                        .onEnded { _ in
                            paths.append(currentPath)
                            currentPath = Path()
                        }
                )
                
                HStack(spacing: 16) {
                    Button(action: {
                        paths.removeAll()
                        currentPath = Path()
                    }) {
                        Text("Clear")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color(.systemGray5))
                            .foregroundColor(.primary)
                            .cornerRadius(12)
                    }
                    
                    Button(action: {
                        signature = captureSignature()
                        dismiss()
                    }) {
                        Text("Done")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                    }
                    .disabled(paths.isEmpty)
                }
                .padding()
            }
            .navigationTitle("Customer Signature")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
    
    private func captureSignature() -> UIImage {
        let renderer = ImageRenderer(content: Canvas { context, size in
            for path in paths {
                context.stroke(path, with: .color(.black), lineWidth: 2)
            }
        })
        return renderer.uiImage ?? UIImage()
    }
}

// MARK: - Preview
#if DEBUG
struct JobCompletionView_Previews: PreviewProvider {
    static var previews: some View {
        JobCompletionView(job: Job.mockData)
    }
}
#endif

