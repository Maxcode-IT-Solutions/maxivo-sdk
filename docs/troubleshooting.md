---
title: Troubleshooting
---

# Troubleshooting

**The blog list is empty.** Only published posts are returned. Check that the post is published in Maxivo and that the language you ask for is published and reviewed.

**`401 bad_token`.** The token is wrong, revoked, or from another project. Check that `projectKey` matches the token's project.

**`400 bad_lang`.** The project does not have that language enabled. Check Maxivo → Settings → General → Target languages.

**Published changes take minutes to appear.** The webhook is not reaching your site. In Maxivo → Settings → Integration, click **Send test** and check for `200`. Common causes:

- a wrong URL;
- the route is not deployed;
- a wrong `MAXIVO_WEBHOOK_SECRET`, which returns `401`;
- middleware that blocks or redirects `/api/maxivo/revalidate`.

**The webhook returns `401 expired`.** The server clock is off by more than 5 minutes. Fix NTP on the host.

**`invalid_response` in development.** The CMS and the SDK disagree on the response shape. Upgrade `@maxivo/sdk` to the latest version.

**`TypeError: crypto.subtle is undefined`.** You are on Node 18 or older. Use Node 20+.

**Arabic text is left-aligned.** Render the article with `dir="rtl"` (use `RTL_LANGUAGES`) and add the `[dir="rtl"] .cms-content` styles from the Next.js guide.
