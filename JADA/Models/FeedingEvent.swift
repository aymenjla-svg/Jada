import Foundation
import SwiftData

enum FeedingKind: String, Codable, CaseIterable, Identifiable {
    case sein
    case biberon
    var id: String { rawValue }
    var label: String { self == .sein ? "Sein" : "Biberon" }
    var symbol: String { self == .sein ? "drop.fill" : "waterbottle.fill" }
}

enum BreastSide: String, Codable, CaseIterable, Identifiable {
    case gauche
    case droite
    case na
    var id: String { rawValue }
    var label: String {
        switch self {
        case .gauche: return "Gauche"
        case .droite: return "Droite"
        case .na: return "—"
        }
    }
    var short: String {
        switch self {
        case .gauche: return "G"
        case .droite: return "D"
        case .na: return ""
        }
    }
}

/// Tétée : sein (G/D + durée) ou biberon (volume).
@Model
final class FeedingEvent: TrackedEvent {
    var id: UUID = UUID()
    var timestamp: Date = Date()
    var createdByRaw: String = Caregiver.maman.rawValue
    var note: String?

    var kindRaw: String = FeedingKind.sein.rawValue
    var sideRaw: String = BreastSide.na.rawValue
    var durationSec: Int?
    var volumeMl: Int?

    init(timestamp: Date = Date(), createdBy: Caregiver, kind: FeedingKind,
         side: BreastSide = .na, durationSec: Int? = nil, volumeMl: Int? = nil, note: String? = nil) {
        self.id = UUID()
        self.timestamp = timestamp
        self.createdByRaw = createdBy.rawValue
        self.kindRaw = kind.rawValue
        self.sideRaw = side.rawValue
        self.durationSec = durationSec
        self.volumeMl = volumeMl
        self.note = note
    }

    var kind: FeedingKind { FeedingKind(rawValue: kindRaw) ?? .sein }
    var side: BreastSide { BreastSide(rawValue: sideRaw) ?? .na }

    var summary: String {
        switch kind {
        case .sein:
            let dur = durationSec.map { " · \($0 / 60) min" } ?? ""
            let s = side == .na ? "" : " \(side.short)"
            return "Tétée\(s)\(dur)"
        case .biberon:
            let vol = volumeMl.map { " · \($0) ml" } ?? ""
            return "Biberon\(vol)"
        }
    }
}
