# Site vitrine CG — mise en ligne gratuite (Cloudflare Pages + Turnstile)

## Contenu du dossier
- `index.html` : le site complet (tout est dans ce fichier).
- `functions/api/verify.js` : la vérification anti-robot côté serveur (Cloudflare l'exécute tout seul).
- `logo.png` (à ajouter toi-même) : ton logo CG, utilisé comme icône d'onglet.

## 1. Tester sur ton PC
Double-clique sur `index.html` pour voir le design. Sans clé Turnstile, le site est en **mode test** : les boutons affichent le lien sans vérification.
Les vrais salons, chiffres et la note passent par Cloudflare : ils n'apparaissent qu'une fois le site en ligne (ou avec `npx wrangler pages dev .` dans le dossier).

## 2. Créer la vérification Turnstile (gratuit)
1. Cloudflare > **Turnstile** > **Add widget**.
2. Nom : `CG Site`. Domaine : `cg-site.pages.dev` (ou le nom que tu choisiras à l'étape 3). Mode : **Managed**.
3. Note la **Site Key** (publique) et la **Secret Key** (secrète).
4. Dans `index.html`, tout en bas, bloc `CONFIG` : colle la Site Key dans `turnstileSiteKey: "..."`.

## 3. Mettre en ligne sur Cloudflare Pages
Méthode conseillée (avec ton GitHub, mises à jour automatiques) :
1. Crée un dépôt GitHub `cg-site` et envoie-y le dossier (avec le sous-dossier `functions`).
2. Cloudflare > **Workers & Pages** > **Create** > **Pages** > **Connect to Git** > choisis `cg-site`.
3. Framework : **None**. Build command : vide. Output directory : `/`. > **Deploy**.

Méthode sans GitHub (avec wrangler, déjà installé chez toi) :
```
cd cg-site
npx wrangler pages deploy . --project-name cg-site
```
⚠️ Le simple glisser-déposer sur le site de Cloudflare n'exécute pas le dossier `functions` : utilise une des deux méthodes ci-dessus.

## 4. Ajouter les variables (obligatoire)
Projet Pages > **Settings** > **Variables and Secrets** :
| Nom | Type | Valeur |
|---|---|---|
| `TURNSTILE_SECRET` | Secret | la Secret Key Turnstile |
| `DISCORD_INVITE` | Texte | `https://discord.gg/u4cY9qsRQ3` |
| `DOWNLOAD_URL` | Texte | le lien de ton installateur (GitHub Releases) |
| `DISCORD_BOT_TOKEN` | Secret | le token du bot CG, le même que dans le Worker cg-avis |

Variables facultatives pour `/api/discord` : `CATEGORY_NAME` (défaut « CG »), `CATEGORY_ID`, `AVIS_CHANNEL_ID` (défaut : le salon vocal « Avis: ⭐… »), `ONLY_PUBLIC` = `1` pour cacher les salons privés.

Puis **redéploie** (Deployments > ⋯ > Retry deployment) pour qu'elles soient prises en compte.

## Modifier le site
Tout ce qui change souvent est dans le bloc `CONFIG` en bas de `index.html` : clé Turnstile, note moyenne, couleurs proposées. Les textes sont lisibles directement dans le HTML.

## Liste des membres qui défile
Elle utilise le widget officiel de Discord (gratuit, sans bot) :
Discord > Paramètres du serveur > **Widget** > active **« Activer le widget du serveur »**.
Seuls les membres **connectés** apparaissent (jusqu'à 99). Tant que le widget est désactivé, la section affiche « La liste des membres arrive bientôt ».

## Salons, membres, note et langue
- Le site affiche les 8 premiers salons de la catégorie « CG », le nombre de membres / en ligne et la note lue dans le nom du salon vocal des avis. Tout se met à jour toutes les 2 minutes (`refreshEvery` dans `CONFIG`).
- Menu FR / EN en haut à droite ; le site s'ouvre en français par défaut et retient le choix du visiteur. Tous les textes sont dans le bloc `I18N` de `index.html`.
