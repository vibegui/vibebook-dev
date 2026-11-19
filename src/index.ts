// vibebook.dev parking site: the old public pages, a yellow "now deco.chat" banner on every HTML page,
// and every app/API path pointing to https://chat.decocms.com. No storage, no login.
const TO = "https://chat.decocms.com";

type Env = { ASSETS: Fetcher; OLD: Fetcher };

const isEn = (req: Request) => {
  const c = /(?:^|;\s*)vb_lang=(pt|en)/.exec(req.headers.get("cookie") ?? "")?.[1];
  if (c) return c === "en";
  const al = (req.headers.get("accept-language") ?? "").toLowerCase();
  return !!al && !al.startsWith("pt");
};

const BANNER_CSS = `<style>
:root { --vb-moved-h: 44px; }
html { scroll-padding-top: var(--vb-moved-h); }
body { padding-top: var(--vb-moved-h) !important; }
nav { top: var(--vb-moved-h) !important; }
.vb-moved { position: fixed; inset: 0 0 auto 0; z-index: 2147483647; min-height: var(--vb-moved-h); box-sizing: border-box;
  display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap; padding: 8px 16px;
  background: #ffd400; color: #111; font: 600 15px/1.3 -apple-system, "Segoe UI", Roboto, sans-serif; text-align: center; }
.vb-moved a { color: #111; text-decoration: underline; text-underline-offset: 3px; white-space: nowrap; }
@media (max-width: 480px) { :root { --vb-moved-h: 40px; } .vb-moved { font-size: 13px; gap: 8px; padding: 6px 12px; } }
</style>`;
const banner = (en: boolean) =>
  `<div class="vb-moved" role="note">${en ? "vibebook is now deco.chat!" : "o vibebook agora é deco.chat!"} <a href="${TO}">${en ? "Go to deco.chat →" : "Ir pro deco.chat →"}</a></div>`;

function withBanner(res: Response, en: boolean) {
  if (!(res.headers.get("content-type") ?? "").includes("text/html")) return res;
  return new HTMLRewriter()
    .on("head", { element: (e) => e.append(BANNER_CSS, { html: true }) })
    .on("body", { element: (e) => e.prepend(banner(en), { html: true }) })
    // The app's buttons (Criar meu primeiro vibebook, Entrar, connect) go straight to deco.chat.
    .on('a[href^="/app"], a[href^="/login"], a[href="/pt/connect"], a[href="/en/connect"]', {
      element: (e) => e.setAttribute("href", TO),
    })
    .transform(res);
}

function movedPage(en: boolean, status = 200) {
  const t = en
    ? { title: "Your conversations moved to deco.chat", body: "Sign in to deco.chat with your deco account, using the same email, and the same rooms and conversations are there.", btn: "Open deco.chat", note: "Rooms were copied on 18 Nov 2026; anything written on vibebook.dev after that stayed behind." }
    : { title: "Suas conversas mudaram pro deco.chat", body: "Entre no deco.chat com sua conta deco, com o mesmo email, e as mesmas salas e conversas estão lá.", btn: "Abrir o deco.chat", note: "As salas foram copiadas em 18 nov 2026; o que foi escrito no vibebook.dev depois disso ficou pra trás." };
  return new Response(
    `<!doctype html><html lang="${en ? "en" : "pt-BR"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${t.title}</title><link rel="icon" href="/favicon.svg"><style>
body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0e1116; color: #eef0f3; font: 16px/1.5 -apple-system, "Segoe UI", Roboto, sans-serif; }
main { max-width: 480px; padding: 32px 20px; text-align: center; }
h1 { font-size: 28px; line-height: 1.2; margin: 0 0 14px; }
p { color: #b8bec8; margin: 0 0 24px; }
a.btn { display: inline-block; background: #d0ec1a; color: #0a3f1e; font-weight: 700; padding: 12px 22px; border-radius: 12px; text-decoration: none; }
small { display: block; margin-top: 28px; color: #7d8592; font-size: 13px; }
</style></head><body><main><h1>${t.title}</h1><p>${t.body}</p><a class="btn" href="${TO}/">${t.btn}</a><small>${t.note}</small></main></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } },
  );
}

const gone = () => Response.json({ error: "moved", to: TO }, { status: 410 });

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const p = url.pathname;
    const en = p === "/en" || p.startsWith("/en/") ? true : p === "/pt" || p.startsWith("/pt/") ? false : isEn(req);
    if (p === "/") return Response.redirect(`${url.origin}/${en ? "en" : "pt"}`, 302);
    // Until the last copy to deco.chat is done, its export (token-guarded, in the old app Worker) stays reachable here.
    if (p.startsWith("/migrate/")) return env.OLD.fetch(req);
    const room = /^\/b\/([A-Za-z0-9_-]+)\/?$/.exec(p);
    if (room) return Response.redirect(`${TO}/b/${room[1]}${url.search}`, 302);
    // Old links to a room's files, icon or someone's avatar: the same file on deco.chat (the files were copied 1:1).
    if (req.method === "GET" && /^\/api\/(books\/[A-Za-z0-9_-]+\/(files\/[A-Za-z0-9_-]+|icon)|avatar\/[^/]+)$/.test(p))
      return Response.redirect(`${TO}${p}${url.search}`, 302);
    if (p === "/mcp" || p === "/authorize" || /^\/(api|oauth|ws|ws-me|yjs)(\/|$)/.test(p)) return gone();
    if (p === "/llms.txt") return new Response(`# vibebook is now deco.chat\n\nRead ${TO}/llms.txt and set it up from there.\n`, { headers: { "content-type": "text/plain; charset=utf-8" } });
    if (p === "/install.sh" || p === "/setup.sh") return new Response(`#!/bin/sh\necho "vibebook moved to deco.chat: curl -fsSL ${TO}/install.sh | sh" >&2\nexit 1\n`, { headers: { "content-type": "text/plain; charset=utf-8" } });
    if (p === "/cli.mjs") return new Response(`console.error("vibebook moved to deco.chat: curl -fsSL ${TO}/install.sh | sh"); process.exit(1);\n`, { headers: { "content-type": "text/javascript; charset=utf-8" } });
    // The app's own pages open the same page on deco.chat (/b/<id> above keeps the room and thread).
    if (p === "/app" || p.startsWith("/app/") || p === "/archived" || p === "/settings") return Response.redirect(`${TO}${p}${url.search}`, 302);
    if (p === "/login" || p.startsWith("/auth/")) return withBanner(movedPage(en), en);
    const res = await env.ASSETS.fetch(req);
    if (res.status === 404 && (req.headers.get("accept") ?? "").includes("text/html")) return withBanner(movedPage(en, 404), en);
    return withBanner(res, en);
  },
};
