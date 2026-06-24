import SwiftUI
import SwiftData
import UIKit

/// Onglet Admin — coffre-fort de documents chiffrés, catégorisé, avec scan + OCR.
struct AdminView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \Document.addedDate, order: .reverse) private var documents: [Document]

    @State private var showScanner = false
    @State private var scanResult: ScanResult?

    private var expiringSoon: [Document] {
        documents.filter { ($0.daysUntilExpiry ?? .max) <= 60 }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                AubeBackground()
                ScrollView {
                    VStack(spacing: 20) {
                        if !expiringSoon.isEmpty { expirySection }
                        ForEach(DocumentCategory.allCases) { category in
                            categorySection(category)
                        }
                        privacyNote
                    }
                    .padding()
                    .padding(.bottom, 24)
                }
            }
            .navigationTitle("Admin")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showScanner = true } label: {
                        Image(systemName: "doc.viewfinder").font(.system(size: 18, weight: .semibold))
                    }
                }
            }
        }
        .fullScreenCover(isPresented: $showScanner) {
            ScanFlow { result in
                scanResult = result
                showScanner = false
            } onCancel: { showScanner = false }
            .ignoresSafeArea()
        }
        .sheet(item: $scanResult) { result in
            ReviewScanSheet(result: result)
        }
    }

    // MARK: - Sections

    private var expirySection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("À renouveler bientôt", systemImage: "exclamationmark.triangle.fill")
                .font(Font2.titleSmall).foregroundStyle(Theme.ink).padding(.leading, 4)
            ForEach(expiringSoon) { doc in
                GlassCard {
                    HStack {
                        Image(systemName: doc.category.symbol).foregroundStyle(Theme.pinkDeep)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(doc.type).font(Font2.bodyMedium(15)).foregroundStyle(Theme.ink)
                            if let d = doc.daysUntilExpiry {
                                Text(d < 0 ? "Expiré" : "Expire dans \(d) j")
                                    .font(Font2.monoLabel).foregroundStyle(Theme.pinkDeep)
                            }
                        }
                        Spacer()
                    }
                }
            }
        }
    }

    private func categorySection(_ category: DocumentCategory) -> some View {
        let docs = documents.filter { $0.category == category }
        return VStack(alignment: .leading, spacing: 10) {
            Label(category.label, systemImage: category.symbol)
                .font(Font2.titleSmall).foregroundStyle(Theme.ink).padding(.leading, 4)
            if docs.isEmpty {
                GlassCard {
                    Text("Aucun document.")
                        .font(Font2.callout).foregroundStyle(Theme.inkSecondary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            } else {
                ForEach(docs) { doc in
                    NavigationLink { DocumentDetailView(document: doc) } label: {
                        documentRow(doc)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private func documentRow(_ doc: Document) -> some View {
        GlassCard {
            HStack(spacing: 14) {
                Image(systemName: "doc.fill")
                    .font(.system(size: 20)).foregroundStyle(Theme.lavenderDeep)
                    .frame(width: 44, height: 44).background(Theme.lavender.opacity(0.15), in: Circle())
                VStack(alignment: .leading, spacing: 2) {
                    Text(doc.type).font(Font2.bodyMedium(16)).foregroundStyle(Theme.ink)
                    Text("Ajouté le \(Formatters.dayMonth.string(from: doc.addedDate))")
                        .font(Font2.monoLabel).foregroundStyle(Theme.inkSecondary)
                }
                Spacer()
                Image(systemName: "chevron.right").font(.system(size: 13)).foregroundStyle(Theme.inkSecondary)
            }
        }
    }

    private var privacyNote: some View {
        Text("Fichiers chiffrés sur l'appareil. L'extraction se fait on-device : rien n'est envoyé à un serveur tiers.")
            .font(Font2.caption).foregroundStyle(Theme.inkSecondary)
            .multilineTextAlignment(.center).padding(.horizontal).padding(.top, 8)
    }
}

/// Résultat d'un scan transmis à la feuille de revue.
struct ScanResult: Identifiable {
    let id = UUID()
    let images: [UIImage]
    let extraction: DocumentExtractor.Result
    let recognizedText: String
}

#Preview {
    AdminView()
        .modelContainer(PersistenceController.preview)
        .environment(AppSettings())
}
