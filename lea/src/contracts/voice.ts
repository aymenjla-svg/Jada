/**
 * Voice (SPEC §4, D11/R4, §8) — pipeline voix modulaire, temps-réel.
 *
 * Budget de latence : premier son < ~1 s (R4). Parole streamée ; les outils
 * (verifier, enregistrerResultat) tournent en tâche de fond. Barge-in :
 * l'élève peut couper la parole du tuteur à tout moment.
 */

/** Fragment audio sortant (TTS streamé). */
export interface AudioChunk {
  readonly pcm: Uint8Array;
  readonly sample_rate: number;
  readonly fin: boolean;
}

/** Transcription entrante (STM streamé). */
export interface Transcript {
  readonly texte: string;
  /** `false` = hypothèse partielle, `true` = segment finalisé. */
  readonly final: boolean;
}

export interface Voice {
  /** Synthèse streamée. Le premier `AudioChunk` doit viser < ~1 s (R4). */
  parler(texte: AsyncIterable<string> | string): AsyncIterable<AudioChunk>;

  /** Écoute streamée (micro -> transcript). */
  ecouter(): AsyncIterable<Transcript>;

  /**
   * Barge-in : interrompt immédiatement la synthèse en cours quand l'élève
   * reprend la parole. Idempotent.
   */
  interrompre(): void;
}
