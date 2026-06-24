import SwiftUI
import Charts

enum GrowthMetric: String, CaseIterable, Identifiable {
    case weight = "Poids"
    case height = "Taille"
    case head = "Périmètre crânien"
    var id: String { rawValue }

    var unit: String {
        switch self {
        case .weight: return "kg"
        case .height: return "cm"
        case .head: return "cm"
        }
    }

    func value(_ m: MeasurementEvent) -> Double? {
        switch self {
        case .weight: return m.weightG.map { Double($0) / 1000 }
        case .height: return m.heightMm.map { Double($0) / 10 }
        case .head: return m.headCircMm.map { Double($0) / 10 }
        }
    }

    var tint: Color {
        switch self {
        case .weight: return Theme.pinkDeep
        case .height: return Theme.lavenderDeep
        case .head: return Theme.waterDeep
        }
    }
}

/// Courbe de croissance (poids / taille / périmètre crânien).
struct GrowthChart: View {
    let measurements: [MeasurementEvent]
    @State private var metric: GrowthMetric = .weight

    private var points: [(date: Date, value: Double)] {
        measurements
            .compactMap { m in metric.value(m).map { (m.timestamp, $0) } }
            .sorted { $0.0 < $1.0 }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Picker("Mesure", selection: $metric) {
                ForEach(GrowthMetric.allCases) { Text($0.rawValue).tag($0) }
            }
            .pickerStyle(.segmented)

            if points.isEmpty {
                Text("Pas encore de mesure. Ajoutez une mensuration 👇")
                    .font(Font2.callout)
                    .foregroundStyle(Theme.inkSecondary)
                    .frame(maxWidth: .infinity, minHeight: 160)
            } else {
                Chart(points, id: \.date) { point in
                    LineMark(x: .value("Date", point.date),
                             y: .value(metric.rawValue, point.value))
                        .interpolationMethod(.catmullRom)
                        .foregroundStyle(metric.tint)
                        .lineStyle(StrokeStyle(lineWidth: 3, lineCap: .round))

                    AreaMark(x: .value("Date", point.date),
                             y: .value(metric.rawValue, point.value))
                        .interpolationMethod(.catmullRom)
                        .foregroundStyle(LinearGradient(colors: [metric.tint.opacity(0.25), .clear],
                                                        startPoint: .top, endPoint: .bottom))

                    PointMark(x: .value("Date", point.date),
                              y: .value(metric.rawValue, point.value))
                        .foregroundStyle(metric.tint)
                }
                .chartYAxisLabel(metric.unit)
                .frame(height: 200)
            }
        }
    }
}
