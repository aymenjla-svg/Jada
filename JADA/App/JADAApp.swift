import SwiftUI
import SwiftData

@main
struct JADAApp: App {
    let container: ModelContainer
    @State private var settings = AppSettings()

    init() {
        self.container = PersistenceController.makeContainer()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(settings)
                .tint(Theme.plumLight)
                .task {
                    await NotificationService.requestAuthorization()
                }
        }
        .modelContainer(container)
    }
}
