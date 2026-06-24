import SwiftUI

/// Bouton primaire — dégradé prune profond, texte blanc.
struct PrimaryButton: View {
    let title: String
    var systemImage: String? = nil
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if let systemImage {
                    Image(systemName: systemImage)
                }
                Text(title)
            }
            .font(Font2.bodyMedium(16))
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 15)
            .background(Theme.primaryButton, in: Capsule())
            .shadow(color: Theme.plum.opacity(0.25), radius: 10, y: 5)
        }
        .buttonStyle(.plain)
    }
}

/// Pastille d'action ronde pour l'onglet Maman (tap rapide).
struct ActionChip: View {
    let title: String
    let systemImage: String
    var tint: Color = Theme.lavender
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                ZStack {
                    Circle()
                        .fill(tint.opacity(0.18))
                        .frame(width: 56, height: 56)
                    Image(systemName: systemImage)
                        .font(.system(size: 22, weight: .medium))
                        .foregroundStyle(tint)
                }
                Text(title)
                    .font(Font2.caption)
                    .foregroundStyle(Theme.ink)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(.plain)
    }
}
