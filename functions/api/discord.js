// Cloudflare Pages Function : GET /api/discord
// Renvoie les infos publiques du serveur pour le site (mis en cache 60 s).
// Le token du bot reste ici, côté Cloudflare : il n'apparaît jamais dans la page.
//
// Variables (Cloudflare Pages > Settings > Variables and Secrets) :
//   DISCORD_BOT_TOKEN (secret, obligatoire) : le token du bot CG (même nom que dans cg-avis ; BOT_TOKEN accepté aussi)
//   GUILD_ID         (optionnel) : 1367759439138132039 par défaut
//   CATEGORY_NAME    (optionnel) : nom de la catégorie à afficher, "CG" par défaut
//   CATEGORY_ID      (optionnel) : ID de la catégorie (prioritaire sur le nom)
//   AVIS_CHANNEL_ID  (optionnel) : salon vocal "Avis: ⭐4.9/5.0", 1571323276561481809 par défaut
//   ONLY_PUBLIC      (optionnel) : "1" pour cacher les salons invisibles pour @everyone

const VIEW_CHANNEL = 1n << 10n;
const clean = s => String(s || "").replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();

export async function onRequestGet({ request, env, waitUntil }) {
  const json = (data, status = 200, maxAge = 60) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json", "Cache-Control": `public, max-age=${maxAge}` },
    });

  const TOKEN = env.DISCORD_BOT_TOKEN || env.BOT_TOKEN;
  if (!TOKEN) return json({ ok: false, error: "DISCORD_BOT_TOKEN manquant" }, 500, 0);

  const cache = caches.default;
  const key = new Request(new URL("/api/discord", request.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;

  const gid = env.GUILD_ID || "1367759439138132039";
  const H = { Authorization: `Bot ${TOKEN}` };
  const get = url => fetch(url, { headers: H }).then(r => (r.ok ? r.json() : Promise.reject(r.status)));

  let guild, channels;
  try {
    [guild, channels] = await Promise.all([
      get(`https://discord.com/api/v10/guilds/${gid}?with_counts=true`),
      get(`https://discord.com/api/v10/guilds/${gid}/channels`),
    ]);
  } catch (e) {
    return json({ ok: false, error: "Discord a refusé la requête (" + e + ")" }, 502, 0);
  }

  // Catégorie "CG"
  const cat = channels.find(c => c.type === 4 && (env.CATEGORY_ID ? c.id === env.CATEGORY_ID : clean(c.name) === clean(env.CATEGORY_NAME || "CG")));
  const isPublic = c => !(c.permission_overwrites || []).some(o => o.id === gid && (BigInt(o.deny) & VIEW_CHANNEL));
  const isVoice = c => c.type === 2 || c.type === 13;

  const list = cat
    ? channels
        .filter(c => c.parent_id === cat.id && (env.ONLY_PUBLIC === "1" ? isPublic(c) : true))
        .sort((a, b) => isVoice(a) - isVoice(b) || a.position - b.position)
        .slice(0, 8)
        .map(c => ({ name: c.name, type: c.type }))
    : [];

  // Note moyenne lue dans le nom du salon vocal des avis
  const avis = channels.find(c => c.id === (env.AVIS_CHANNEL_ID || "1571323276561481809"));
  const m = avis && avis.name.match(/(\d+(?:[.,]\d+)?)\s*\/\s*5/);
  const rating = m ? parseFloat(m[1].replace(",", ".")) : null;

  const res = json({
    ok: true,
    name: guild.name,
    icon: guild.icon ? `https://cdn.discordapp.com/icons/${gid}/${guild.icon}.png?size=128` : null,
    members: guild.approximate_member_count,
    online: guild.approximate_presence_count,
    category: cat ? cat.name : null,
    channels: list,
    rating,
    updated: Date.now(),
  });
  waitUntil(cache.put(key, res.clone()));
  return res;
}
