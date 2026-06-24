import Foundation
import SwiftData

/// Configuration du conteneur SwiftData.
///
/// Local-first par défaut. Pour activer la synchro CloudKit en zone partagée
/// (père ↔ mère), voir `Resources/Fonts/README.md` n'est pas le bon endroit —
/// suivez `SETUP.md` : ajoutez l'entitlement iCloud + un conteneur CloudKit,
/// puis passez `cloudKitEnabled` à `true`.
enum PersistenceController {

    /// Tous les modèles de l'app.
    static let schema = Schema([
        Child.self,
        FeedingEvent.self,
        HydrationEvent.self,
        DiaperEvent.self,
        SleepEvent.self,
        MeasurementEvent.self,
        Vaccine.self,
        Appointment.self,
        MedicalEntry.self,
        DailyPhoto.self,
        Document.self,
    ])

    /// Active la synchro CloudKit. Nécessite l'entitlement iCloud configuré
    /// (sinon l'app crashe au lancement). Laisser `false` tant que ce n'est
    /// pas configuré dans Xcode + compte développeur.
    static let cloudKitEnabled = false

    static func makeContainer(inMemory: Bool = false) -> ModelContainer {
        let configuration: ModelConfiguration
        if inMemory {
            configuration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: true)
        } else if cloudKitEnabled {
            configuration = ModelConfiguration(
                schema: schema,
                isStoredInMemoryOnly: false,
                cloudKitDatabase: .automatic
            )
        } else {
            configuration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)
        }

        do {
            return try ModelContainer(for: schema, configurations: [configuration])
        } catch {
            // Si CloudKit est activé mais mal configuré (entitlement / conteneur
            // manquant), on retombe en local plutôt que de planter au lancement.
            if cloudKitEnabled && !inMemory {
                let local = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)
                if let container = try? ModelContainer(for: schema, configurations: [local]) {
                    return container
                }
            }
            fatalError("Impossible de créer le ModelContainer : \(error)")
        }
    }

    /// Conteneur de prévisualisation pré-rempli pour les #Preview.
    @MainActor
    static let preview: ModelContainer = {
        let container = makeContainer(inMemory: true)
        SampleData.populate(container.mainContext)
        return container
    }()
}
