import Foundation
import SwiftData

/// Rendez-vous médical.
@Model
final class Appointment {
    var id: UUID = UUID()
    var title: String = ""
    var practitioner: String = ""
    var date: Date = Date()
    var location: String?
    var notes: String?
    var reminderEnabled: Bool = true

    init(title: String, practitioner: String = "", date: Date, location: String? = nil,
         notes: String? = nil, reminderEnabled: Bool = true) {
        self.id = UUID()
        self.title = title
        self.practitioner = practitioner
        self.date = date
        self.location = location
        self.notes = notes
        self.reminderEnabled = reminderEnabled
    }

    var isUpcoming: Bool { date >= Date() }
}
