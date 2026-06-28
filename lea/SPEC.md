# SPEC — Tuteur IA incarné (nom de code : **Léa**)

> Document d'architecture et de cadrage, destiné à Claude Code. **v2** — 13 décisions + 6 revalidations + principes fondateurs.

## 0. Vision
Un professeur particulier incarné (visage, regard, voix) piloté par un moteur pédagogique rigoureux : il suit la progression réelle, vérifie les réponses, s'adapte, n'humilie jamais. Le LLM **parle** ; le moteur déterministe **sait, vérifie, tient le cadre**.

## 0bis. Hypothèses à valider (non bloquantes)
- **H1** Le moat n'est pas le moteur (table stakes) mais le **contenu**, la **distribution**, l'**expérience incarnée**.
- **H2** Risque de personas cosmétiques → valider la différence didactique réelle.
- **H3** Le contenu est le goulot n°1 (cf. R1 : prof source primaire).
- **H4** Efficacité à prouver (protocole pré/post à terme).

## 1. Principes
- **P1** Sécurité psychologique (sans jugement, répétition illimitée, écrit de plein droit, « je suis perdu », tremplin pas refuge).
- **P2** Moteur déterministe tient le cadre (code dur, identique pour tous).
- **P3** Tout derrière des contrats (remplaçable sans réécriture).
- **P4** Privacy-by-design mineurs (la vidéo ne sort jamais).
- **P5** Mesurable dès le jour 1.

**Invariants :** 1) ne jamais valider du faux · 2) ne jamais sortir du curriculum · 3) ne jamais humilier · 4) ne jamais exposer la vidéo de l'enfant · 5) compte adulte + consentement · 6) **sécurité du dialogue** (filtre sortie + protocole détresse → escalade adulte) · 7) **mineur → provider conforme + no-train** quel que soit le mode de paiement.

