import Foundation
import SwiftUI

/// Préférences locales (qui utilise l'app maintenant, options d'extraction…).
@Observable
final class AppSettings {
    /// Caregiver actif sur cet appareil. Sert à remplir `createdBy`.
    var currentCaregiver: Caregiver {
        didSet { UserDefaults.standard.set(currentCaregiver.rawValue, forKey: Keys.caregiver) }
    }

    /// Toggle « extraction avancée » (LLM cloud). Opt-in explicite, off par défaut.
    var advancedExtractionEnabled: Bool {
        didSet { UserDefaults.standard.set(advancedExtractionEnabled, forKey: Keys.advancedExtraction) }
    }

    init() {
        let raw = UserDefaults.standard.string(forKey: Keys.caregiver) ?? Caregiver.maman.rawValue
        self.currentCaregiver = Caregiver(rawValue: raw) ?? .maman
        self.advancedExtractionEnabled = UserDefaults.standard.bool(forKey: Keys.advancedExtraction)
    }

    private enum Keys {
        static let caregiver = "currentCaregiver"
        static let advancedExtraction = "advancedExtractionEnabled"
    }
}
