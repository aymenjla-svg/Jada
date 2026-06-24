import Foundation

/// Extraction structurée (texte → champs) par règles / templates, on-device.
/// Les données ne quittent jamais l'appareil. Les numéros très sensibles
/// (n° Sécu) sont tronqués avant d'être stockés en métadonnées.
enum DocumentExtractor {

    struct Result {
        var suggestedCategory: DocumentCategory
        var suggestedType: String
        var fields: [String: String]
        var expiryDate: Date?
    }

    static func extract(from text: String) -> Result {
        let lower = text.lowercased()
        var fields: [String: String] = [:]
        var category: DocumentCategory = .identite
        var type = "Document"

        // Dates (NSDataDetector)
        let dates = detectDates(in: text)

        // Carte Vitale — n° Sécu : 15 chiffres (13 + clé 2).
        if lower.contains("vitale") || lower.contains("assurance maladie") || lower.contains("carte d'assuré") {
            category = .santeCouverture
            type = "Carte Vitale"
            if let ssn = detectSocialSecurityNumber(in: text) {
                fields["Numéro"] = maskSSN(ssn)
            }
        } else if lower.contains("mutuelle") || lower.contains("alan") || lower.contains("complémentaire santé") {
            category = .santeCouverture
            type = "Attestation mutuelle"
        } else if lower.contains("acte de naissance") || lower.contains("extrait d'acte") {
            category = .naissance
            type = "Acte de naissance"
        } else if lower.contains("passeport") || lower.contains("passport") {
            category = .identite
            type = "Passeport"
        } else if lower.contains("carte nationale") || lower.contains("carte d'identité") || lower.contains("république française") {
            category = .identite
            type = "Carte d'identité"
        } else if lower.contains("ordonnance") || lower.contains("posologie") || lower.contains("renouvellement") {
            category = .ordonnances
            type = "Ordonnance"
        } else if lower.contains("analyse") || lower.contains("laboratoire") || lower.contains("résultats") {
            category = .ordonnances
            type = "Analyses"
        }

        // Nom / prénom basique
        if let name = detectName(in: text) {
            fields["Titulaire"] = name
        }

        // Date d'expiration : la dernière date future trouvée.
        let expiry = dates.filter { $0 > Date() }.max()
        if let expiry { fields["Expiration"] = format(expiry) }

        return Result(suggestedCategory: category, suggestedType: type, fields: fields, expiryDate: expiry)
    }

    // MARK: - Détecteurs

    private static func detectDates(in text: String) -> [Date] {
        guard let detector = try? NSDataDetector(types: NSTextCheckingResult.CheckingType.date.rawValue) else { return [] }
        let range = NSRange(text.startIndex..<text.endIndex, in: text)
        return detector.matches(in: text, range: range).compactMap { $0.date }
    }

    private static func detectSocialSecurityNumber(in text: String) -> String? {
        // 15 chiffres, éventuellement espacés.
        let pattern = #"[12]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{2}"#
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return nil }
        let range = NSRange(text.startIndex..<text.endIndex, in: text)
        guard let match = regex.firstMatch(in: text, range: range),
              let r = Range(match.range, in: text) else { return nil }
        return String(text[r]).filter { $0.isNumber }
    }

    /// Masque le n° Sécu : ne garde que le sexe + les 2 derniers (clé).
    private static func maskSSN(_ ssn: String) -> String {
        guard ssn.count >= 3 else { return "•••" }
        let first = ssn.prefix(1)
        let last = ssn.suffix(2)
        return "\(first) •• •• •• ••• ••• \(last)"
    }

    private static func detectName(in text: String) -> String? {
        for line in text.split(separator: "\n") {
            let l = line.lowercased()
            if l.contains("nom") || l.contains("né(e)") || l.contains("prénom") {
                let cleaned = line
                    .replacingOccurrences(of: "Nom :", with: "")
                    .replacingOccurrences(of: "Prénom :", with: "")
                    .trimmingCharacters(in: .whitespaces)
                if cleaned.count > 1 { return cleaned }
            }
        }
        return nil
    }

    private static func format(_ date: Date) -> String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "fr_FR")
        f.dateStyle = .long
        return f.string(from: date)
    }
}
