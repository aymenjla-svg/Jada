import Foundation
import SwiftData

enum DiaperKind: String, Codable, CaseIterable, Identifiable {
    case pipi
    case caca
    case mixte
    var id: String { rawValue }
    var label: String {
        switch self {
        case .pipi: return "Pipi"
        case .caca: return "Caca"
        case .mixte: return "Mixte"
        }
    }
    var symbol: String {
        switch self {
        case .pipi: return "drop"
        case .caca: return "circle.fill"
        case .mixte: return "circle.lefthalf.filled"
        }
    }
}

/// Couleur des selles (suivi descriptif, jamais de diagnostic).
enum StoolColor: String, Codable, CaseIterable, Identifiable {
    case jaune
    case marron
    case vert
    case noir
    case blanc
    case rouge
    var id: String { rawValue }
    var label: String { rawValue.capitalized }
    var hex: UInt32 {
        switch self {
        case .jaune: return 0xE9C46A
        case .marron: return 0x8B5E3C
        case .vert: return 0x6A994E
        case .noir: return 0x2B2B2B
        case .blanc: return 0xF0EAD6
        case .rouge: return 0xC1413B
        }
    }
}

/// Couche : pipi / caca / mixte (+ couleur des selles).
@Model
final class DiaperEvent: TrackedEvent {
    var id: UUID = UUID()
    var timestamp: Date = Date()
    var createdByRaw: String = Caregiver.maman.rawValue
    var note: String?

    var kindRaw: String = DiaperKind.pipi.rawValue
    var stoolColorRaw: String?

    init(timestamp: Date = Date(), createdBy: Caregiver, kind: DiaperKind, stoolColor: StoolColor? = nil, note: String? = nil) {
        self.id = UUID()
        self.timestamp = timestamp
        self.createdByRaw = createdBy.rawValue
        self.kindRaw = kind.rawValue
        self.stoolColorRaw = stoolColor?.rawValue
        self.note = note
    }

    var kind: DiaperKind { DiaperKind(rawValue: kindRaw) ?? .pipi }
    var stoolColor: StoolColor? { stoolColorRaw.flatMap { StoolColor(rawValue: $0) } }

    var summary: String {
        var s = "Couche \(kind.label.lowercased())"
        if let c = stoolColor { s += " · \(c.label.lowercased())" }
        return s
    }
}
