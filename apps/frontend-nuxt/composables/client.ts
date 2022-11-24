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
} from "@effect-ts-app/boilerplate-prelude/client"
import { flow, pipe, tuple } from "@effect-ts-app/boilerplate-prelude/Function"
import { useAction, useMutation } from "@effect-ts-app/boilerplate-vue"
import type { Http } from "@effect-ts-app/core/http/http-client"
import { InterruptedException } from "@effect/core/io/Cause"
import type { ComputedRef } from "nuxt/dist/app/compat/capi"
import { useToast } from "vue-toastification"
import type { Either } from "./prelude"

import { Effect } from "./prelude"

export { clientFor, isFailed, isInitializing, isRefreshing, isSuccess } from "@effect-ts-app/boilerplate-prelude/client"
export { run, useAction, useMutation, useSafeQuery } from "@effect-ts-app/boilerplate-vue"

/**
 * Pass a function that returns an Effect, e.g from a client action, give it a name, and optionally pass an onSuccess callback.
 * Returns a tuple with state ref and execution function which reports errors as Toast.
 */
export function useAndHandleMutation<I, E extends ResponseError | FetchError, A, X>(
  self: (i: I) => Effect.Effect<ApiConfig | Http, E, A>,
  action: string,
  onSuccess: (_: A) => Promise<X>
): Resp<I, E, X>
export function useAndHandleMutation<I, E extends ResponseError | FetchError, A>(
  self: (i: I) => Effect.Effect<ApiConfig | Http, E, A>,
  action: string
): Resp<I, E, A>
export function useAndHandleMutation<I, E extends ResponseError | FetchError, A, X>(
  self: (i: I) => Effect.Effect<ApiConfig | Http, E, A>,
  action: string,
  onSuccess?: (_: A) => Promise<X>
) {
  const eff = onSuccess ?
    (i: I) =>
      pipe(
        self(i),
        Effect.flatMap(_ => Effect.promise(() => onSuccess(_)))
      ) :
    self
  const [a, b] = useMutation(eff as (i: I) => Effect.Effect<ApiConfig | Http, E, X | A>)

  return tuple(a, handleRequest(b, action))
}

interface Res<E, A> {
  loading: boolean
  value: A | undefined
  error: E | undefined
}

type Resp<I, E, A> = readonly [
  ComputedRef<Res<E, A>>,
  (I: I) => Promise<void>
]

type ActResp<E, A> = readonly [
  ComputedRef<Res<E, A>>,
  () => Promise<void>
]

/**
 * Pass an Effect, e.g from a client action, give it a name, and optionally pass an onSuccess callback.
 * Returns a tuple with state ref and execution function which reports errors as Toast.
 */
export function useAndHandleAction<E extends ResponseError | FetchError, A>(
  self: Effect.Effect<ApiConfig | Http, E, A>,
  action: string
): ActResp<E, A>
export function useAndHandleAction<E extends ResponseError | FetchError, A, X>(
  self: Effect.Effect<ApiConfig | Http, E, A>,
  action: string,
  onSuccess: (a: A) => Promise<X>
): ActResp<E, X>
export function useAndHandleAction<E extends ResponseError | FetchError, A, X>(
  self: Effect.Effect<ApiConfig | Http, E, A>,
  action: string,
  onSuccess?: (a: A) => Promise<X>
) {
  const eff = onSuccess ? pipe(self, Effect.flatMap(_ => Effect.promise(() => onSuccess(_)))) : self
  const [a, b] = useAction(eff)

  return tuple(a, handleRequest(b, action))
}

/**
 * Pass a function that returns a Promise.
 * Returns an execution function which reports errors as Toast.
 */
export function handleRequest<E extends ResponseError | FetchError, A, Args extends unknown[]>(
  f: (...args: Args) => Promise<Either.Either<E, A>>,
  action: string
) {
  const toast = useToast()
  return flow(f, p =>
    p.then(r =>
      r._tag === "Right"
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        ? Promise.resolve(void 0 as void)
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
    const js = JSON.parse(e) as any
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
