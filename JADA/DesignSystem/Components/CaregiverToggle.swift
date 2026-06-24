import SwiftUI

/// Sélecteur Maman / Papa pour l'attribution `createdBy`.
struct CaregiverToggle: View {
    @Binding var selection: Caregiver

    var body: some View {
        HStack(spacing: 8) {
            ForEach(Caregiver.allCases) { caregiver in
                let isOn = selection == caregiver
                Button {
                    selection = caregiver
                } label: {
                    Text(caregiver.label)
                        .font(Font2.bodyMedium(14))
                        .foregroundStyle(isOn ? .white : Theme.ink)
                        .padding(.vertical, 8)
                        .frame(maxWidth: .infinity)
                        .background {
                            if isOn {
                                Capsule().fill(Theme.primaryButton)
                            } else {
                                Capsule().fill(Color.white.opacity(0.5))
                            }
                        }
                }
                .buttonStyle(.plain)
            }
        }
    }
}
