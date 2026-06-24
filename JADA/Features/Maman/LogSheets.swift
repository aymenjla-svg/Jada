import SwiftUI
import SwiftData

/// En-tête commun aux feuilles de saisie.
private struct SheetScaffold<Content: View>: View {
    let title: String
    let onSave: () -> Void
    var saveDisabled: Bool = false
    @ViewBuilder var content: Content
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ZStack {
                AubeBackground()
                ScrollView {
                    VStack(spacing: 20) { content }
                        .padding()
                }
            }
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Annuler") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Enregistrer") { onSave(); dismiss() }
                        .disabled(saveDisabled)
                        .fontWeight(.semibold)
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}

// MARK: - Tétée

struct LogFeedingSheet: View {
    let child: Child
    @Environment(\.modelContext) private var context
    @Environment(AppSettings.self) private var settings

    @State private var kind: FeedingKind = .sein
    @State private var side: BreastSide = .gauche
    @State private var minutes: Double = 15
    @State private var volume = ""
    @State private var by: Caregiver = .maman
    @State private var when = Date()

    var body: some View {
        SheetScaffold(title: "Tétée", onSave: save) {
            GlassCard {
                VStack(spacing: 18) {
                    Picker("Type", selection: $kind) {
                        ForEach(FeedingKind.allCases) { Text($0.label).tag($0) }
                    }
                    .pickerStyle(.segmented)

                    if kind == .sein {
                        labeled("Côté") {
                            Picker("Côté", selection: $side) {
                                Text("Gauche").tag(BreastSide.gauche)
                                Text("Droite").tag(BreastSide.droite)
                            }
                            .pickerStyle(.segmented)
                        }
                        labeled("Durée : \(Int(minutes)) min") {
                            Slider(value: $minutes, in: 1...45, step: 1)
                                .tint(Theme.pinkDeep)
                        }
                    } else {
                        labeled("Volume (ml)") {
                            TextField("120", text: $volume)
                                .keyboardType(.numberPad)
                                .font(Font2.monoData)
                                .textFieldStyle(.roundedBorder)
                        }
                    }
                }
            }
            commonFields(by: $by, when: $when)
        }
        .onAppear { by = settings.currentCaregiver }
    }

    private func save() {
        let event = FeedingEvent(
            timestamp: when, createdBy: by, kind: kind,
            side: kind == .sein ? side : .na,
            durationSec: kind == .sein ? Int(minutes) * 60 : nil,
            volumeMl: kind == .biberon ? Int(volume) : nil
        )
        context.insert(event)
        try? context.save()
    }
}

// MARK: - Hydratation

struct LogHydrationSheet: View {
    let child: Child
    @Environment(\.modelContext) private var context
    @Environment(AppSettings.self) private var settings

    @State private var volume = "30"
    @State private var product = "Adiaryl"
    @State private var by: Caregiver = .maman
    @State private var when = Date()

    var body: some View {
        SheetScaffold(title: "Hydratation", onSave: save, saveDisabled: Int(volume) == nil) {
            GlassCard {
                VStack(spacing: 18) {
                    labeled("Produit") {
                        TextField("Adiaryl", text: $product)
                            .font(Font2.bodyDefault)
                            .textFieldStyle(.roundedBorder)
                    }
                    labeled("Volume (ml)") {
                        TextField("30", text: $volume)
                            .keyboardType(.numberPad)
                            .font(Font2.monoData)
                            .textFieldStyle(.roundedBorder)
                    }
                }
            }
            commonFields(by: $by, when: $when)
        }
        .onAppear { by = settings.currentCaregiver }
    }

    private func save() {
        guard let v = Int(volume) else { return }
        context.insert(HydrationEvent(timestamp: when, createdBy: by, volumeMl: v, product: product))
        try? context.save()
    }
}

// MARK: - Couche

struct LogDiaperSheet: View {
    let child: Child
    let kind: DiaperKind
    @Environment(\.modelContext) private var context
    @Environment(AppSettings.self) private var settings

    @State private var color: StoolColor = .jaune
    @State private var by: Caregiver = .maman
    @State private var when = Date()

    var body: some View {
        SheetScaffold(title: "Couche · \(kind.label)", onSave: save) {
            if kind != .pipi {
                GlassCard {
                    labeled("Couleur des selles") {
                        let cols = [GridItem(.adaptive(minimum: 64))]
                        LazyVGrid(columns: cols, spacing: 12) {
                            ForEach(StoolColor.allCases) { c in
                                Button { color = c } label: {
                                    VStack(spacing: 6) {
                                        Circle()
                                            .fill(Color(hex: c.hex))
                                            .frame(width: 40, height: 40)
                                            .overlay(Circle().strokeBorder(
                                                color == c ? Theme.plum : .clear, lineWidth: 2.5))
                                        Text(c.label).font(Font2.monoLabel).foregroundStyle(Theme.ink)
                                    }
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                }
            }
            commonFields(by: $by, when: $when)
        }
        .onAppear { by = settings.currentCaregiver }
    }

    private func save() {
        context.insert(DiaperEvent(timestamp: when, createdBy: by, kind: kind,
                                   stoolColor: kind == .pipi ? nil : color))
        try? context.save()
    }
}

// MARK: - Champs partagés

@ViewBuilder
private func labeled<Content: View>(_ label: String, @ViewBuilder content: () -> Content) -> some View {
    VStack(alignment: .leading, spacing: 8) {
        Text(label.uppercased())
            .font(Font2.monoLabel)
            .foregroundStyle(Theme.inkSecondary)
        content()
    }
    .frame(maxWidth: .infinity, alignment: .leading)
}

@ViewBuilder
private func commonFields(by: Binding<Caregiver>, when: Binding<Date>) -> some View {
    GlassCard {
        VStack(spacing: 16) {
            labeled("Qui ?") { CaregiverToggle(selection: by) }
            Divider()
            DatePicker("Quand ?", selection: when)
                .font(Font2.bodyDefault)
                .tint(Theme.lavenderDeep)
        }
    }
}
