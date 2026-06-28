/**
 * Avatar (SPEC §4, D9, R6, §8) — la facette « visible ».
 *
 * RPM + R3F derrière `Avatar` (Convai = alternative). Paliers de présence (R6) :
 * 3D → 2D/SVG → texte+voix → texte seul. Le moteur pédagogique est IDENTIQUE à
 * tous les paliers ; seul le rendu change.
 */

/** Paliers de présence (R6), du plus riche au plus dégradé. */
export type Palier = '3d' | '2d_svg' | 'texte_voix' | 'texte';

/** Visèmes / expressions pour la synchronisation labiale et le regard. */
export interface FrameAvatar {
  /** Poids de blendshapes (visème -> [0..1]) pour le lip-sync. */
  readonly visemes: Readonly<Record<string, number>>;
  /** Émotion exprimée (bienveillante par défaut — jamais de jugement, P1). */
  readonly expression?: string;
  /** Cible du regard (coordonnées normalisées écran, jamais l'image caméra — P4). */
  readonly regard?: { readonly x: number; readonly y: number };
}

export interface Avatar {
  /** Palier effectivement rendu (détecté au lancement — R6/§8). */
  readonly palier: Palier;

  /** Pousse une frame de rendu (synchronisée avec la voix). */
  rendre(frame: FrameAvatar): void;

  /** Le palier courant supporte-t-il un rendu visuel animé ? */
  estIncarne(): boolean;
}
