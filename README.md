# vibebook.dev (parking)

vibebook is now deco.chat (https://chat.decocms.com). This Worker keeps vibebook.dev up as a parking site:

- the old public pages (landing pt/en, docs, how it works, herdr, agents, @vibe/Jev, changelog, personas), each with a yellow "vibebook is now deco.chat!" banner injected by the Worker;
- `/app`, `/login` and other app pages: "your conversations moved to deco.chat" (sign in with your deco account, same email);
- `/b/<id>` redirects to the same room on deco.chat; `/mcp`, `/api/*`, `/oauth/*` answer 410 `{"error":"moved"}`; `/install.sh` and `/llms.txt` point to deco.chat.

No database, no login, no secrets.

Run locally: `bunx wrangler dev --port 8833 --ip 127.0.0.1`.
