import Foundation
import SwiftData

/// Vaccin du calendrier vaccinal français.
@Model
final class Vaccine {
    var id: UUID = UUID()
    var name: String = ""
    /// Âge recommandé en mois (calendrier FR).
    var dueAgeMonths: Int = 0
    /// Date d'échéance calculée (dérivée de la naissance + dueAgeMonths) ou saisie.
    var dueDate: Date?
    var doneDate: Date?
    var reminderEnabled: Bool = true
    /// Description courte / maladies couvertes.
    var detail: String = ""

    init(name: String, dueAgeMonths: Int, dueDate: Date? = nil, doneDate: Date? = nil,
         reminderEnabled: Bool = true, detail: String = "") {
        self.id = UUID()
        self.name = name
        self.dueAgeMonths = dueAgeMonths
        self.dueDate = dueDate
        self.doneDate = doneDate
        self.reminderEnabled = reminderEnabled
        self.detail = detail
    }

    var isDone: Bool { doneDate != nil }
}
