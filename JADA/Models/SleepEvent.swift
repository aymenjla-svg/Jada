import Foundation
import SwiftData

/// Sommeil : début et (optionnel) fin.
@Model
final class SleepEvent: TrackedEvent {
    var id: UUID = UUID()
    var timestamp: Date = Date()
    var createdByRaw: String = Caregiver.maman.rawValue
    var note: String?

    var start: Date = Date()
    var end: Date?

    init(start: Date = Date(), end: Date? = nil, createdBy: Caregiver, note: String? = nil) {
        self.id = UUID()
        self.start = start
        self.end = end
        self.timestamp = start
        self.createdByRaw = createdBy.rawValue
        self.note = note
    }

    var durationSec: TimeInterval? {
        guard let end else { return nil }
        return end.timeIntervalSince(start)
    }

    var summary: String {
        guard let d = durationSec else { return "Sommeil en cours" }
        let m = Int(d) / 60
        return "Sommeil · \(m / 60)h\(String(format: "%02d", m % 60))"
    }
}
