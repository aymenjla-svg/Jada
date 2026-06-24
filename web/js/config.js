// ============================================================
//  Configuration JADA
//  ------------------------------------------------------------
//  L'appli marche TOUT DE SUITE sans rien remplir (mode local :
//  les données restent dans le navigateur du téléphone).
//
//  Pour activer la SYNCHRO entre les 2 téléphones (gratuit),
//  colle ici les 2 valeurs données par Supabase — voir SETUP_WEB.md.
//  Tant que c'est vide, l'appli reste en mode local.
// ============================================================

export const CONFIG = {
  // Exemple : "https://abcdefgh.supabase.co"
  SUPABASE_URL: "",
  // La clé "anon public" (commence par "eyJ...")
  SUPABASE_ANON_KEY: "",
};

export const SYNC_ENABLED = Boolean(CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY);
