import SwiftUI
import SwiftData
import PhotosUI
import UIKit

/// Onglet Album — une photo par jour. La photo « du jour » est mise en avant,
/// avec un calendrier-vignettes en dessous. Images stockées chiffrées.
struct AlbumView: View {
    let child: Child
    @Environment(\.modelContext) private var context

    @Query(sort: \DailyPhoto.day, order: .reverse) private var photos: [DailyPhoto]
    @Environment(AppSettings.self) private var settings

    @State private var pickerItem: PhotosPickerItem?
    @State private var selectedDay: Date = Calendar.current.startOfDay(for: Date())

    private var todayPhoto: DailyPhoto? {
        let today = Calendar.current.startOfDay(for: Date())
        return photos.first { Calendar.current.isDate($0.day, inSameDayAs: today) }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                AubeBackground()
                ScrollView {
                    VStack(spacing: 20) {
                        featured
                        importButton
                        grid
                    }
                    .padding()
                    .padding(.bottom, 24)
                }
            }
            .navigationTitle("Album")
        }
        .onChange(of: pickerItem) { _, item in
            guard let item else { return }
            Task { await importPhoto(item) }
        }
    }

    // MARK: - Photo du jour

    private var featured: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Photo du jour")
                .font(Font2.titleSmall).foregroundStyle(Theme.ink)
                .frame(maxWidth: .infinity, alignment: .leading).padding(.leading, 4)

            GlassCard(padding: 10) {
                if let photo = todayPhoto, let ref = photo.featuredRef,
                   let image = FileVault.loadImage(ref: ref, in: .photos) {
                    VStack(spacing: 10) {
                        Image(uiImage: image)
                            .resizable().scaledToFill()
                            .frame(height: 320).frame(maxWidth: .infinity)
                            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                        if let caption = photo.caption, !caption.isEmpty {
                            Text(caption).font(Font2.callout).foregroundStyle(Theme.ink)
                        }
                        Text("\(Formatters.full.string(from: photo.day)) · par \(photo.createdBy.label)")
                            .font(Font2.monoLabel).foregroundStyle(Theme.inkSecondary)
                    }
                } else {
                    VStack(spacing: 10) {
                        Image(systemName: "photo.badge.plus")
                            .font(.system(size: 44)).foregroundStyle(Theme.lavender)
                        Text("Pas encore de photo aujourd'hui")
                            .font(Font2.callout).foregroundStyle(Theme.inkSecondary)
                    }
                    .frame(maxWidth: .infinity, minHeight: 220)
                }
            }
        }
    }

    private var importButton: some View {
        PhotosPicker(selection: $pickerItem, matching: .images) {
            Label("Ajouter la photo du jour", systemImage: "plus.circle.fill")
                .font(Font2.bodyMedium(16)).foregroundStyle(.white)
                .frame(maxWidth: .infinity).padding(.vertical, 15)
                .background(Theme.primaryButton, in: Capsule())
                .shadow(color: Theme.plum.opacity(0.25), radius: 10, y: 5)
        }
    }

    // MARK: - Calendrier-vignettes

    private var grid: some View {
        let columns = Array(repeating: GridItem(.flexible(), spacing: 8), count: 3)
        return VStack(alignment: .leading, spacing: 10) {
            Text("Souvenirs")
                .font(Font2.titleSmall).foregroundStyle(Theme.ink)
                .frame(maxWidth: .infinity, alignment: .leading).padding(.leading, 4)

            if photos.isEmpty {
                GlassCard {
                    Text("Vos photos du jour apparaîtront ici, jour après jour.")
                        .font(Font2.callout).foregroundStyle(Theme.inkSecondary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            } else {
                LazyVGrid(columns: columns, spacing: 8) {
                    ForEach(photos) { photo in
                        thumbnail(photo)
                    }
                }
            }
        }
    }

    private func thumbnail(_ photo: DailyPhoto) -> some View {
        ZStack(alignment: .bottomLeading) {
            if let ref = photo.featuredRef, let image = FileVault.loadImage(ref: ref, in: .photos) {
                Image(uiImage: image)
                    .resizable().scaledToFill()
                    .frame(width: 110, height: 110)
                    .clipped()
            } else {
                Rectangle().fill(Theme.cardFill).frame(width: 110, height: 110)
            }
            Text(Formatters.dayMonth.string(from: photo.day))
                .font(Font2.monoLabel).foregroundStyle(.white)
                .padding(4).background(.black.opacity(0.35), in: Capsule()).padding(5)
        }
        .frame(width: 110, height: 110)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    // MARK: - Import

    private func importPhoto(_ item: PhotosPickerItem) async {
        guard let data = try? await item.loadTransferable(type: Data.self),
              let image = UIImage(data: data),
              let ref = try? FileVault.saveImage(image, in: .photos) else { return }

        await MainActor.run {
            let today = Calendar.current.startOfDay(for: Date())
            if let existing = photos.first(where: { Calendar.current.isDate($0.day, inSameDayAs: today) }) {
                existing.photoRefs.append(ref)
                existing.featuredRef = ref
            } else {
                context.insert(DailyPhoto(day: today, photoRefs: [ref], featuredRef: ref,
                                          createdBy: settings.currentCaregiver))
            }
            try? context.save()
            pickerItem = nil
        }
    }
}

#Preview {
    AlbumView(child: SampleData.previewChild)
        .modelContainer(PersistenceController.preview)
        .environment(AppSettings())
}
