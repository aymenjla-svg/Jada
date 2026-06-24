# Configuration

L'app fonctionne **out of the box** en local sur le simulateur. Les deux options
ci-dessous (CloudKit, polices) sont facultatives et demandent un compte développeur
Apple ou des fichiers supplémentaires.

## 1. Activer la synchro CloudKit (père ↔ mère)

Par défaut, `PersistenceController.cloudKitEnabled = false` → stockage local seul,
pour que le projet compile et tourne sans compte développeur.

Pour activer la synchro chiffrée entre les deux parents :

1. Dans Xcode, cible **JADA → Signing & Capabilities** :
   - sélectionnez votre **Team** ;
   - ajoutez la capability **iCloud** → cochez **CloudKit** ;
   - créez/choisissez un conteneur, ex. `iCloud.com.reejconsulting.jada`.
   - ajoutez la capability **Background Modes** → **Remote notifications**.
2. Xcode génère un fichier `JADA.entitlements`. Un modèle est fourni à la racine :
   `JADA.entitlements.template` (copiez-le dans la cible et ajustez le conteneur).
3. Passez `cloudKitEnabled` à `true` dans
   `JADA/Persistence/PersistenceController.swift`.
4. Pour le partage à deux iCloud distincts : le partage de zone (`CKShare`) se met
   en place via le partage du store SwiftData/CloudKit ; chaque parent se connecte
   avec son propre identifiant iCloud et accède aux mêmes données de l'enfant.

> ⚠️ Modèle de données « additif » : chaque action est un enregistrement horodaté
> (event-sourcing léger), jamais un update concurrent → pas de conflit de fusion.

## 2. Installer les polices « Aube »

Voir `JADA/Resources/Fonts/README.md`. Sans les TTF, l'app retombe proprement sur
les polices système (serif / rounded / monospaced).

## 3. Extraction avancée (LLM cloud) — optionnel, plus tard

Prévu en opt-in explicite (`AppSettings.advancedExtractionEnabled`). À implémenter
avec une API **Zero Data Retention** et masquage des champs sensibles **avant** envoi
(le n° Sécu est déjà tronqué côté extraction par règles). Non inclus dans le MVP.

## Permissions

Déjà déclarées dans les Build Settings (Info généré) :

- `NSCameraUsageDescription` — scan de documents.
- `NSPhotoLibraryUsageDescription` — photo du jour.
