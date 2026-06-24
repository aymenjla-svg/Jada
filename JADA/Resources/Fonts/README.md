# Polices

Pour activer la direction visuelle « Aube » à 100 %, ajoutez les fichiers de polices
ci-dessous dans ce dossier puis déclarez-les dans Xcode.

## Polices à installer (toutes open source, licence OFL)

| Usage | Police | Fichiers attendus |
|---|---|---|
| Display / titres | [Fraunces](https://fonts.google.com/specimen/Fraunces) | `Fraunces-SemiBold.ttf` |
| Corps | [DM Sans](https://fonts.google.com/specimen/DMSans) | `DMSans-Regular.ttf`, `DMSans-Medium.ttf` |
| Data / labels | [JetBrains Mono](https://fonts.google.com/specimen/JetBrainsMono) | `JetBrainsMono-Regular.ttf` |

## Installation

1. Glissez les `.ttf` dans ce dossier (`JADA/Resources/Fonts/`).
2. Ajoutez la clé `UIAppFonts` (Fonts provided by application) dans les *Build Settings*
   Info de la cible, listant chaque fichier `.ttf`.
3. Rebuild.

Sans ces fichiers, l'app fonctionne et reste belle : `Typography.swift` retombe
automatiquement sur les polices système (serif / rounded / monospaced).
