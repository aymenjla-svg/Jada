import Foundation

/// Qui a créé l'événement (attribution « dernier biberon donné par Maman »).
enum Caregiver: String, Codable, CaseIterable, Identifiable {
    case maman
    case papa

    var id: String { rawValue }

    var label: String {
        switch self {
        case .maman: return "Maman"
        case .papa: return "Papa"
        }
    }

    var symbol: String {
        switch self {
        case .maman: return "person.fill"
        case .papa: return "person.fill"
        }
    }
}
