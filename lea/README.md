# Léa — Tuteur IA incarné

Professeur particulier incarné (visage, regard, voix) piloté par un **moteur
pédagogique déterministe**. Le LLM *parle* ; le moteur *sait, vérifie, tient le
cadre*. Voir [`SPEC.md`](./SPEC.md) pour le cadrage complet.

> **Projet indépendant.** Ce dossier `lea/` est autonome : il ne partage aucun
> code avec le reste du dépôt courant. Il est destiné à être extrait dans son
> **propre dépôt git** (voir « Extraction » plus bas).

## État : Phase 0 — Contrats uniquement

Conformément au phasage du SPEC (§12, « jamais la largeur d'abord »), cette
première étape ne contient **que les contrats** (§4) — des interfaces
TypeScript, aucune implémentation. Tout le reste se branchera derrière elles
(principe **P3** : remplaçable sans réécriture).

### Les contrats (`src/contracts/`)

| Fichier | Contrat | Réf. SPEC |
|---|---|---|
| `common.ts` | Primitives : `tenant_id`, timestamps, `events`, `ModeIA`, `Modalite`, conformité | §13, D7, D6 |
| `verifier.ts` | `Verifier` — `numeric \| symbolic \| qcm \| libre` (outil code dur n°1) | D1, D2 |
| `curriculum.ts` | `Curriculum` — DAG d'objectifs atomiques, templates, `representations[]` | D2, R1, R7 |
| `learner-model.ts` | `LearnerModel` — heuristique → BKT, decay au calcul | D3/R2, D4 |
| `safety-filter.ts` | `SafetyFilter` — filtre sortie + détresse → `safety_alerts` | R5 |
| `llm-gateway.ts` | `LLMGateway` — multi-rôle, `mode_ia`, conformité mineur | D6/R3 |
| `persona.ts` | `Persona` — 3 facettes (apparence · soul · pédagogie-paramètres) | D9, §7 |
| `avatar.ts` | `Avatar` — paliers de présence 3D → SVG → texte | D9, R6 |
| `voice.ts` | `Voice` — streaming + barge-in, budget < ~1 s | D11/R4 |
| `attention.ts` | `AttentionSource` — signal pédagogique, vidéo 100 % locale | D12, D10 |
| `orchestrator.ts` | `ConversationOrchestrator` — boucle agentique, coups R7 | D1, R4, R7 |

### Invariants gravés dans les types

- **`tenant_id` + timestamps partout** : tout agrégat est `TenantScoped & Timestamped`.
- **Ne jamais valider du faux** : seul le `Verifier` produit un `Verdict`.
- **Privacy mineurs** : `AttentionSource` n'expose que des signaux dérivés, jamais d'image.
- **Conformité mineur non reportable** : `LLMGateway` résout le provider via `ComplianceContext`.

## Pile technique

Monolithe modulaire **Node / TypeScript** (D8), strict mode, ESM.

```bash
npm install
npm run typecheck   # vérifie que les contrats compilent
```

## Prochaines étapes (phasage SPEC §12)

- **P1** — Tranche verticale minuscule : 1 objectif, texte seul, sans avatar/voix/BKT :
  `proposer → verifier → màj heuristique → persister → progression`, avec
  `tenant_id`/timestamps/`events`/SafetyFilter minimal.
- **P2** — BKT + decay, tous les coups, banque + verifier multi-type, erreurs-types, RAG, dashboard.
- **P3** — Présence : SVG → RPM/R3F, voix streaming, attention, personas.
- **P4** — Échelle : multi-curriculum, multi-tenant durci, multi-région, `mode_ia`, marketplace personas.

## Extraction vers un dépôt dédié

Ce dossier est conçu pour devenir son propre dépôt. Deux options :

```bash
# Option simple : copier le dossier dans un nouveau dépôt
cp -r lea/ ../lea-tuteur-ia && cd ../lea-tuteur-ia && git init

# Option historique préservé : extraire avec git subtree
git subtree split --prefix=lea -b lea-only
# puis pousser la branche lea-only vers le nouveau remote
```
