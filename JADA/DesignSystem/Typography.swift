import SwiftUI
import UIKit

/// Typographie « Aube ».
/// - Display : Fraunces (serif chaleureux) → titres et chiffres-clés.
/// - Corps : DM Sans.
/// - Data / labels : JetBrains Mono.
///
/// Les polices personnalisées sont chargées si présentes dans le bundle ;
/// sinon on retombe proprement sur les polices système équivalentes
/// (serif / rounded / monospaced) pour que l'app reste lisible sans les TTF.
/// Pour installer les vraies polices : voir Resources/Fonts/README.md.
enum Font2 {

    private static func custom(_ name: String, fallback: Font.Design, size: CGFloat, relativeTo style: Font.TextStyle) -> Font {
        if UIFont(name: name, size: size) != nil {
            return .custom(name, size: size, relativeTo: style)
        }
        return .system(style, design: fallback)
    }

    // MARK: - Display (Fraunces)

    static func display(_ size: CGFloat, relativeTo style: Font.TextStyle = .largeTitle) -> Font {
        custom("Fraunces-SemiBold", fallback: .serif, size: size, relativeTo: style)
    }

    static var largeTitle: Font { display(34, relativeTo: .largeTitle) }
    static var title: Font { display(26, relativeTo: .title) }
    static var titleSmall: Font { display(20, relativeTo: .title3) }

    // MARK: - Corps (DM Sans)

    static func body(_ size: CGFloat, relativeTo style: Font.TextStyle = .body) -> Font {
        custom("DMSans-Regular", fallback: .default, size: size, relativeTo: style)
    }

    static func bodyMedium(_ size: CGFloat, relativeTo style: Font.TextStyle = .body) -> Font {
        custom("DMSans-Medium", fallback: .default, size: size, relativeTo: style)
    }

    static var bodyDefault: Font { body(16) }
    static var callout: Font { body(15, relativeTo: .callout) }
    static var caption: Font { body(13, relativeTo: .caption) }

    // MARK: - Data (JetBrains Mono)

    static func mono(_ size: CGFloat, relativeTo style: Font.TextStyle = .body) -> Font {
        custom("JetBrainsMono-Regular", fallback: .monospaced, size: size, relativeTo: style)
    }

    static var monoLabel: Font { mono(12, relativeTo: .caption) }
    static var monoData: Font { mono(15, relativeTo: .body) }
}
