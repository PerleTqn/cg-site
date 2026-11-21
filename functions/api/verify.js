// Cloudflare Pages Function : POST /api/verify
// Vérifie le jeton Turnstile côté serveur, puis renvoie le lien demandé.
// Les liens ne sont jamais écrits dans la page : un robot ne peut pas les lire.
//
// Variables à créer dans Cloudflare Pages > ton projet > Settings > Variables and Secrets :
//   TURNSTILE_SECRET  (secret)  : la "Secret Key" de Turnstile
//   DISCORD_INVITE    (texte)   : https://discord.gg/u4cY9qsRQ3
//   DOWNLOAD_URL      (texte)   : le lien de ton installateur (GitHub Releases)

export async function onRequestPost({ request, env }) {
  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: "requête invalide" }, 400); }

  const { token, type } = body || {};
  if (!token || !["discord", "download"].includes(type)) return json({ ok: false, error: "requête invalide" }, 400);

  // Tant que Turnstile n'est pas configuré (pas de TURNSTILE_SECRET), on donne le lien sans vérification.
  if (env.TURNSTILE_SECRET) {
  const form = new FormData();
  form.append("secret", env.TURNSTILE_SECRET);
  form.append("response", token);
  const ip = request.headers.get("CF-Connecting-IP");
  if (ip) form.append("remoteip", ip);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
  const out = await res.json();
  if (!out.success) return json({ ok: false, error: "vérification échouée" }, 403);
  }

  const url = type === "discord" ? env.DISCORD_INVITE : env.DOWNLOAD_URL;
  if (!url) return json({ ok: false, error: "lien non configuré" }, 500);
  return json({ ok: true, url });
}
