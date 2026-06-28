/**
 * SafetyFilter (SPEC §4, R5, §9) — invariant #6 : sécurité du dialogue.
 *
 * Filtre de SORTIE (rien d'inapproprié ne sort vers un mineur) + détection de
 * DÉTRESSE → escalade adulte via `safety_alerts`. Présent dès P1 (minimal).
 */
import type { EleveId, SessionId, TenantScoped, Timestamp } from './common.js';

export type SafetyDecision = 'autoriser' | 'reformuler' | 'bloquer';
export type DetresseNiveau = 'aucune' | 'légère' | 'élevée' | 'critique';

export interface SafetyAssessment {
  readonly decision: SafetyDecision;
  readonly detresse: DetresseNiveau;
  /** Catégories déclenchées (ex. 'auto-mutilation', 'contenu_adulte'). */
  readonly categories: readonly string[];
  /** Texte de remplacement si `decision = 'reformuler'`. */
  readonly remplacement?: string;
  /** Vrai si une `SafetyAlert` doit être levée (escalade adulte). */
  readonly escalade: boolean;
}

export interface SafetyAlert extends TenantScoped {
  readonly id: string;
  readonly eleve_id: EleveId;
  readonly session_id: SessionId;
  readonly niveau: DetresseNiveau;
  readonly resume: string;
  readonly cree_a: Timestamp;
}

export interface SafetyFilter {
  /** Évalue un message AVANT qu'il n'atteigne l'élève. */
  filtrerSortie(texte: string, ctx: { eleve_id: EleveId; session_id: SessionId }): Promise<SafetyAssessment>;

  /** Évalue un message de l'élève pour détecter une détresse. */
  evaluerEntree(texte: string, ctx: { eleve_id: EleveId; session_id: SessionId }): Promise<SafetyAssessment>;

  /** Persiste une alerte (escalade adulte). */
  alerter(alert: SafetyAlert): Promise<void>;
}
