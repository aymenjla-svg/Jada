import Foundation
import SwiftData

/// Hydratation / Adiaryl (solution de réhydratation).
@Model
final class HydrationEvent: TrackedEvent {
    var id: UUID = UUID()
    var timestamp: Date = Date()
    var createdByRaw: String = Caregiver.maman.rawValue
    var note: String?

    var volumeMl: Int = 0
    var product: String = "Adiaryl"

    init(timestamp: Date = Date(), createdBy: Caregiver, volumeMl: Int, product: String = "Adiaryl", note: String? = nil) {
        self.id = UUID()
        self.timestamp = timestamp
        self.createdByRaw = createdBy.rawValue
        self.volumeMl = volumeMl
        self.product = product
        self.note = note
    }

    var summary: String { "\(product) · \(volumeMl) ml" }
}
