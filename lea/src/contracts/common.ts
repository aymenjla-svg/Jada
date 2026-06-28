/**
 * Primitives partagées par tous les contrats.
 *
 * « À graver jour 1 » (SPEC §13) : `tenant_id` partout · timestamps partout ·
 * `events` propre dès la 1ʳᵉ fonctionnalité. Ces types rendent ces invariants
 * structurels — un agrégat qui n'est pas `TenantScoped & Timestamped` ne compile pas.
 */

// --- Identifiants typés (branded) ------------------------------------------
// Empêche de passer un EleveId là où un TenantId est attendu.
declare const __brand: unique symbol;
export type Brand<T, B extends string> = T & { readonly [__brand]: B };

export type TenantId = Brand<string, 'TenantId'>;
export type UserId = Brand<string, 'UserId'>;
export type EleveId = Brand<string, 'EleveId'>;
export type SessionId = Brand<string, 'SessionId'>;
export type ObjectifId = Brand<string, 'ObjectifId'>;
export type ReferentielId = Brand<string, 'ReferentielId'>;
export type PersonaId = Brand<string, 'PersonaId'>;
export type ExerciceTemplateId = Brand<string, 'ExerciceTemplateId'>;

/** ISO-8601 UTC. Une seule horloge logique pour tout le système. */
export type Timestamp = Brand<string, 'Timestamp'>;

// --- Multi-tenant (D7 : Postgres unique + RLS) -----------------------------
export interface TenantScoped {
  readonly tenant_id: TenantId;
}

export interface Timestamped {
  readonly created_at: Timestamp;
  readonly updated_at: Timestamp;
}

/** Tout agrégat persisté DOIT être au minimum ceci. */
export type Aggregate = TenantScoped & Timestamped;

// --- Mode IA & conformité (D6 / R3) ----------------------------------------
export type ModeIA = 'inclus' | 'byok';
export type Region = string; // ex. 'eu-west', résidence des données (D7, §9).

/**
 * Drapeau de conformité mineur (invariant #7) : non reportable, indépendant
 * du mode de paiement. Mineur ⇒ provider conforme + no-train.
 */
export interface ComplianceContext {
  readonly est_mineur: boolean;
  readonly consentement_adulte: boolean;
  readonly no_train: boolean;
  readonly region: Region;
}

// --- Modalités (R7) ---------------------------------------------------------
/** Pas de « style d'apprentissage » figé : multi-représentation pour tous. */
export type Modalite = 'textuel' | 'visuel' | 'interactif';

// --- Résultats -------------------------------------------------------------
export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

// --- Télémétrie / events (D13, §13) ----------------------------------------
/** Enveloppe d'événement uniforme. Chaque table émet des `events`. */
export interface DomainEvent<TPayload = unknown> extends TenantScoped {
  readonly id: string;
  readonly type: string;
  readonly occurred_at: Timestamp;
  readonly actor?: UserId | EleveId;
  readonly session_id?: SessionId;
  readonly payload: TPayload;
}

/** Bus d'événements (contrat P3 : remplaçable sans réécriture). */
export interface EventSink {
  emit(event: DomainEvent): Promise<void>;
}
