import SwiftUI

/// Anneau « temps depuis la dernière tétée » — signature visuelle de JADA.
/// Affiche la durée écoulée au centre et un arc en dégradé rose → lavande
/// qui se remplit sur un intervalle de référence (par défaut 3 h).
struct FeedingRing: View {
    /// Date de la dernière tétée. `nil` si aucune.
    let lastFeed: Date?
    /// Intervalle de référence pour remplir l'anneau (secondes). Défaut 3 h.
    var referenceInterval: TimeInterval = 3 * 3600
    /// Date « maintenant » injectée pour l'animation.
    let now: Date

    private var elapsed: TimeInterval {
        guard let lastFeed else { return 0 }
        return max(0, now.timeIntervalSince(lastFeed))
    }

    private var progress: Double {
        guard lastFeed != nil else { return 0 }
        return min(1.0, elapsed / referenceInterval)
    }

    var body: some View {
        ZStack {
            Circle()
                .stroke(Theme.cardStroke, lineWidth: 16)

            Circle()
                .trim(from: 0, to: progress)
                .stroke(Theme.ring, style: StrokeStyle(lineWidth: 16, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .animation(.easeInOut(duration: 0.6), value: progress)

            VStack(spacing: 4) {
                Text("Depuis la dernière tétée")
                    .font(Font2.monoLabel)
                    .foregroundStyle(Theme.inkSecondary)
                    .textCase(.uppercase)
                Text(lastFeed == nil ? "—" : Self.format(elapsed))
                    .font(Font2.display(40, relativeTo: .largeTitle))
                    .foregroundStyle(Theme.ink)
                    .contentTransition(.numericText())
                if lastFeed != nil {
                    Text(Self.clock(lastFeed!))
                        .font(Font2.monoData)
                        .foregroundStyle(Theme.inkSecondary)
                }
            }
            .padding(40)
        }
        .frame(width: 240, height: 240)
    }

    static func format(_ interval: TimeInterval) -> String {
        let totalMinutes = Int(interval) / 60
        let h = totalMinutes / 60
        let m = totalMinutes % 60
        if h > 0 { return "\(h)h\(String(format: "%02d", m))" }
        return "\(m) min"
    }

    private static func clock(_ date: Date) -> String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "fr_FR")
        f.dateFormat = "HH:mm"
        return "à \(f.string(from: date))"
    }
}

#Preview {
    ZStack {
        AubeBackground()
        FeedingRing(lastFeed: Date().addingTimeInterval(-5400), now: Date())
    }
}
