import Foundation
import SwiftData

/// Données de démonstration pour les previews et le premier lancement.
enum SampleData {

    @MainActor
    static func populate(_ context: ModelContext) {
        let cal = Calendar.current
        let birth = cal.date(byAdding: .month, value: -4, to: Date()) ?? Date()

        let jade = Child(name: "Jade", birthDate: birth, birthWeightG: 3240, birthHeightMm: 495)
        context.insert(jade)

        // Tétées / couches récentes
        let now = Date()
        context.insert(FeedingEvent(timestamp: now.addingTimeInterval(-5400), createdBy: .maman,
                                    kind: .sein, side: .gauche, durationSec: 15 * 60))
        context.insert(FeedingEvent(timestamp: now.addingTimeInterval(-5400 - 4 * 3600), createdBy: .papa,
                                    kind: .biberon, volumeMl: 120))
        context.insert(DiaperEvent(timestamp: now.addingTimeInterval(-3600), createdBy: .papa, kind: .pipi))
        context.insert(DiaperEvent(timestamp: now.addingTimeInterval(-7200), createdBy: .maman,
                                   kind: .caca, stoolColor: .jaune))
        context.insert(HydrationEvent(timestamp: now.addingTimeInterval(-9000), createdBy: .maman, volumeMl: 30))

        // Mensurations (courbe)
        for m in 0...4 {
            let date = cal.date(byAdding: .month, value: m, to: birth) ?? birth
            let w = 3240 + m * 750
            let h = 495 + m * 25
            context.insert(MeasurementEvent(timestamp: date, createdBy: .maman,
                                            weightG: w, heightMm: h, headCircMm: 350 + m * 15))
        }

        // Vaccins FR
        for v in FrenchVaccineSchedule.makeVaccines(birthDate: birth) {
            if v.dueAgeMonths <= 2 { v.doneDate = v.dueDate }
            context.insert(v)
        }

        // RDV
        context.insert(Appointment(title: "Visite des 4 mois", practitioner: "Dr Martin",
                                   date: now.addingTimeInterval(3 * 86400), location: "Cabinet pédiatrique"))

        // Historique médical
        context.insert(MedicalEntry(title: "Jaunisse néonatale", date: birth.addingTimeInterval(3 * 86400),
                                    summary: "Photothérapie 48 h en maternité. Résolue."))

        // Documents
        context.insert(Document(category: .santeCouverture, type: "Carte Vitale", fileRef: "sample-vitale",
                                extractedFields: ["Numéro": "2 •• •• •• ••• ••• 42", "Titulaire": "Jade"]))
        context.insert(Document(category: .identite, type: "Passeport", fileRef: "sample-passeport",
                                expiryDate: cal.date(byAdding: .year, value: 4, to: now)))

        try? context.save()
    }

    /// Enfant autonome pour les #Preview (les événements sont requêtés globalement).
    static var previewChild: Child {
        let birth = Calendar.current.date(byAdding: .month, value: -4, to: Date()) ?? Date()
        return Child(name: "Jade", birthDate: birth, birthWeightG: 3240, birthHeightMm: 495)
    }
}
