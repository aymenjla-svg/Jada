# JADA web — mise en route (sans Mac, 0 €)

L'app web marche sur **n'importe quel téléphone** via un simple lien, s'ajoute à
l'écran d'accueil comme une vraie appli, et **ne coûte rien**.

Deux étapes : **(1)** la mettre en ligne (gratuit), **(2)** activer la synchro
entre vos 2 téléphones (gratuit aussi). L'étape 2 est optionnelle : sans elle,
chacun a ses données sur son propre téléphone.

---

## Étape 1 — Mettre l'appli en ligne (≈ 3 min)

1. Sur GitHub, ouvre ton dépôt → onglet **Settings** → menu **Pages**.
2. Dans **Build and deployment → Source**, choisis **GitHub Actions**.
3. C'est tout. À chaque modification, l'appli se republie automatiquement.
   L'adresse ressemblera à :
   **`https://<ton-utilisateur>.github.io/Jada/`**

> Tu peux déjà ouvrir ce lien sur ton iPhone et celui de ta femme et commencer à
> enregistrer (mode local : chaque téléphone garde ses données).

### Ajouter à l'écran d'accueil (effet « appli »)

- **iPhone (Safari)** : bouton Partager → **Sur l'écran d'accueil**.
- **Android (Chrome)** : menu ⋮ → **Ajouter à l'écran d'accueil**.

---

## Étape 2 — Activer la synchro entre vous deux (≈ 10 min, gratuit, sans CB)

La synchro utilise **Supabase** (offre gratuite, serveurs en Europe, aucune carte
bancaire demandée).

1. Va sur **supabase.com** → **Start your project** → crée un compte (gratuit).
2. **New project** :
   - Name : `jada`
   - Database Password : mets-en un et garde-le.
   - **Region : Frankfurt / EU** (données en Europe).
   - Crée le projet (attends ~1 min qu'il démarre).
3. Menu **SQL Editor** → **New query** → copie-colle **tout** le contenu du fichier
   `web/sql/schema.sql` → **Run**. (Ça crée les tables et la sécurité.)
   Fais de même avec `web/sql/album.sql` (album photo) puis
   `web/sql/milk_stock.sql` (stock de lait maternel) — chacun dans une nouvelle requête → **Run**.
4. Menu **Authentication → Sign In / Providers → Email** :
   - laisse **Email** activé ;
   - **désactive “Confirm email”** (sinon il faut valider un email à chaque compte).
5. Menu **Project Settings → API** : copie ces 2 valeurs :
   - **Project URL** (ex. `https://abcd.supabase.co`)
   - **anon public** key (longue, commence par `eyJ…`)
6. Ouvre le fichier `web/js/config.js` et colle-les :
   ```js
   export const CONFIG = {
     SUPABASE_URL: "https://abcd.supabase.co",
     SUPABASE_ANON_KEY: "eyJ……",
   };
   ```
   Enregistre / commit. L'appli se republie toute seule.
7. Sur chaque téléphone, ouvre l'appli : un écran **Connexion** apparaît.
   - Toi : **Créer un compte** avec ton email + un mot de passe.
   - Ta femme : **Créer un compte** avec son email + un mot de passe.
   - Une fois connectés, vous voyez **les mêmes données**, en temps réel. ✅

> Astuce attribution : en haut de l'onglet Maman, le bouton « 👤 Maman / Papa »
> indique qui enregistre. Ta femme le met sur « Maman », toi sur « Papa ».

---

## Confidentialité

- En mode synchro, les données (tétées, santé…) sont stockées chez Supabase
  **en Europe**, et **seuls vos 2 comptes** y ont accès (sécurité activée par le
  script SQL).
- Le **coffre-fort de documents** (passeport, carte Vitale…) n'est **pas** dans la
  version web pour l'instant : ces pièces sensibles restent prévues pour la version
  iPhone native (chiffrée sur l'appareil).

## En cas de souci

- Page blanche après l'étape 2 ? Vérifie que l'URL et la clé dans `config.js` sont
  correctes (pas d'espace, guillemets fermés).
- « Email ou mot de passe incorrect » à la 1re connexion : utilise d'abord
  **Créer un compte**.
- Le projet Supabase gratuit se met en veille après ~1 semaine **sans aucune
  activité** ; un usage quotidien le garde actif.
