import SwiftUI
import SwiftData

/// Onglet Santé — suivi médical (organisation et rappels, jamais de conseil).
struct SanteView: View {
    let child: Child
    @Environment(\.modelContext) private var context

    @Query(sort: \Vaccine.dueAgeMonths) private var vaccines: [Vaccine]
    @Query(sort: \Appointment.date) private var appointments: [Appointment]
    @Query(sort: \MeasurementEvent.timestamp, order: .reverse) private var measurements: [MeasurementEvent]
    @Query(sort: \MedicalEntry.date, order: .reverse) private var entries: [MedicalEntry]

    @State private var showAddAppointment = false
    @State private var showAddMeasurement = false
    @State private var showAddEntry = false

    private var nextVaccine: Vaccine? {
        vaccines.filter { !$0.isDone }.sorted { ($0.dueDate ?? .distantFuture) < ($1.dueDate ?? .distantFuture) }.first
    }
    private var nextAppointment: Appointment? {
        appointments.filter { $0.isUpcoming }.first
    }

    var body: some View {
        NavigationStack {
            ZStack {
                AubeBackground()
                ScrollView {
                    VStack(spacing: 20) {
                        upcomingSection
                        growthSection
                        vaccinesSection
                        historySection
                        disclaimer
                    }
                    .padding()
                    .padding(.bottom, 24)
                }
            }
            .navigationTitle("Santé")
            .navigationBarTitleDisplayMode(.large)
        }
        .sheet(isPresented: $showAddAppointment) { AddAppointmentSheet() }
        .sheet(isPresented: $showAddMeasurement) { AddMeasurementSheet(child: child) }
        .sheet(isPresented: $showAddEntry) { AddMedicalEntrySheet() }
    }

    // MARK: - Prochaines échéances

    private var upcomingSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionTitle("Prochaines échéances")
            GlassCard {
                VStack(spacing: 14) {
                    if let v = nextVaccine {
                        echeanceRow(symbol: "syringe.fill", tint: Theme.lavenderDeep,
                                    title: v.name,
                                    subtitle: v.dueDate.map { "Vers \(Formatters.full.string(from: $0))" } ?? "Vers \(v.dueAgeMonths) mois")
                    }
                    if nextVaccine != nil && nextAppointment != nil { Divider() }
                    if let a = nextAppointment {
                        echeanceRow(symbol: "stethoscope", tint: Theme.pinkDeep,
                                    title: a.title,
                                    subtitle: "\(Formatters.full.string(from: a.date))\(a.practitioner.isEmpty ? "" : " · \(a.practitioner)")")
                    }
                    if nextVaccine == nil && nextAppointment == nil {
                        Text("Aucune échéance à venir.")
                            .font(Font2.callout).foregroundStyle(Theme.inkSecondary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
            }
            Button { showAddAppointment = true } label: {
                Label("Ajouter un rendez-vous", systemImage: "plus.circle.fill")
                    .font(Font2.bodyMedium(15)).foregroundStyle(Theme.lavenderDeep)
            }
            .padding(.leading, 4)
        }
    }

    // MARK: - Courbe

    private var growthSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionTitle("Courbe de croissance")
            GlassCard { GrowthChart(measurements: measurements) }
            Button { showAddMeasurement = true } label: {
                Label("Ajouter une mensuration", systemImage: "plus.circle.fill")
                    .font(Font2.bodyMedium(15)).foregroundStyle(Theme.lavenderDeep)
            }
            .padding(.leading, 4)
        }
    }

    // MARK: - Vaccins

    private var vaccinesSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionTitle("Calendrier vaccinal (FR)")
            GlassCard(padding: 8) {
                VStack(spacing: 0) {
                    ForEach(Array(vaccines.enumerated()), id: \.element.id) { idx, v in
                        Button { toggleVaccine(v) } label: {
                            HStack(spacing: 12) {
                                Image(systemName: v.isDone ? "checkmark.circle.fill" : "circle")
                                    .font(.system(size: 20))
                                    .foregroundStyle(v.isDone ? Theme.lavenderDeep : Theme.inkSecondary)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(v.name).font(Font2.callout).foregroundStyle(Theme.ink)
                                        .strikethrough(v.isDone)
                                    Text(v.isDone
                                         ? "Fait\(v.doneDate.map { " le \(Formatters.dayMonth.string(from: $0))" } ?? "")"
                                         : "Vers \(v.dueAgeMonths) mois")
                                        .font(Font2.monoLabel).foregroundStyle(Theme.inkSecondary)
                                }
                                Spacer()
                            }
                            .padding(.vertical, 8).padding(.horizontal, 8)
                        }
                        .buttonStyle(.plain)
                        if idx < vaccines.count - 1 { Divider().padding(.leading, 48) }
                    }
                }
            }
        }
    }

    // MARK: - Historique

    private var historySection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionTitle("Historique médical")
            if entries.isEmpty {
                GlassCard {
                    Text("Aucune entrée. Notez la jaunisse, une analyse…")
                        .font(Font2.callout).foregroundStyle(Theme.inkSecondary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            } else {
                ForEach(entries) { e in
                    GlassCard {
                        VStack(alignment: .leading, spacing: 4) {
                            HStack {
                                Text(e.title).font(Font2.bodyMedium(16)).foregroundStyle(Theme.ink)
                                Spacer()
                                Text(Formatters.dayMonth.string(from: e.date))
                                    .font(Font2.monoLabel).foregroundStyle(Theme.inkSecondary)
                            }
                            if !e.summary.isEmpty {
                                Text(e.summary).font(Font2.callout).foregroundStyle(Theme.inkSecondary)
                            }
                        }
                    }
                }
            }
            Button { showAddEntry = true } label: {
                Label("Ajouter à l'historique", systemImage: "plus.circle.fill")
                    .font(Font2.bodyMedium(15)).foregroundStyle(Theme.lavenderDeep)
            }
            .padding(.leading, 4)
        }
    }

    private var disclaimer: some View {
        Text("JADA organise, archive et rappelle. Elle ne donne jamais de conseil médical : toute question de santé relève d'un professionnel.")
            .font(Font2.caption)
            .foregroundStyle(Theme.inkSecondary)
            .multilineTextAlignment(.center)
            .padding(.horizontal)
            .padding(.top, 8)
    }

    // MARK: - Helpers

    private func sectionTitle(_ t: String) -> some View {
        Text(t).font(Font2.titleSmall).foregroundStyle(Theme.ink).padding(.leading, 4)
            .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func echeanceRow(symbol: String, tint: Color, title: String, subtitle: String) -> some View {
        HStack(spacing: 14) {
            Image(systemName: symbol)
                .font(.system(size: 20)).foregroundStyle(tint)
                .frame(width: 44, height: 44).background(tint.opacity(0.15), in: Circle())
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(Font2.bodyMedium(16)).foregroundStyle(Theme.ink)
                Text(subtitle).font(Font2.caption).foregroundStyle(Theme.inkSecondary)
            }
            Spacer()
        }
    }

    private func toggleVaccine(_ v: Vaccine) {
        v.doneDate = v.isDone ? nil : Date()
        if v.isDone { NotificationService.cancel(id: "vaccine-\(v.id)") }
        else { NotificationService.scheduleVaccineReminder(v) }
        try? context.save()
    }
}

#Preview {
    SanteView(child: SampleData.previewChild)
        .modelContainer(PersistenceController.preview)
        .environment(AppSettings())
}
