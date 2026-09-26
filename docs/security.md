---
title: Security
---

# Security

- **Keep secrets on the server.** `MAXIVO_TOKEN` and `MAXIVO_WEBHOOK_SECRET` must never be `NEXT_PUBLIC_` variables. Only call the client from server components, route handlers or `generateMetadata`.
- **Tokens are read-only and project-scoped.** A token can only read published content of its own project. Create one token per environment so you can revoke one without affecting the others.
- **Rotate after a leak.** Revoke the token in Maxivo → Settings → API tokens, or rotate the webhook secret in Settings → Integration, then update your environment variables and redeploy.
- **Webhooks are signed and time-limited.** Unsigned, tampered or replayed requests older than 5 minutes are rejected.
- **HTML is sanitised by Maxivo.** Scripts, event handlers, inline styles and `javascript:` links are removed before publishing, and only YouTube (no-cookie) iframes are allowed. Render `blog.html` as-is; do not sanitise it again unless you add your own HTML to it.
- **Report vulnerabilities privately** through GitHub's "Report a vulnerability" button on this repository, not in public issues.
