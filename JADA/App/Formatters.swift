import Foundation

/// Formateurs partagés (locale FR).
enum Formatters {
    static let time: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "fr_FR")
        f.dateFormat = "HH:mm"
        return f
    }()

    static let dayMonth: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "fr_FR")
        f.dateFormat = "d MMM"
        return f
    }()

    static let full: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "fr_FR")
        f.dateStyle = .long
        return f
    }()

    static let weekdayShort: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "fr_FR")
        f.dateFormat = "EEE"
        return f
    }()

    /// « il y a 1 h 20 », « il y a 5 min »
    static func relative(from date: Date, to now: Date = Date()) -> String {
        let s = Int(max(0, now.timeIntervalSince(date)))
        if s < 60 { return "à l'instant" }
        let m = s / 60
        if m < 60 { return "il y a \(m) min" }
        let h = m / 60
        let rem = m % 60
        if h < 24 { return rem == 0 ? "il y a \(h) h" : "il y a \(h) h \(rem)" }
        return "il y a \(h / 24) j"
    }
}
