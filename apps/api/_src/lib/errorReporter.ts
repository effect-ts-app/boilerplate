import { interrupted, pretty } from "@effect-ts/core/Effect/Cause"
import * as Sentry from "@sentry/node"

export function reportError<E, E2 extends { toJSON(): Record<string, unknown> }>(
  makeError: (cause: Cause<E>) => E2
) {
  return (cause: Cause<E>, context?: Record<string, unknown>) => {
    if (interrupted(cause)) {
      console.log("Interrupted", context)
      return
    }
    const scope = new Sentry.Scope()
    const error = makeError(cause)
    const extras = { context, error: error.toJSON() }
    scope.setExtras(extras)
    Sentry.captureException(error, scope)
    console.error(pretty(cause), extras)
  }
}

export function reportMessage(message: string) {
  Sentry.captureMessage(message)

  console.warn(message)
}

export function reportMessageM(message: string) {
  return Effect.succeedWith(() => reportMessage(message))
}
