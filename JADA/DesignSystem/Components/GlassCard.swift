import SwiftUI

/// Carte blanc translucide avec léger flou et coins très arrondis — signature « Aube ».
struct GlassCard<Content: View>: View {
    var padding: CGFloat = 18
    var cornerRadius: CGFloat = Theme.cornerRadius
    @ViewBuilder var content: Content

    var body: some View {
        content
            .padding(padding)
            .background {
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .fill(Theme.cardFill)
                    .background(
                        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                            .fill(.ultraThinMaterial)
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                            .strokeBorder(Theme.cardStroke, lineWidth: 1)
                    )
            }
            .shadow(color: Theme.plum.opacity(0.06), radius: 12, x: 0, y: 6)
    }
}

/// Fond d'écran dégradé « Aube », à placer derrière chaque onglet.
struct AubeBackground: View {
    var body: some View {
        Theme.background
            .ignoresSafeArea()
    }
}

#Preview {
    ZStack {
        AubeBackground()
        GlassCard {
            VStack(alignment: .leading, spacing: 8) {
                Text("Carte verre").font(Font2.titleSmall)
                Text("Blanc translucide, coins arrondis.").font(Font2.callout)
            }
        }
        .padding()
    }
}
