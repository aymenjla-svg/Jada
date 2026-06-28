/**
 * Curriculum (SPEC §4, D2, §6) — le DAG d'objectifs atomiques.
 *
 * YAML versionné, BO = 1er référentiel. Invariant #2 : ne jamais sortir du
 * curriculum. Le moteur ne propose que des objectifs atteignables selon le DAG
 * de prérequis.
 */
import type {
  ExerciceTemplateId,
  Modalite,
  ObjectifId,
  ReferentielId,
} from './common.js';
import type { VerifierKind } from './verifier.js';

/** Provenance du contenu (R1 : prof = source primaire). */
export type Origine = 'prof' | 'llm';
export type StatutContenu = 'valide' | 'à_valider' | 'rejeté';

/** Objectif atomique : 3–5 par notion (D2). */
export interface Objectif {
  readonly id: ObjectifId;
  readonly referentiel_id: ReferentielId;
  readonly intitule: string;
  /** Compétence agrégée (SPEC §6 : agrégation 6 compétences). */
  readonly competence: string;
}

/** Arête du DAG : `objectif` requiert `prerequis`. */
export interface Prerequis {
  readonly objectif_id: ObjectifId;
  readonly prerequis_id: ObjectifId;
}

/** Une représentation d'un contenu dans une modalité donnée (R7). */
export interface Representation {
  readonly modalite: Modalite;
  /** Asset (URL/clé) pour `visuel`, ou identifiant de composant front pour `interactif`. */
  readonly asset?: string;
  readonly composant?: string;
}

/** Template d'exercice paramétré (D5), construit à partir d'exos prof (R1). */
export interface ExerciceTemplate {
  readonly id: ExerciceTemplateId;
  readonly objectif_id: ObjectifId;
  readonly origine: Origine;
  readonly statut: StatutContenu;
  readonly kind: VerifierKind;
  /** Squelette à trous + générateur de paramètres (étapes pour exos à étapes). */
  readonly squelette: string;
  readonly representations: readonly Representation[];
}

/**
 * Contrat Curriculum. Lecture seule côté moteur pédagogique : la production de
 * contenu (import prof, extension LLM à valider) passe par un autre chemin.
 */
export interface Curriculum {
  getObjectif(id: ObjectifId): Promise<Objectif | null>;
  /** Prérequis directs de `id` (arêtes entrantes du DAG). */
  prerequisDe(id: ObjectifId): Promise<readonly ObjectifId[]>;
  /** Objectifs débloqués par la maîtrise de `id` (arêtes sortantes). */
  suivantsDe(id: ObjectifId): Promise<readonly ObjectifId[]>;
  /** Templates disponibles pour un objectif (filtrables par modalité — R7). */
  templates(objectif_id: ObjectifId, modalite?: Modalite): Promise<readonly ExerciceTemplate[]>;
}
