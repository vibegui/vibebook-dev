# AGENTS.md

Parking site for vibebook.dev after the move to deco.chat (Nov 2026). See README.

- `src/index.ts`: the whole Worker (redirects, moved page, 410s, banner via HTMLRewriter). `public/`: the old static pages, unchanged; edit the banner in the Worker, not the pages.
- Local: `bunx wrangler dev --port 8833 --ip 127.0.0.1`.
- Deploy (`wrangler deploy`, Worker name `vibebook`, which replaces the old app on vibebook.dev) is Gui's call: never deploy without his explicit OK.
