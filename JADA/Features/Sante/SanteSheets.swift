import SwiftUI
import SwiftData

struct AddAppointmentSheet: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    @State private var title = ""
    @State private var practitioner = ""
    @State private var date = Date().addingTimeInterval(86400)
    @State private var location = ""
    @State private var reminder = true

    var body: some View {
        NavigationStack {
            Form {
                Section("Rendez-vous") {
                    TextField("Titre (ex. Visite des 4 mois)", text: $title)
                    TextField("Praticien", text: $practitioner)
                    TextField("Lieu", text: $location)
                    DatePicker("Date", selection: $date)
                }
                Section {
                    Toggle("Me rappeler la veille", isOn: $reminder)
                }
            }
            .navigationTitle("Nouveau RDV")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Annuler") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Ajouter") { save() }.disabled(title.isEmpty).fontWeight(.semibold)
                }
            }
        }
    }

    private func save() {
        let appt = Appointment(title: title, practitioner: practitioner, date: date,
                               location: location.isEmpty ? nil : location, reminderEnabled: reminder)
        context.insert(appt)
        NotificationService.scheduleAppointmentReminder(appt)
        try? context.save()
        dismiss()
    }
}

struct AddMeasurementSheet: View {
    let child: Child
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss
    @Environment(AppSettings.self) private var settings

    @State private var weightKg = ""
    @State private var heightCm = ""
    @State private var headCm = ""
    @State private var date = Date()

    var body: some View {
        NavigationStack {
            Form {
                Section("Mensurations") {
                    HStack { Text("Poids"); Spacer()
                        TextField("kg", text: $weightKg).keyboardType(.decimalPad).multilineTextAlignment(.trailing).frame(width: 90) }
                    HStack { Text("Taille"); Spacer()
                        TextField("cm", text: $heightCm).keyboardType(.decimalPad).multilineTextAlignment(.trailing).frame(width: 90) }
                    HStack { Text("Périmètre crânien"); Spacer()
                        TextField("cm", text: $headCm).keyboardType(.decimalPad).multilineTextAlignment(.trailing).frame(width: 90) }
                    DatePicker("Date", selection: $date, displayedComponents: .date)
                }
            }
            .navigationTitle("Mensuration")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Annuler") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Ajouter") { save() }.disabled(!hasValue).fontWeight(.semibold)
                }
            }
        }
    }

    private var hasValue: Bool { !weightKg.isEmpty || !heightCm.isEmpty || !headCm.isEmpty }

    private func save() {
        let w = Double(weightKg.replacingOccurrences(of: ",", with: ".")).map { Int($0 * 1000) }
        let h = Double(heightCm.replacingOccurrences(of: ",", with: ".")).map { Int($0 * 10) }
        let p = Double(headCm.replacingOccurrences(of: ",", with: ".")).map { Int($0 * 10) }
        context.insert(MeasurementEvent(timestamp: date, createdBy: settings.currentCaregiver,
                                        weightG: w, heightMm: h, headCircMm: p))
        try? context.save()
        dismiss()
    }
}

struct AddMedicalEntrySheet: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    @State private var title = ""
    @State private var summary = ""
    @State private var date = Date()

    var body: some View {
        NavigationStack {
            Form {
                Section("Entrée") {
                    TextField("Titre (ex. Jaunisse)", text: $title)
                    DatePicker("Date", selection: $date, displayedComponents: .date)
                }
                Section("Détail") {
                    TextField("Observations…", text: $summary, axis: .vertical).lineLimit(3...8)
                }
            }
            .navigationTitle("Historique")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Annuler") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Ajouter") { save() }.disabled(title.isEmpty).fontWeight(.semibold)
                }
            }
        }
    }

    private func save() {
        context.insert(MedicalEntry(title: title, date: date, summary: summary))
        try? context.save()
        dismiss()
    }
}
