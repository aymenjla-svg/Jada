import Foundation
import SwiftData

/// Mensurations : poids (g), taille (mm), périmètre crânien (mm).
@Model
final class MeasurementEvent: TrackedEvent {
    var id: UUID = UUID()
    var timestamp: Date = Date()
    var createdByRaw: String = Caregiver.maman.rawValue
    var note: String?

    var weightG: Int?
    var heightMm: Int?
    var headCircMm: Int?

    init(timestamp: Date = Date(), createdBy: Caregiver, weightG: Int? = nil, heightMm: Int? = nil, headCircMm: Int? = nil, note: String? = nil) {
        self.id = UUID()
        self.timestamp = timestamp
        self.createdByRaw = createdBy.rawValue
        self.weightG = weightG
        self.heightMm = heightMm
        self.headCircMm = headCircMm
        self.note = note
    }

    var summary: String {
        var parts: [String] = []
        if let w = weightG { parts.append(String(format: "%.2f kg", Double(w) / 1000)) }
        if let h = heightMm { parts.append(String(format: "%.1f cm", Double(h) / 10)) }
        if let p = headCircMm { parts.append("PC \(String(format: "%.1f", Double(p) / 10)) cm") }
        return parts.joined(separator: " · ")
    }
}
