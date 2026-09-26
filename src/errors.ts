/** Thrown for any failed Maxivo API call. `status` is 0 for network errors and timeouts. */
export class MaxivoError extends Error {
  readonly status: number
  readonly code: string
  readonly requestId: string | undefined

  constructor(status: number, code: string, message: string, options: { requestId?: string; cause?: unknown } = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause })
    this.name = "MaxivoError"
    this.status = status
    this.code = code
    this.requestId = options.requestId
  }

  /** True for errors worth retrying: network failures, timeouts, 429 and 5xx. */
  get retryable(): boolean {
    return this.status === 0 || this.status === 429 || this.status >= 500
  }
}
