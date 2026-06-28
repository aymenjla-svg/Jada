/**
 * AttentionSource (SPEC §4, D12, D10, §8/§9) — l'attention est un SIGNAL
 * PÉDAGOGIQUE, source-agnostique.
 *
 * Privacy-by-design mineurs (P4) : la caméra est 100 % locale (D10). La vidéo
 * ne sort JAMAIS (invariant #4) — seules des COORDONNÉES / signaux dérivés
 * remontent. Bienveillant, désactivable (§8). Effacement via `tenant_id` (D10).
 */
import type { EleveId, SessionId, Timestamp } from './common.js';

export type NiveauAttention = 'concentré' | 'distrait' | 'absent' | 'inconnu';

/** Signal dérivé — jamais d'image. */
export interface SignalAttention {
  readonly eleve_id: EleveId;
  readonly session_id: SessionId;
  readonly niveau: NiveauAttention;
  /** Confiance [0..1]. */
  readonly confiance: number;
  readonly horodatage: Timestamp;
}

export interface AttentionSource {
  /** Source active et autorisée (consentement + non désactivée) ? */
  estActive(): boolean;

  /** Flux de signaux dérivés (jamais de frames vidéo). */
  signaux(): AsyncIterable<SignalAttention>;

  /** Désactivation à chaud (§8 : toujours désactivable). */
  desactiver(): void;
}
