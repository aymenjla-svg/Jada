/**
 * Verifier (SPEC §4, D1, D2) — outil « code dur » n°1.
 *
 * Le LLM parle ; le moteur déterministe vérifie. Le Verifier ne valide JAMAIS
 * du faux (invariant #1). 4 familles : numeric | symbolic | qcm | libre.
 */
import type { ObjectifId } from './common.js';

export type VerifierKind = 'numeric' | 'symbolic' | 'qcm' | 'libre';

/** Question posée à l'élève, telle que le moteur la connaît (vérité terrain). */
export interface Question {
  readonly objectif_id: ObjectifId;
  readonly kind: VerifierKind;
  /** Énoncé canonique (le LLM peut le reformuler à l'oral, jamais la solution). */
  readonly enonce: string;
  /** Spécification de correction propre à la famille. */
  readonly attendu: AttenduSpec;
}

export type AttenduSpec =
  | { readonly kind: 'numeric'; readonly valeur: number; readonly tolerance?: number; readonly unite?: string }
  | { readonly kind: 'symbolic'; readonly expression: string; readonly variables?: readonly string[] }
  | { readonly kind: 'qcm'; readonly bonnes_reponses: readonly string[]; readonly options: readonly string[] }
  | { readonly kind: 'libre'; readonly criteres: readonly string[]; readonly mots_cles?: readonly string[] };

export interface Verdict {
  readonly correct: boolean;
  /** [0..1] — confiance du verdict (1 = certain ; < 1 réservé au `libre`). */
  readonly confiance: number;
  /** Diagnostic actionnable pour le moteur (jamais montré tel quel à l'élève). */
  readonly diagnostic?: string;
  /** Rapproche d'une erreur-type connue (SPEC §5/§6) si reconnue. */
  readonly erreur_type?: string;
}

/**
 * Contrat de vérification. Déterministe pour numeric/symbolic/qcm.
 * `libre` peut déléguer à un juge (LLM ou rubrique) mais retourne toujours un
 * Verdict structuré — la décision « correct » reste celle du moteur.
 */
export interface Verifier {
  supports(kind: VerifierKind): boolean;
  verifier(question: Question, reponseEleve: string): Promise<Verdict>;
}
