import Foundation
import SwiftData

/// Jade. Relation et non hardcode : on prévoit plusieurs enfants à terme.
@Model
final class Child {
    var id: UUID = UUID()
    var name: String = ""
    var birthDate: Date = Date()
    /// Poids de naissance en grammes.
    var birthWeightG: Int?
    /// Taille de naissance en millimètres.
    var birthHeightMm: Int?

    init(name: String, birthDate: Date, birthWeightG: Int? = nil, birthHeightMm: Int? = nil) {
        self.id = UUID()
        self.name = name
        self.birthDate = birthDate
        self.birthWeightG = birthWeightG
        self.birthHeightMm = birthHeightMm
    }

    /// Âge en jours.
    var ageInDays: Int {
        Calendar.current.dateComponents([.day], from: birthDate, to: Date()).day ?? 0
    }

    var ageDescription: String {
        let days = ageInDays
        if days < 31 { return "\(days) j" }
        let months = days / 30
        if months < 24 { return "\(months) mois" }
        return "\(months / 12) ans"
    }
}
