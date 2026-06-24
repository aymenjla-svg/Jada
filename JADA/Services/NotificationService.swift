import Foundation
import UserNotifications

/// Rappels via notifications locales (suffisant pour le local-first).
enum NotificationService {

    static func requestAuthorization() async {
        _ = try? await UNUserNotificationCenter.current()
            .requestAuthorization(options: [.alert, .sound, .badge])
    }

    /// Programme un rappel à une date donnée.
    static func schedule(id: String, title: String, body: String, at date: Date) {
        guard date > Date() else { return }
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default

        let comps = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: date)
        let trigger = UNCalendarNotificationTrigger(dateMatching: comps, repeats: false)
        let request = UNNotificationRequest(identifier: id, content: content, trigger: trigger)
        UNUserNotificationCenter.current().add(request)
    }

    static func cancel(id: String) {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [id])
    }

    // MARK: - Helpers métier

    static func scheduleVaccineReminder(_ vaccine: Vaccine) {
        guard vaccine.reminderEnabled, !vaccine.isDone, let due = vaccine.dueDate else { return }
        // Rappel 3 jours avant, à 9h.
        let remindAt = Calendar.current.date(byAdding: .day, value: -3, to: due) ?? due
        let at = Calendar.current.date(bySettingHour: 9, minute: 0, second: 0, of: remindAt) ?? remindAt
        schedule(id: "vaccine-\(vaccine.id)", title: "Vaccin à prévoir",
                 body: "\(vaccine.name) — recommandé vers \(vaccine.dueAgeMonths) mois.", at: at)
    }

    static func scheduleAppointmentReminder(_ appt: Appointment) {
        guard appt.reminderEnabled else { return }
        // Rappel la veille à 18h.
        let dayBefore = Calendar.current.date(byAdding: .day, value: -1, to: appt.date) ?? appt.date
        let at = Calendar.current.date(bySettingHour: 18, minute: 0, second: 0, of: dayBefore) ?? dayBefore
        schedule(id: "appt-\(appt.id)", title: "Rendez-vous demain",
                 body: "\(appt.title)\(appt.practitioner.isEmpty ? "" : " — \(appt.practitioner)")", at: at)
    }

    static func scheduleExpiryReminder(_ document: Document) {
        guard let expiry = document.expiryDate else { return }
        // Rappel 2 mois avant expiration.
        let remindAt = Calendar.current.date(byAdding: .month, value: -2, to: expiry) ?? expiry
        schedule(id: "doc-\(document.id)", title: "Document à renouveler",
                 body: "\(document.type) expire bientôt.", at: remindAt)
    }
}
