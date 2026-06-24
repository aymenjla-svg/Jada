import Foundation
import SwiftData

/// Photo(s) d'un jour donné. Plusieurs photos possibles, une seule « du jour ».
/// Les images sont stockées chiffrées sur disque, référencées par nom de fichier.
@Model
final class DailyPhoto {
    var id: UUID = UUID()
    /// Jour (normalisé à minuit, locale courante).
    var day: Date = Calendar.current.startOfDay(for: Date())
    /// Noms de fichiers chiffrés (dans le coffre photos).
    var photoRefs: [String] = []
    /// Nom de fichier désigné « du jour ».
    var featuredRef: String?
    var caption: String?
    var createdByRaw: String = Caregiver.maman.rawValue

    init(day: Date, photoRefs: [String] = [], featuredRef: String? = nil,
         caption: String? = nil, createdBy: Caregiver) {
        self.id = UUID()
        self.day = Calendar.current.startOfDay(for: day)
        self.photoRefs = photoRefs
        self.featuredRef = featuredRef ?? photoRefs.first
        self.caption = caption
        self.createdByRaw = createdBy.rawValue
    }

    var createdBy: Caregiver { Caregiver(rawValue: createdByRaw) ?? .maman }
}
