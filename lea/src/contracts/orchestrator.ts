/**
 * ConversationOrchestrator (SPEC §4, D1, R4, R7, §6) — la boucle agentique.
 *
 * Le LLM PARLE ; le moteur déterministe SAIT, VÉRIFIE, TIENT LE CADRE.
 * - Parole immédiate (streamée) ; outils en tâche de fond (R4).
 * - `soul` réinjecté chaque tour (§6/§7).
 * - 2 outils « code dur » exposés au LLM (D1) : `verifier`, `enregistrerResultat`.
 * - Adaptation multi-modale (R7) : sur blocage → reformuler · simplifier ·
 *   changer_de_modalité.
 *
 * Les invariants (ne jamais valider du faux, ne jamais sortir du curriculum,
 * ne jamais humilier, sécurité du dialogue) sont tenus par le moteur, pas par
 * la bonne volonté du LLM.
 */
import type {
  EleveId,
  Modalite,
  ObjectifId,
  PersonaId,
  SessionId,
  TenantScoped,
} from './common.js';
import type { Verdict } from './verifier.js';

/** « Coups » que le moteur peut décider face à l'état de l'élève (R7). */
export type Coup =
  | { readonly type: 'proposer'; readonly objectif_id: ObjectifId }
  | { readonly type: 'reformuler' }
  | { readonly type: 'simplifier'; readonly vers?: ObjectifId } // niveau inférieur / prérequis via DAG
  | { readonly type: 'changer_de_modalité'; readonly modalite: Modalite }
  | { readonly type: 'encourager' }
  | { readonly type: 'reviser'; readonly objectif_id: ObjectifId }
  | { readonly type: 'clore' };

/** Déclencheurs de blocage (SPEC §6). */
export type SignalBlocage = 'echecs_repetes' | 'je_suis_perdu' | 'confusion_detectee';

/** Tour de dialogue persisté (table `dialogue_turns`, §5). */
export interface DialogueTurn extends TenantScoped {
  readonly session_id: SessionId;
  readonly acteur: 'tuteur' | 'eleve';
  readonly texte: string;
  readonly coup?: Coup;
  readonly verdict?: Verdict;
}

/** Contexte d'une session de tutorat. */
export interface SessionContext extends TenantScoped {
  readonly session_id: SessionId;
  readonly eleve_id: EleveId;
  readonly persona_id: PersonaId;
}

/** Sortie streamée d'un tour : la parole arrive avant la résolution des outils. */
export interface TurnOutput {
  /** Parole streamée vers Voice/Avatar (R4 : immédiate). */
  readonly parole: AsyncIterable<string>;
  /** Coup décidé par le moteur pour ce tour. */
  readonly coup: Promise<Coup>;
  /** Verdict si un `verifier` a été déclenché (tâche de fond). */
  readonly verdict?: Promise<Verdict>;
}

export interface ConversationOrchestrator {
  demarrer(ctx: SessionContext): Promise<void>;

  /**
   * Traite une entrée élève et produit un tour. La parole est streamée
   * immédiatement ; `verifier` et `enregistrerResultat` s'exécutent en tâche
   * de fond et résolvent `coup`/`verdict`.
   */
  tour(ctx: SessionContext, entreeEleve: string): Promise<TurnOutput>;

  /** Notifie le moteur d'un signal de blocage (déclenche l'adaptation R7). */
  signaler(ctx: SessionContext, signal: SignalBlocage): Promise<void>;

  clore(ctx: SessionContext): Promise<void>;
}
