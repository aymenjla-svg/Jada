import Foundation

/// Calendrier vaccinal français (nourrisson) — pré-rempli à la création de l'enfant.
/// Source : calendrier des vaccinations en vigueur (11 vaccins obligatoires < 2 ans).
/// JADA range et rappelle ; elle ne donne aucun conseil médical.
enum FrenchVaccineSchedule {

    struct Item {
        let name: String
        let dueAgeMonths: Int
        let detail: String
    }

    static let items: [Item] = [
        Item(name: "DTP-Coq-Hib-Hép B (1re dose)", dueAgeMonths: 2,
             detail: "Diphtérie, tétanos, poliomyélite, coqueluche, Hib, hépatite B"),
        Item(name: "Pneumocoque (1re dose)", dueAgeMonths: 2,
             detail: "Infections à pneumocoque"),
        Item(name: "DTP-Coq-Hib-Hép B (2e dose)", dueAgeMonths: 4,
             detail: "Diphtérie, tétanos, poliomyélite, coqueluche, Hib, hépatite B"),
        Item(name: "Pneumocoque (2e dose)", dueAgeMonths: 4,
             detail: "Infections à pneumocoque"),
        Item(name: "DTP-Coq-Hib-Hép B (rappel)", dueAgeMonths: 11,
             detail: "Rappel diphtérie, tétanos, poliomyélite, coqueluche, Hib, hépatite B"),
        Item(name: "Pneumocoque (rappel)", dueAgeMonths: 11,
             detail: "Rappel infections à pneumocoque"),
        Item(name: "Méningocoque C", dueAgeMonths: 5,
             detail: "Infections à méningocoque C"),
        Item(name: "Méningocoque C (rappel)", dueAgeMonths: 12,
             detail: "Rappel infections à méningocoque C"),
        Item(name: "ROR (1re dose)", dueAgeMonths: 12,
             detail: "Rougeole, oreillons, rubéole"),
        Item(name: "ROR (2e dose)", dueAgeMonths: 16,
             detail: "Rougeole, oreillons, rubéole"),
        Item(name: "Méningocoque B", dueAgeMonths: 3,
             detail: "Infections à méningocoque B"),
    ]

    /// Crée les entités Vaccine avec dates d'échéance calculées depuis la naissance.
    static func makeVaccines(birthDate: Date) -> [Vaccine] {
        let cal = Calendar.current
        return items.map { item in
            let due = cal.date(byAdding: .month, value: item.dueAgeMonths, to: birthDate)
            return Vaccine(name: item.name, dueAgeMonths: item.dueAgeMonths,
                           dueDate: due, detail: item.detail)
        }
    }
}
