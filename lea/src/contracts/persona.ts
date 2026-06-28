/**
 * Persona (SPEC §4, D9, §7) — 3 facettes SÉPARÉES.
 *
 * 1) apparence (RPM + voix)
 * 2) soul (style conversationnel, réinjecté chaque tour)
 * 3) pédagogie (PARAMÈTRES MOTEUR, pas un prompt)
 *
 * Même moteur, mêmes invariants pour tous : les personas diffèrent par le
 * chemin et le style, jamais par le cadre. Catalogue = donnée. Matching
 * élève ↔ persona.
 */
import type { Modalite, PersonaId, TenantScoped } from './common.js';

/** Facette 1 — apparence : ce qui se voit/s'entend. */
export interface Apparence {
  /** Avatar Ready Player Me (URL .glb) — D9. */
  readonly rpm_avatar_url: string;
  /** Identifiant de voix dans le pipeline (D11). */
  readonly voix_id: string;
}

/** Facette 2 — soul : style, réinjecté à chaque tour de la boucle agentique. */
export interface Soul {
  readonly nom: string;
  readonly ton: string;
  /** Texte de style injecté dans le system prompt (jamais la pédagogie). */
  readonly style_prompt: string;
}

/**
 * Facette 3 — pédagogie : PARAMÈTRES du moteur déterministe. Pas de prompt ici.
 * Ils inclinent le comportement sans jamais toucher aux invariants.
 */
export interface ParametresPedagogie {
  /** Modalité d'entrée préférée (indice doux R7, jamais une étiquette figée). */
  readonly modalite_par_defaut: Modalite;
  /** Seuil d'échecs consécutifs avant adaptation (reformuler/simplifier/modalité). */
  readonly seuil_blocage: number;
  /** Patience : nb de relances avant de simplifier d'un cran. */
  readonly relances_avant_simplification: number;
  /** Densité d'encouragement [0..1] (sécurité psychologique P1, jamais d'humiliation). */
  readonly chaleur: number;
}

export interface Persona extends TenantScoped {
  readonly id: PersonaId;
  readonly apparence: Apparence;
  readonly soul: Soul;
  readonly pedagogie: ParametresPedagogie;
}

export interface PersonaCatalogue {
  get(id: PersonaId): Promise<Persona | null>;
  lister(): Promise<readonly Persona[]>;
  /** Matching élève ↔ persona (heuristique de départ). */
  matcher(eleve_id: string): Promise<Persona>;
}
