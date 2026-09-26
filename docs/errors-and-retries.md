---
title: Errors and retries
---

# Errors and retries

Every failed call throws a `MaxivoError`:

| Property    | Meaning                                                         |
| ----------- | --------------------------------------------------------------- |
| `status`    | HTTP status, or `0` for network errors and timeouts             |
| `code`      | Machine-readable reason (below)                                 |
| `message`   | Human-readable reason                                           |
| `requestId` | Maxivo's request id, if returned (quote it in support requests) |
| `retryable` | `true` for network errors, timeouts, `429` and `5xx`            |

## Common codes

| Code               | Status | What to do                                                                              |
| ------------------ | ------ | --------------------------------------------------------------------------------------- |
| `bad_token`        | 401    | The token is wrong, revoked, or belongs to another project. Create a new one in Maxivo. |
| `not_found`        | 404    | `getBlog` turns this into `null`; other methods mean a wrong project key.               |
| `bad_lang`         | 400    | The project does not have that language enabled.                                        |
| `rate_limited`     | 429    | Over 120 requests a minute per token. Rely on Next.js caching.                          |
| `timeout`          | 0      | No response within `timeoutMs`.                                                         |
| `network_error`    | 0      | DNS, TLS or connection failure.                                                         |
| `invalid_response` | 200    | The response did not match the expected shape (usually an SDK/CMS version mismatch).    |

## Retries

The client retries retryable errors automatically, with exponential backoff: 200 ms, 400 ms, 800 ms, and so on, up to 2 seconds per wait.

```ts
createMaxivoClient({ /* … */, retries: 2, timeoutMs: 10_000 })
```

Set `retries: 0` to fail fast, for example at build time where a failure should stop the build.

## Handling errors

```ts
import { MaxivoError } from "@maxivo/sdk"

try {
  return await maxivo.listBlogs({ lang: "hi" })
} catch (err) {
  if (err instanceof MaxivoError && err.retryable) return { items: [], page: 1, pageSize: 12, total: 0 } // degrade gracefully
  throw err
}
```

## Response validation

Outside production, the client validates every response with zod and throws `invalid_response` on a mismatch, which catches contract drift early. In production validation is off for speed; force it with `validate: true`.
