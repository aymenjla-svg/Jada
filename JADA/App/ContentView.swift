import SwiftUI
import SwiftData

/// Conteneur principal : les 4 onglets Maman · Santé · Album · Admin.
struct ContentView: View {
    @Environment(\.modelContext) private var context
    @Query private var children: [Child]

    var body: some View {
        Group {
            if let child = children.first {
                MainTabView(child: child)
            } else {
                OnboardingView()
            }
        }
    }
}

/// Premier lancement : crée l'enfant + pré-remplit le calendrier vaccinal FR.
struct OnboardingView: View {
    @Environment(\.modelContext) private var context
    @State private var name = "Jade"
    @State private var birthDate = Date()
    @State private var weight = ""
    @State private var height = ""

    var body: some View {
        ZStack {
            AubeBackground()
            ScrollView {
                VStack(spacing: 24) {
                    VStack(spacing: 6) {
                        Text("JADA")
                            .font(Font2.display(48))
                            .foregroundStyle(Theme.ink)
                        Text("Le quotidien de votre bébé, à deux.")
                            .font(Font2.callout)
                            .foregroundStyle(Theme.inkSecondary)
                    }
                    .padding(.top, 40)

                    GlassCard {
                        VStack(alignment: .leading, spacing: 16) {
                            field("Prénom") {
                                TextField("Prénom", text: $name)
                                    .font(Font2.bodyDefault)
                            }
                            Divider()
                            DatePicker("Date de naissance", selection: $birthDate, displayedComponents: .date)
                                .font(Font2.bodyDefault)
                                .tint(Theme.lavenderDeep)
                            Divider()
                            HStack(spacing: 12) {
                                field("Poids (g)") {
                                    TextField("3240", text: $weight)
                                        .keyboardType(.numberPad)
                                        .font(Font2.monoData)
                                }
                                field("Taille (mm)") {
                                    TextField("495", text: $height)
                                        .keyboardType(.numberPad)
                                        .font(Font2.monoData)
                                }
                            }
                        }
                    }
                    .padding(.horizontal)

                    PrimaryButton(title: "Commencer", systemImage: "sparkles") {
                        createChild()
                    }
                    .padding(.horizontal)
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                }
                .padding(.bottom, 40)
            }
        }
    }

    @ViewBuilder
    private func field<Content: View>(_ label: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label.uppercased())
                .font(Font2.monoLabel)
                .foregroundStyle(Theme.inkSecondary)
            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func createChild() {
        let child = Child(name: name.trimmingCharacters(in: .whitespaces),
                          birthDate: birthDate,
                          birthWeightG: Int(weight),
                          birthHeightMm: Int(height))
        context.insert(child)
        for vaccine in FrenchVaccineSchedule.makeVaccines(birthDate: birthDate) {
            context.insert(vaccine)
            NotificationService.scheduleVaccineReminder(vaccine)
        }
        try? context.save()
    }
}

struct MainTabView: View {
    let child: Child

    var body: some View {
        TabView {
            MamanView(child: child)
                .tabItem { Label("Maman", systemImage: "heart.fill") }
            SanteView(child: child)
                .tabItem { Label("Santé", systemImage: "cross.case.fill") }
            AlbumView(child: child)
                .tabItem { Label("Album", systemImage: "photo.on.rectangle.angled") }
            AdminView()
                .tabItem { Label("Admin", systemImage: "folder.fill") }
        }
    }
}

#Preview {
    ContentView()
        .modelContainer(PersistenceController.preview)
        .environment(AppSettings())
}