## 2. Décisions (D1–D13) + revalidations (R1–R6)
- **D1** LLM agentique + 2 outils code dur (`verifier`, `enregistrerResultat`).
- **D2** Objectifs atomiques (3–5/notion) + révision + 3 types d'éval + répétition.
- **D3→R2** `LearnerModel` : heuristique honnête v1 → **BKT en Phase 2** (calé sur données) → cap DKT.
- **D4** Decay + horodatage jour 1 → répétition espacée.
- **D5** Templates paramétrés à étapes (construits à partir d'exos prof — R1).
- **D6→R3** Passerelle multi-rôle ; `tenant.mode_ia: inclus|byok` ; **dev = clé éditeur** (env backend, plafond budget) ; conformité mineur non reportable.
- **D7** Postgres unique multi-tenant (`tenant_id` + RLS).
- **D8** Monolithe modulaire Node/TS, mono-région au départ.
- **D9** RPM + R3F derrière `Avatar` + `Persona` à 3 facettes.
- **D10** Caméra 100 % locale, minimisation, effacement via `tenant_id`.
- **D11→R4** Pipeline voix modulaire, interface temps-réel ; **budget latence premier son < ~1 s**, parole streamée / outils en tâche de fond.
- **D12** Attention = signal pédagogique, `AttentionSource` source-agnostique.
- **D13** Télémétrie complète jour 1, dashboard.
- **R1** **Prof = source primaire** (`origine:'prof'`) templatisé ; LLM = extension validée (`origine:'llm', statut:'à_valider'`, few-shot sur exos prof). Contenu = actif stratégique.
- **R5** `SafetyFilter` (filtre sortie + détresse → `safety_alerts`).
- **R6** Paliers de présence : 3D → 2D/SVG → texte+voix → texte seul ; moteur pédagogique identique partout.
- **R7 — Adaptation multi-modale (rythme).** Face à un blocage, le tuteur dispose de 3 leviers : **reformuler** (autres mots), **simplifier** (niveau inférieur ou prérequis via le DAG), **changer de modalité** (`textuel`/`visuel`/`interactif`). Nouveau coup `changer_de_modalité`. Contenu porte `representations[]` (modalité + asset/composant). **Pas de "style d'apprentissage" figé** (mythe non étayé) : multi-représentation pour tous + bascule quand ça ne passe pas ; au mieux un *indice doux* « modalité ayant débloqué cet élève sur cet objectif », jamais une étiquette. Production : V1 surtout textuel, visuel/interactif s'enrichissent par versions (bibliothèque de composants interactifs côté front).

## 4. Contrats (Phase 0)
`Avatar`, `Voice` (streaming + barge-in), `AttentionSource`, `LLMGateway` (multi-rôle, mode_ia), `Curriculum` (DAG), `LearnerModel` (heuristique→BKT), `Verifier` (numeric|symbolic|qcm|libre), `SafetyFilter`, `ConversationOrchestrator` (parole immédiate / outils en tâche de fond).

## 5. Données (Postgres, RLS)
`tenant_id` + timestamps + `events` sur **chaque** table. Tables clés : tenants(`mode_ia`,`region`), users, eleves, referentiels, objectifs, prerequis(DAG), exercice_templates(`origine`,`statut`,`representations[]`), explications(`objectif_id`,`modalite:textuel|visuel|interactif`,`asset`), maitrise(`derniere_revision/reussite`), erreurs_type, personas, sessions, dialogue_turns, embeddings(pgvector phase 2), events, safety_alerts.

## 6. Moteur pédagogique
Curriculum DAG (objectifs atomiques, YAML versionné, BO = 1er référentiel). `LearnerModel` heuristique v1 → BKT v2, decay au calcul, agrégation 6 compétences, erreurs-types. Exercices : source prof → templates paramétrés ; LLM extension validée ; exercices à étapes ; 3 types d'éval. **Adaptation multi-modale (R7) :** sur blocage (échecs répétés / « je suis perdu » / confusion détectée), le tuteur choisit reformuler · simplifier (niveau/prérequis) · `changer_de_modalité` (textuel/visuel/interactif). Les composants interactifs sont des éléments front réutilisables, déclenchables par le tuteur. Boucle agentique : `soul` réinjecté chaque tour ; latence R4.

## 7. Personas
3 facettes séparées : apparence (RPM+voix) · soul (style) · pédagogie (**paramètres moteur**, pas prompt). Même moteur/invariants ; diffèrent par chemin + style. Catalogue = donnée. Matching élève↔persona.

## 8. Présence (R6)
Paliers détectés au lancement ; moteur identique partout. Avatar RPM+R3F (Convai = alt). Voix pipeline streaming. Attention locale, bienveillante, désactivable.

## 9. Sécurité & conformité
Vidéo locale (coordonnées seules). SafetyFilter + détresse → escalade adulte. Compte adulte. Minimisation. Effacement via `tenant_id`. Résidence par région. Mineur → provider conforme + no-train.

## 12. Phasage (jamais la largeur d'abord)
- **P0** Contrats (§4) uniquement.
- **P1** Tranche verticale minuscule : 1 objectif, texte seul, sans avatar/voix/BKT : proposer(template d'exo prof)→verifier(code)→maj heuristique→persister→progression. Avec `tenant_id`/timestamps/`events`/SafetyFilter minimal dès maintenant.
- **P2** BKT+decay, tous les coups, banque+verifier multi-type, erreurs-types, RAG, dashboard.
- **P3** Présence : SVG → RPM/R3F, voix streaming, attention, personas.
- **P4** Échelle : notions, multi-curriculum, multi-tenant durci, multi-région, mode_ia, marketplace personas.

## 13. À graver jour 1
`tenant_id` partout · timestamps partout · `events` propre dès la 1ʳᵉ fonctionnalité.

## 14. Hors-périmètre v1
RL · DKT · speech-to-speech premium · multi-matières · marketplace personas.
