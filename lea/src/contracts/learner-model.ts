/**
 * LearnerModel (SPEC §4, D3/R2, D4, §6).
 *
 * v1 : heuristique honnête. Phase 2 : BKT calé sur données. Cap : DKT (hors v1).
 * Le contrat ne change pas entre v1 et v2 (P3 : remplaçable sans réécriture).
 *
 * D4 : decay + horodatage jour 1 → répétition espacée. Le decay est appliqué
 * AU CALCUL (lazy), jamais par un batch — l'estimation dépend de `maintenant`.
 */
import type { EleveId, ObjectifId, Timestamp, TenantScoped } from './common.js';
import type { Verdict } from './verifier.js';

/** Niveau de maîtrise estimé pour un (élève, objectif). */
export interface Maitrise extends TenantScoped {
  readonly eleve_id: EleveId;
  readonly objectif_id: ObjectifId;
  /** Probabilité de maîtrise [0..1] (heuristique en v1, postérieur BKT en v2). */
  readonly p_maitrise: number;
  readonly derniere_revision: Timestamp;
  readonly derniere_reussite: Timestamp | null;
  readonly nb_tentatives: number;
}

/** Observation d'une tentative, alimentant la mise à jour du modèle. */
export interface Tentative extends TenantScoped {
  readonly eleve_id: EleveId;
  readonly objectif_id: ObjectifId;
  readonly verdict: Verdict;
  readonly horodatage: Timestamp;
}

/** Agrégat de présentation : 6 compétences (SPEC §6). */
export interface ProfilCompetences extends TenantScoped {
  readonly eleve_id: EleveId;
  /** competence -> niveau agrégé [0..1]. */
  readonly competences: Readonly<Record<string, number>>;
  readonly calcule_a: Timestamp;
}

export interface LearnerModel {
  /**
   * Estimation courante, decay appliqué à `maintenant`.
   * `null` si jamais observé (l'objectif n'a pas encore été abordé).
   */
  estimer(
    eleve_id: EleveId,
    objectif_id: ObjectifId,
    maintenant: Timestamp,
  ): Promise<Maitrise | null>;

  /** Met à jour le modèle à partir d'une tentative et retourne l'état nouveau. */
  observer(tentative: Tentative): Promise<Maitrise>;

  /** Objectifs « dus » pour révision (decay sous seuil) à `maintenant`. */
  dusPourRevision(
    eleve_id: EleveId,
    maintenant: Timestamp,
  ): Promise<readonly ObjectifId[]>;

  profil(eleve_id: EleveId, maintenant: Timestamp): Promise<ProfilCompetences>;
}
