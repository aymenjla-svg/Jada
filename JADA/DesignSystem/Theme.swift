import SwiftUI

/// Direction visuelle « Aube » — dégradé doux rose → lavande, ambiance cocon.
/// Toutes les couleurs et dégradés de l'app passent par ce fichier.
enum Theme {

    // MARK: - Couleurs de base

    /// Texte principal — `#3D2B46`
    static let ink = Color(hex: 0x3D2B46)
    /// Texte secondaire — `#9A7A92`
    static let inkSecondary = Color(hex: 0x9A7A92)

    /// Accent rose
    static let pink = Color(hex: 0xF7B8C8)
    static let pinkDeep = Color(hex: 0xE8A0D6)

    /// Accent lavande
    static let lavender = Color(hex: 0xA98AD6)
    static let lavenderDeep = Color(hex: 0x7D6AD0)

    /// Accent profond (boutons primaires)
    static let plum = Color(hex: 0x3D2B46)
    static let plumLight = Color(hex: 0x5B3D63)

    /// Accent eau (hydratation)
    static let water = Color(hex: 0xBFE3F0)
    static let waterDeep = Color(hex: 0xA9C8F0)

    // MARK: - Dégradés

    /// Fond de l'app : `#FBE9E4` → `#F7E0EC` → `#ECE4FB`
    static let background = LinearGradient(
        colors: [Color(hex: 0xFBE9E4), Color(hex: 0xF7E0EC), Color(hex: 0xECE4FB)],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    /// Signature de l'app : l'anneau rose → lavande.
    static let ring = AngularGradient(
        gradient: Gradient(colors: [pink, pinkDeep, lavender, lavenderDeep, pink]),
        center: .center,
        startAngle: .degrees(0),
        endAngle: .degrees(360)
    )

    /// Dégradé des boutons primaires.
    static let primaryButton = LinearGradient(
        colors: [plum, plumLight],
        startPoint: .top,
        endPoint: .bottom
    )

    /// Dégradé eau pour l'hydratation.
    static let waterGradient = LinearGradient(
        colors: [water, waterDeep],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    // MARK: - Cartes

    /// Blanc translucide des cartes — `rgba(255,255,255,.55)`
    static let cardFill = Color.white.opacity(0.55)
    static let cardStroke = Color.white.opacity(0.6)

    static let cornerRadius: CGFloat = 22
    static let cornerRadiusSmall: CGFloat = 16
}

extension Color {
    /// Init depuis un entier hexadécimal `0xRRGGBB`.
    init(hex: UInt32, alpha: Double = 1.0) {
        let r = Double((hex >> 16) & 0xFF) / 255.0
        let g = Double((hex >> 8) & 0xFF) / 255.0
        let b = Double(hex & 0xFF) / 255.0
        self.init(.sRGB, red: r, green: g, blue: b, opacity: alpha)
    }
}
