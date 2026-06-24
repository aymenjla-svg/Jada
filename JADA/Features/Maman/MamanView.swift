import SwiftUI
import SwiftData

/// Onglet Maman — le quotidien de Jade.
struct MamanView: View {
    let child: Child
    @Environment(\.modelContext) private var context

    @Query(sort: \FeedingEvent.timestamp, order: .reverse) private var feeds: [FeedingEvent]
    @Query(sort: \DiaperEvent.timestamp, order: .reverse) private var diapers: [DiaperEvent]
    @Query(sort: \HydrationEvent.timestamp, order: .reverse) private var hydrations: [HydrationEvent]

    @State private var sheet: LogSheet?

    /// Tick d'horloge pour animer l'anneau.
    @State private var now = Date()
    private let clock = Timer.publish(every: 30, on: .main, in: .common).autoconnect()

    var body: some View {
        NavigationStack {
            ZStack {
                AubeBackground()
                ScrollView {
                    VStack(spacing: 24) {
                        header
                        FeedingRing(lastFeed: feeds.first?.timestamp, now: now)
                            .padding(.top, 4)
                        lastEventCard
                        actionGrid
                        timeline
                    }
                    .padding()
                    .padding(.bottom, 24)
                }
            }
            .navigationTitle("")
            .toolbar(.hidden, for: .navigationBar)
        }
        .onReceive(clock) { now = $0 }
        .sheet(item: $sheet) { which in
            switch which {
            case .feeding: LogFeedingSheet(child: child)
            case .hydration: LogHydrationSheet(child: child)
            case .diaperPipi: LogDiaperSheet(child: child, kind: .pipi)
            case .diaperCaca: LogDiaperSheet(child: child, kind: .caca)
            }
            // Le createdBy par défaut suit le caregiver actif (settings).
        }
    }

    // MARK: - Sections

    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("Bonjour")
                    .font(Font2.callout)
                    .foregroundStyle(Theme.inkSecondary)
                Text(child.name)
                    .font(Font2.title)
                    .foregroundStyle(Theme.ink)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 2) {
                Text(child.ageDescription)
                    .font(Font2.monoData)
                    .foregroundStyle(Theme.ink)
                CaregiverBadge()
            }
        }
    }

    private var lastEventCard: some View {
        GlassCard {
            HStack(spacing: 14) {
                if let f = feeds.first {
                    Image(systemName: f.kind.symbol)
                        .font(.system(size: 22))
                        .foregroundStyle(Theme.lavenderDeep)
                        .frame(width: 44, height: 44)
                        .background(Theme.lavender.opacity(0.15), in: Circle())
                    VStack(alignment: .leading, spacing: 3) {
                        Text(f.summary).font(Font2.bodyMedium(16)).foregroundStyle(Theme.ink)
                        Text("\(Formatters.relative(from: f.timestamp, to: now)) · par \(f.createdBy.label)")
                            .font(Font2.caption).foregroundStyle(Theme.inkSecondary)
                    }
                    Spacer()
                } else {
                    Text("Aucun événement encore. Loggez la première tétée 👇")
                        .font(Font2.callout).foregroundStyle(Theme.inkSecondary)
                }
            }
        }
    }

    private var actionGrid: some View {
        let columns = [GridItem(.flexible()), GridItem(.flexible()),
                       GridItem(.flexible()), GridItem(.flexible())]
        return GlassCard {
            LazyVGrid(columns: columns, spacing: 16) {
                ActionChip(title: "Tétée", systemImage: "drop.fill", tint: Theme.pinkDeep) { sheet = .feeding }
                ActionChip(title: "Hydrat.", systemImage: "waterbottle.fill", tint: Theme.waterDeep) { sheet = .hydration }
                ActionChip(title: "Pipi", systemImage: "drop", tint: Theme.lavender) { sheet = .diaperPipi }
                ActionChip(title: "Caca", systemImage: "circle.lefthalf.filled", tint: Theme.plumLight) { sheet = .diaperCaca }
            }
        }
    }

    /// Fil des derniers événements (toutes catégories), trié par date.
    private var timeline: some View {
        let items: [TimelineItem] =
            feeds.prefix(20).map { .init(date: $0.timestamp, symbol: $0.kind.symbol,
                                         text: $0.summary, by: $0.createdBy, tint: Theme.pinkDeep) }
            + diapers.prefix(20).map { .init(date: $0.timestamp, symbol: $0.kind.symbol,
                                             text: $0.summary, by: $0.createdBy, tint: Theme.lavender) }
            + hydrations.prefix(20).map { .init(date: $0.timestamp, symbol: "waterbottle.fill",
                                                text: $0.summary, by: $0.createdBy, tint: Theme.waterDeep) }

        let sorted = items.sorted { $0.date > $1.date }.prefix(15)

        return VStack(alignment: .leading, spacing: 10) {
            Text("Aujourd'hui")
                .font(Font2.titleSmall)
                .foregroundStyle(Theme.ink)
                .padding(.leading, 4)

            GlassCard(padding: 8) {
                if sorted.isEmpty {
                    Text("Rien à afficher.")
                        .font(Font2.callout)
                        .foregroundStyle(Theme.inkSecondary)
                        .padding()
                } else {
                    VStack(spacing: 0) {
                        ForEach(Array(sorted.enumerated()), id: \.offset) { idx, item in
                            EventRow(item: item, now: now)
                            if idx < sorted.count - 1 {
                                Divider().padding(.leading, 52)
                            }
                        }
                    }
                }
            }
        }
    }

    enum LogSheet: Identifiable {
        case feeding, hydration, diaperPipi, diaperCaca
        var id: Int { hashValue }
    }
}

struct TimelineItem {
    let date: Date
    let symbol: String
    let text: String
    let by: Caregiver
    let tint: Color
}

struct EventRow: View {
    let item: TimelineItem
    let now: Date

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: item.symbol)
                .font(.system(size: 16))
                .foregroundStyle(item.tint)
                .frame(width: 36, height: 36)
                .background(item.tint.opacity(0.15), in: Circle())
            VStack(alignment: .leading, spacing: 2) {
                Text(item.text).font(Font2.callout).foregroundStyle(Theme.ink)
                Text("par \(item.by.label)").font(Font2.monoLabel).foregroundStyle(Theme.inkSecondary)
            }
            Spacer()
            Text(Formatters.time.string(from: item.date))
                .font(Font2.monoData)
                .foregroundStyle(Theme.inkSecondary)
        }
        .padding(.vertical, 8)
        .padding(.horizontal, 8)
    }
}

/// Petite pastille indiquant le caregiver actif, qu'on peut basculer.
struct CaregiverBadge: View {
    @Environment(AppSettings.self) private var settings
    var body: some View {
        Menu {
            ForEach(Caregiver.allCases) { c in
                Button(c.label) { settings.currentCaregiver = c }
            }
        } label: {
            HStack(spacing: 4) {
                Image(systemName: "person.crop.circle")
                Text(settings.currentCaregiver.label)
            }
            .font(Font2.monoLabel)
            .foregroundStyle(Theme.lavenderDeep)
        }
    }
}

#Preview {
    MamanView(child: SampleData.previewChild)
        .modelContainer(PersistenceController.preview)
        .environment(AppSettings())
}
