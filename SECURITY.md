# Security

Please do not open public issues for security problems. Email security@maxcode.in (or message Aniket directly) with:

- what you found and how to reproduce it,
- which SDK version is affected.

We reply within 2 working days and ship fixes as patch releases.

## Guidance for users

- `MAXIVO_TOKEN` and `MAXIVO_WEBHOOK_SECRET` are server-side secrets. Never prefix them with `NEXT_PUBLIC_` and never send them to the browser.
- The revalidate handler rejects unsigned requests and requests older than 5 minutes. Rotate the webhook secret in Maxivo if it may have leaked.
