import SwiftUI
import SwiftData
import UIKit

/// Détail d'un document : aperçu déchiffré + métadonnées extraites.
struct DocumentDetailView: View {
    let document: Document
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss
    @State private var showDeleteConfirm = false

    private var image: UIImage? {
        FileVault.loadImage(ref: document.fileRef, in: .documents)
    }

    var body: some View {
        ZStack {
            AubeBackground()
            ScrollView {
                VStack(spacing: 18) {
                    GlassCard(padding: 10) {
                        if let image {
                            Image(uiImage: image).resizable().scaledToFit()
                                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                        } else {
                            VStack(spacing: 8) {
                                Image(systemName: "doc.fill").font(.system(size: 40)).foregroundStyle(Theme.lavender)
                                Text("Aperçu indisponible").font(Font2.callout).foregroundStyle(Theme.inkSecondary)
                            }
                            .frame(maxWidth: .infinity, minHeight: 200)
                        }
                    }

                    GlassCard {
                        VStack(alignment: .leading, spacing: 12) {
                            infoRow("Catégorie", document.category.label)
                            Divider()
                            infoRow("Type", document.type)
                            if let expiry = document.expiryDate {
                                Divider()
                                infoRow("Expiration", Formatters.full.string(from: expiry))
                            }
                            Divider()
                            infoRow("Ajouté le", Formatters.full.string(from: document.addedDate))
                        }
                    }

                    if !document.extractedFields.isEmpty {
                        GlassCard {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Champs extraits").font(Font2.titleSmall).foregroundStyle(Theme.ink)
                                ForEach(document.extractedFields.sorted(by: { $0.key < $1.key }), id: \.key) { k, v in
                                    infoRow(k, v)
                                }
                            }
                        }
                    }

                    Button(role: .destructive) { showDeleteConfirm = true } label: {
                        Label("Supprimer", systemImage: "trash")
                            .font(Font2.bodyMedium(15)).foregroundStyle(.red)
                    }
                    .padding(.top, 4)
                }
                .padding()
            }
        }
        .navigationTitle(document.type)
        .navigationBarTitleDisplayMode(.inline)
        .confirmationDialog("Supprimer ce document ?", isPresented: $showDeleteConfirm, titleVisibility: .visible) {
            Button("Supprimer", role: .destructive) { delete() }
            Button("Annuler", role: .cancel) {}
        }
    }

    private func infoRow(_ label: String, _ value: String) -> some View {
        HStack(alignment: .top) {
            Text(label).font(Font2.callout).foregroundStyle(Theme.inkSecondary)
            Spacer()
            Text(value).font(Font2.monoData).foregroundStyle(Theme.ink)
                .multilineTextAlignment(.trailing)
        }
    }

    private func delete() {
        FileVault.delete(ref: document.fileRef, in: .documents)
        NotificationService.cancel(id: "doc-\(document.id)")
        context.delete(document)
        try? context.save()
        dismiss()
    }
}
