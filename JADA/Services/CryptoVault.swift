import Foundation
import CryptoKit
import Security

/// Chiffrement au repos des documents et photos.
/// Clé symétrique AES-GCM conservée dans le Keychain (jamais en clair sur disque).
enum CryptoVault {

    private static let keyTag = "com.reejconsulting.jada.vaultkey"

    // MARK: - Clé

    /// Récupère (ou crée) la clé de chiffrement du coffre.
    static func vaultKey() throws -> SymmetricKey {
        if let data = try? readKeychain() {
            return SymmetricKey(data: data)
        }
        let key = SymmetricKey(size: .bits256)
        let data = key.withUnsafeBytes { Data($0) }
        try writeKeychain(data)
        return key
    }

    // MARK: - Chiffrement / déchiffrement

    static func encrypt(_ plaintext: Data) throws -> Data {
        let key = try vaultKey()
        let sealed = try AES.GCM.seal(plaintext, using: key)
        guard let combined = sealed.combined else { throw VaultError.sealFailed }
        return combined
    }

    static func decrypt(_ ciphertext: Data) throws -> Data {
        let key = try vaultKey()
        let box = try AES.GCM.SealedBox(combined: ciphertext)
        return try AES.GCM.open(box, using: key)
    }

    // MARK: - Keychain

    private static func writeKeychain(_ data: Data) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: keyTag,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly,
        ]
        SecItemDelete(query as CFDictionary)
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else { throw VaultError.keychain(status) }
    }

    private static func readKeychain() throws -> Data {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: keyTag,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        guard status == errSecSuccess, let data = item as? Data else { throw VaultError.keychain(status) }
        return data
    }

    enum VaultError: Error { case sealFailed, keychain(OSStatus) }
}
