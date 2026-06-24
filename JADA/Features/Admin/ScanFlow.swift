import SwiftUI
import UIKit

/// Pilote la chaîne scan → OCR → extraction, puis remonte un `ScanResult`.
struct ScanFlow: View {
    var onResult: (ScanResult) -> Void
    var onCancel: () -> Void

    @State private var processing = false

    var body: some View {
        ZStack {
            DocumentScanner(onComplete: handle, onCancel: onCancel)
            if processing {
                ZStack {
                    Color.black.opacity(0.5).ignoresSafeArea()
                    VStack(spacing: 14) {
                        ProgressView().controlSize(.large).tint(.white)
                        Text("Lecture du document…").font(Font2.callout).foregroundStyle(.white)
                    }
                }
            }
        }
    }

    private func handle(_ images: [UIImage]) {
        guard let first = images.first else { onCancel(); return }
        processing = true
        Task {
            let text = await TextRecognizer.recognize(first)
            let extraction = DocumentExtractor.extract(from: text)
            await MainActor.run {
                processing = false
                onResult(ScanResult(images: images, extraction: extraction, recognizedText: text))
            }
        }
    }
}

/// Feuille de revue/édition avant enregistrement dans le coffre.
struct ReviewScanSheet: View {
    let result: ScanResult
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss
    @Environment(AppSettings.self) private var settings

    @State private var category: DocumentCategory
    @State private var type: String
    @State private var expiry: Date
    @State private var hasExpiry: Bool

    init(result: ScanResult) {
        self.result = result
        _category = State(initialValue: result.extraction.suggestedCategory)
        _type = State(initialValue: result.extraction.suggestedType)
        _expiry = State(initialValue: result.extraction.expiryDate ?? Date())
        _hasExpiry = State(initialValue: result.extraction.expiryDate != nil)
    }

    var body: some View {
        NavigationStack {
            Form {
                if let img = result.images.first {
                    Section {
                        Image(uiImage: img).resizable().scaledToFit()
                            .frame(maxHeight: 220).frame(maxWidth: .infinity)
                    }
                }
                Section("Classement") {
                    Picker("Catégorie", selection: $category) {
                        ForEach(DocumentCategory.allCases) { Text($0.label).tag($0) }
                    }
                    TextField("Type", text: $type)
                    Toggle("Date d'expiration", isOn: $hasExpiry)
                    if hasExpiry {
                        DatePicker("Expire le", selection: $expiry, displayedComponents: .date)
                    }
                }
                if !result.extraction.fields.isEmpty {
                    Section("Champs extraits (on-device)") {
                        ForEach(result.extraction.fields.sorted(by: { $0.key < $1.key }), id: \.key) { k, v in
                            HStack {
                                Text(k).foregroundStyle(Theme.inkSecondary)
                                Spacer()
                                Text(v).font(Font2.monoData)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Revue du scan")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Annuler") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Enregistrer") { save() }.disabled(type.isEmpty).fontWeight(.semibold)
                }
            }
        }
    }

    private func save() {
        // Le fichier image scanné est stocké chiffré ; jamais envoyé ailleurs.
        guard let img = result.images.first,
              let ref = try? FileVault.saveImage(img, in: .documents) else { dismiss(); return }

        let doc = Document(category: category, type: type, fileRef: ref,
                           expiryDate: hasExpiry ? expiry : nil,
                           extractedFields: result.extraction.fields,
                           createdBy: settings.currentCaregiver)
        context.insert(doc)
        NotificationService.scheduleExpiryReminder(doc)
        try? context.save()
        dismiss()
    }
}
