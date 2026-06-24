import Foundation
import UIKit

/// Stockage chiffré des fichiers (documents, photos) sur disque.
/// Chaque fichier est chiffré via `CryptoVault` puis écrit dans le dossier
/// Application Support, hors iCloud Drive et hors photothèque.
enum FileVault {

    enum Folder: String {
        case documents = "vault/documents"
        case photos = "vault/photos"
    }

    private static func directory(_ folder: Folder) throws -> URL {
        let base = try FileManager.default.url(for: .applicationSupportDirectory,
                                               in: .userDomainMask, appropriateFor: nil, create: true)
        let dir = base.appendingPathComponent(folder.rawValue, isDirectory: true)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir
    }

    /// Enregistre des données chiffrées et renvoie le nom de fichier (réf).
    @discardableResult
    static func save(_ data: Data, in folder: Folder, ref: String = UUID().uuidString) throws -> String {
        let encrypted = try CryptoVault.encrypt(data)
        let url = try directory(folder).appendingPathComponent(ref).appendingPathExtension("enc")
        try encrypted.write(to: url, options: .completeFileProtection)
        return ref
    }

    /// Lit et déchiffre un fichier.
    static func load(ref: String, in folder: Folder) throws -> Data {
        let url = try directory(folder).appendingPathComponent(ref).appendingPathExtension("enc")
        let encrypted = try Data(contentsOf: url)
        return try CryptoVault.decrypt(encrypted)
    }

    /// Charge une image déchiffrée.
    static func loadImage(ref: String, in folder: Folder) -> UIImage? {
        guard let data = try? load(ref: ref, in: folder) else { return nil }
        return UIImage(data: data)
    }

    /// Sauvegarde une image (JPEG chiffré).
    @discardableResult
    static func saveImage(_ image: UIImage, in folder: Folder, quality: CGFloat = 0.85) throws -> String {
        guard let data = image.jpegData(compressionQuality: quality) else {
            throw NSError(domain: "FileVault", code: 1)
        }
        return try save(data, in: folder)
    }

    static func delete(ref: String, in folder: Folder) {
        guard let url = try? directory(folder).appendingPathComponent(ref).appendingPathExtension("enc") else { return }
        try? FileManager.default.removeItem(at: url)
    }
}
