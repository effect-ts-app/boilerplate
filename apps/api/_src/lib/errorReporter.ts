import * as Sentry from "@sentry/node"

export function reportError<E, E2 extends { toJSON(): Record<string, unknown> }>(
  makeError: (cause: Cause<E>) => E2
) {
  return (cause: Cause<E>, context?: Record<string, unknown>) => {
    if (cause.isInterrupted) {
      console.log("Interrupted", context)
      return
    }
    const scope = new Sentry.Scope()
    const error = makeError(cause)
    const extras = { context, error: error.toJSON() }
    scope.setExtras(extras)
    Sentry.captureException(error, scope)
    console.error(JSON.stringify(cause, undefined, 2), extras)
  }
}

export function captureException(error: unknown) {
  Sentry.captureException(error)
  console.error(error)
}

export function reportMessage(message: string) {
  Sentry.captureMessage(message)

  console.warn(message)
}

export function reportMessageM(message: string) {
  return Effect.sync(() => reportMessage(message))
}
