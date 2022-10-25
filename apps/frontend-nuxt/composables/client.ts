import type { Http } from "@effect-ts-app/core/http/http-client"
import { InterruptedException } from "@effect/core/io/Cause"
import type {
  ApiConfig,
  FetchError,
  InvalidStateError,
  NotFoundError,
  NotLoggedInError,
  OptimisticConcurrencyException,
  ResponseError,
  UnauthorizedError,
  ValidationError
} from "@effect-ts-app/boilerplate-client/lib"
import { flow, tuple } from "@effect-ts-app/boilerplate-prelude/Function"
import { useAction, useMutation } from "@effect-ts-app/boilerplate-vue"
import { useToast } from "vue-toastification"
import type { Effect, Either } from "./prelude"

export { clientFor, isFailed, isInitializing, isRefreshing, isSuccess } from "@effect-ts-app/boilerplate-client/lib"
export { run, useAction, useMutation, useSafeQuery } from "@effect-ts-app/boilerplate-vue"

/**
 * Pass a function that returns an Effect, e.g from a client action, give it a name, and optionally pass an onSuccess callback.
 * Returns a tuple with state ref and execution function which reports errors as Toast.
 */
export function useAndHandleMutation<I, E extends ResponseError | FetchError, A, X>(
  self: (i: I) => Effect.Effect<ApiConfig | Http, E, A>,
  action: string,
  onSuccess?: () => Promise<X>
) {
  const [a, b] = useMutation(self)

  return tuple(a, handleRequest(b, action, onSuccess))
}

/**
 * Pass an Effect, e.g from a client action, give it a name, and optionally pass an onSuccess callback.
 * Returns a tuple with state ref and execution function which reports errors as Toast.
 */
export function useAndHandleAction<E extends ResponseError | FetchError, A, X>(
  self: Effect.Effect<ApiConfig | Http, E, A>,
  action: string,
  onSuccess?: (a: A) => Promise<X>
) {
  const [a, b] = useAction(self)

  return tuple(a, handleRequest(b, action, onSuccess))
}

/**
 * Pass a function that returns a Promise.
 * Returns an execution function which reports errors as Toast.
 */
export function handleRequest<X, E extends ResponseError | FetchError, A, Args extends unknown[]>(
  f: (...args: Args) => Promise<Either.Either<E, A>>,
  action: string,
  onSuccess?: (a: A) => Promise<X>
) {
  const toast = useToast()
  return flow(f, p =>
    p.then(r =>
      r._tag === "Right"
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        ? onSuccess ? onSuccess(r.right).then(() => {}) : Promise.resolve(void 0 as void)
        : Promise.resolve(toast.error(`Error trying to ${action}: ` + renderError(r.left)))
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          .then(_ => {}), err => {
      if (err instanceof InterruptedException) {
        return
      }
      // TODO: Report?
      toast.error(`Unexpected Error trying to ${action}: ` + err.toString())
    }))
}

// TODO: Treat HttpErrorRequest and ResponseError as Exception
// and treat HttpErrorResponse with a SupportedErrrors body, as a user useful error.
export function renderError(e: ResponseError | FetchError) {
  if (e._tag === "HttpErrorRequest") {
    return `There was an error in the request: ${e.error}`
  }
  if (e._tag === "HttpErrorResponse") {
    return `There was an error in processing the response: \n${
      e.response.body._tag === "Some" && e.response.body.value ? parseError(e.response.body.value) : ""
    } (${e.response.status})`
  }

  if (e._tag === "ResponseError") {
    return `The request was not successful: ${e.error}`
  }
}

function parseError(e: string) {
  try {
    const js = JSON.parse(e)
    if ("_tag" in js) {
      if ("message" in js) {
        return `${js._tag}: ${js.message}`
      }
      return js._tag
      // const err = js as SupportedErrors
      // switch (err._tag) {
      //   case "InvalidStateError":
      // }
    }
    if ("message" in js) {
      return js.message
    }
    return "Unknown"
  } catch {
    return "There was an error trying to parse the error response"
  }
}

export type SupportedErrors =
  | ValidationError
  | NotFoundError
  | NotLoggedInError
  | UnauthorizedError
  | InvalidStateError
  | OptimisticConcurrencyException
