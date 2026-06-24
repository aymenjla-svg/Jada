# JADA 🌅

Application iOS privée de suivi du quotidien, de la santé, des souvenirs et de
l'administratif d'un bébé. Usage strictement familial : **2 utilisateurs** (le père
et la mère), synchronisés. Local-first, privacy-by-design.

> **Principe directeur : JADA organise, archive et rappelle. JADA ne donne jamais
> de conseil médical.**

## Stack

- **UI** : SwiftUI
- **Persistance** : SwiftData
- **Synchro 2 utilisateurs** : CloudKit en zone partagée (prêt, désactivé par défaut — voir `SETUP.md`)
- **Chiffrement** : AES-GCM (CryptoKit), clé en Keychain
- **Scan / OCR** : VisionKit + Apple Vision, 100 % on-device
- **Notifications** : rappels locaux (`UserNotifications`)
- **iOS 17+**, Xcode 16+

## Les 4 onglets (MVP)

| Onglet | Contenu |
|---|---|
| **Maman** | Anneau « temps depuis la dernière tétée », dernier événement, actions au tap (tétée sein G/D + durée, biberon, hydratation/Adiaryl, couche pipi/caca + couleur), fil du jour. Attribution `createdBy` (Maman/Papa). |
| **Santé** | Prochaines échéances (vaccins + RDV avec rappels), courbe de croissance (poids/taille/PC), calendrier vaccinal FR pré-rempli, historique médical. |
| **Album** | Photo du jour mise en avant + calendrier-vignettes. Import photothèque, images chiffrées. |
| **Admin** | Coffre-fort de documents chiffrés, catégorisé. Scan → OCR → extraction par règles on-device. Rappels d'expiration. |

## Ouvrir le projet

```bash
open JADA.xcodeproj
```

Sélectionnez le schéma **JADA**, un simulateur iOS 17+, puis lancez (⌘R).
Au premier lancement, l'onboarding crée l'enfant et pré-remplit le calendrier vaccinal FR.

## Structure

```
JADA/
  App/            Point d'entrée, TabView, onboarding, formatters
  DesignSystem/   Thème « Aube », typographie, composants (anneau, carte verre…)
  Models/         Modèles SwiftData (events, vaccins, documents…)
  Persistence/    ModelContainer, réglages, calendrier vaccinal FR, données démo
  Services/       Chiffrement, coffre de fichiers, notifications, scan/OCR/extraction
  Features/       Maman · Santé · Album · Admin
  Resources/      Assets, polices (voir Resources/Fonts/README.md)
```

## Confidentialité

- Fichiers (documents, photos) chiffrés au repos ; clé en Keychain.
- OCR et extraction **on-device** : rien n'est envoyé à un serveur tiers.
- Extraction LLM cloud : prévue en **opt-in explicite** (toggle), désactivée par défaut.

Voir `SETUP.md` pour activer la synchro CloudKit et installer les polices.
