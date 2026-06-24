import Foundation
import SwiftData

/// Entrée d'historique médical (jaunisse, analyses, observations…).
/// Organisation et archivage uniquement — jamais de conseil ni de diagnostic.
@Model
final class MedicalEntry {
    var id: UUID = UUID()
    var title: String = ""
    var date: Date = Date()
    var summary: String = ""
    /// Référence vers un document chiffré joint (analyse, compte-rendu…).
    var attachmentDocumentID: UUID?

    init(title: String, date: Date = Date(), summary: String = "", attachmentDocumentID: UUID? = nil) {
        self.id = UUID()
        self.title = title
        self.date = date
        self.summary = summary
        self.attachmentDocumentID = attachmentDocumentID
    }
}
