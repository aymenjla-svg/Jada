/**
 * LLMGateway (SPEC §4, D6/R3) — passerelle multi-rôle.
 *
 * `tenant.mode_ia: inclus | byok`. Dev = clé éditeur (env backend, plafond
 * budget). Conformité mineur non reportable (invariant #7) : mineur ⇒ provider
 * conforme + no-train, quel que soit le mode de paiement.
 *
 * Le LLM est agentique (D1) : il dispose d'outils « code dur ». La Gateway
 * expose donc l'appel d'outils, mais ne décide jamais d'un verdict elle-même.
 */
import type { ComplianceContext, ModeIA, TenantId } from './common.js';

export type Role = 'system' | 'user' | 'assistant' | 'tool';

export interface Message {
  readonly role: Role;
  readonly content: string;
  /** Présent pour role='tool' : à quel appel d'outil ceci répond. */
  readonly tool_call_id?: string;
}

/** Déclaration d'un outil « code dur » exposé au LLM (ex. verifier). */
export interface ToolSpec {
  readonly name: string;
  readonly description: string;
  /** JSON Schema des paramètres. */
  readonly parameters: Record<string, unknown>;
}

export interface ToolCall {
  readonly id: string;
  readonly name: string;
  readonly arguments: Record<string, unknown>;
}

export interface LLMRequest {
  readonly tenant_id: TenantId;
  readonly mode_ia: ModeIA;
  readonly compliance: ComplianceContext;
  readonly messages: readonly Message[];
  readonly tools?: readonly ToolSpec[];
  /** Budget de latence (R4) : premier token streamé < ~1 s visé. */
  readonly latence_budget_ms?: number;
}

/** Fragment de réponse streamée (parole immédiate — R4). */
export interface LLMChunk {
  readonly delta_text?: string;
  readonly tool_call?: ToolCall;
  readonly done?: boolean;
}

export interface LLMGateway {
  /**
   * Stream la réponse. La résolution du provider dépend de `mode_ia` ET de
   * `compliance` : un `compliance.est_mineur` force un provider conforme +
   * no-train même en `byok`.
   */
  stream(req: LLMRequest): AsyncIterable<LLMChunk>;
}
