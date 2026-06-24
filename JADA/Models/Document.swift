import Foundation
import SwiftData

/// Catégorie de document (coffre-fort Admin).
enum DocumentCategory: String, Codable, CaseIterable, Identifiable {
    case identite
    case santeCouverture
    case naissance
    case ordonnances

    var id: String { rawValue }
    var label: String {
        switch self {
        case .identite: return "Identité"
        case .santeCouverture: return "Santé & couverture"
        case .naissance: return "Naissance"
        case .ordonnances: return "Ordonnances & analyses"
        }
    }
    var symbol: String {
        switch self {
        case .identite: return "person.text.rectangle"
        case .santeCouverture: return "cross.case"
        case .naissance: return "doc.text"
        case .ordonnances: return "pills"
        }
    }
}

/// Document scanné, stocké chiffré. Les métadonnées extraites alimentent
/// fiches et rappels (ex. « la CNI expire dans 2 mois »).
@Model
final class Document {
    var id: UUID = UUID()
    var categoryRaw: String = DocumentCategory.identite.rawValue
    /// Type précis (« Carte Vitale », « Acte de naissance »…).
    var type: String = ""
    /// Nom du fichier chiffré (PDF/image) dans le coffre documents.
    var fileRef: String = ""
    var addedDate: Date = Date()
    var expiryDate: Date?
    /// Champs extraits (clé → valeur), n° sensibles déjà tronqués.
    var extractedFields: [String: String] = [:]
    var createdByRaw: String = Caregiver.maman.rawValue

    init(category: DocumentCategory, type: String, fileRef: String, addedDate: Date = Date(),
         expiryDate: Date? = nil, extractedFields: [String: String] = [:], createdBy: Caregiver = .maman) {
        self.id = UUID()
        self.categoryRaw = category.rawValue
        self.type = type
        self.fileRef = fileRef
        self.addedDate = addedDate
        self.expiryDate = expiryDate
        self.extractedFields = extractedFields
        self.createdByRaw = createdBy.rawValue
    }

    var category: DocumentCategory { DocumentCategory(rawValue: categoryRaw) ?? .identite }
    var createdBy: Caregiver { Caregiver(rawValue: createdByRaw) ?? .maman }

    /// Jours restants avant expiration (négatif si expiré).
    var daysUntilExpiry: Int? {
        guard let expiryDate else { return nil }
        return Calendar.current.dateComponents([.day], from: Date(), to: expiryDate).day
    }
}
