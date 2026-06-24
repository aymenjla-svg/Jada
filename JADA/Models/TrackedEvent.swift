import Foundation

/// Base commune à tous les événements horodatés.
/// Écritures additives (event-sourcing léger) pour éviter les conflits CloudKit
/// entre les deux utilisateurs.
protocol TrackedEvent: Identifiable {
    var id: UUID { get }
    var timestamp: Date { get }
    var createdByRaw: String { get }
    var note: String? { get }
}

extension TrackedEvent {
    var createdBy: Caregiver { Caregiver(rawValue: createdByRaw) ?? .maman }
}
