import type {
  ApiConfig,
  FetchError,
  InvalidStateError,
  NotFoundError,
  NotLoggedInError,
  OptimisticConcurrencyException,
  ResponseError,
  UnauthorizedError,
  ValidationError,
} from "@effect-app/prelude/client"
import { flow, pipe, tuple } from "@effect-app/prelude/Function"
import { useAction, useMutation } from "@effect-app/vue"
import type { Http } from "@effect-app/core/http/http-client"
import { InterruptedException } from "@effect/io/Cause"
import type { ComputedRef } from "nuxt/dist/app/compat/capi"
import { useToast } from "vue-toastification"
import type { Either } from "./prelude"
import { Effect } from "./prelude"
import type {
  MaybeRefOrGetter,
  Pausable,
  UseIntervalFnOptions,
} from "@vueuse/core"
import { Failure, Success } from "@effect-app-boilerplate/resources/Views"

export { useToast } from "vue-toastification"

export {
  clientFor,
  isFailed,
  isInitializing,
  isRefreshing,
  isSuccess,
} from "@effect-app/prelude/client"
export {
  useAction,
  useMutate,
  useMutation,
  useSafeQuery,
  useSafeQuery_,
  useSafeQueryWithArg,
  useSafeQueryWithArg_,
} from "@effect-app/vue"
export {
  refreshAndWaitAForOperation,
  refreshAndWaitAForOperationP,
  refreshAndWaitForOperation,
  refreshAndWaitForOperationP,
} from "@effect-app-boilerplate/resources/lib"

export function pauseWhileProcessing(
  iv: Pausable,
  pmf: () => Promise<unknown>
) {
  return Promise.resolve(iv.pause())
    .then(() => pmf())
    .finally(() => iv.resume())
}

export function useIntervalPauseWhileProcessing(
  pmf: () => Promise<unknown>,
  interval?: MaybeRefOrGetter<number> | undefined,
  options?: Omit<UseIntervalFnOptions, "immediateCallback"> | undefined
) {
  const iv = useIntervalFn(
    () => pauseWhileProcessing(iv, pmf),
    interval,
    options ? { ...options, immediateCallback: false } : options
  )
  return {
    isActive: iv.isActive,
  }
}

export const alert = (typeof window !== "undefined"
  ? window.alert
  : undefined) as any as ((message?: any) => void) & ((message?: any) => void)
export const confirm = (typeof window !== "undefined"
  ? window.confirm
  : undefined) as any as (message?: string | undefined) => boolean

/**
 * Pass a function that returns an Effect, e.g from a client action, give it a name, and optionally pass an onSuccess callback.
 * Returns a tuple with state ref and execution function which reports errors as Toast.
 */
export function useAndHandleMutation<
  I,
  E extends ResponseError | FetchError,
  A,
  X
>(
  self: (i: I) => Effect.Effect<ApiConfig | Http, E, A>,
  action: string,
  onSuccess: (_: A) => Promise<X>
): Resp<I, E, X>
export function useAndHandleMutation<
  I,
  E extends ResponseError | FetchError,
  A
>(
  self: (i: I) => Effect.Effect<ApiConfig | Http, E, A>,
  action: string
): Resp<I, E, A>
export function useAndHandleMutation<
  I,
  E extends ResponseError | FetchError,
  A,
  X
>(
  self: (i: I) => Effect.Effect<ApiConfig | Http, E, A>,
  action: string,
  onSuccess?: (_: A) => Promise<X>
) {
  const eff = onSuccess
    ? (i: I) =>
        pipe(
          self(i),
          Effect.flatMap(_ => Effect.promise(() => onSuccess(_)))
        )
    : self
  const [a, b] = useMutation(
    eff as (i: I) => Effect.Effect<ApiConfig | Http, E, X | A>
  )

  return tuple(a, handleRequest(b, action))
}

interface Res<E, A> {
  loading: boolean
  value: A | undefined
  error: E | undefined
}

type WithAction<A> = A & {
  action: string
}

type Resp<I, E, A> = readonly [
  ComputedRef<Res<E, A>>,
  WithAction<(I: I) => Promise<void>>
]

type ActResp<E, A> = readonly [
  ComputedRef<Res<E, A>>,
  WithAction<() => Promise<void>>
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
  if (onSuccess) {
    const eff = pipe(
      self,
      Effect.flatMap(_ => Effect.promise(() => onSuccess(_)))
    )
    const [a, b] = useAction(eff)
    return tuple(a, handleRequest(b, action))
  }

  const [a, b] = useAction(self)
  return tuple(a, handleRequest(b, action))
}

const messages: Record<string, string | undefined> = {
  Drucken: "An Drucker geschickt",
  "Problem melden": "Problem gemeldet",
}

/**
 * Pass a function that returns a Promise.
 * Returns an execution function which reports errors as Toast.
 */
export function handleRequest<
  E extends ResponseError | FetchError,
  A,
  Args extends unknown[]
>(f: (...args: Args) => Promise<Either.Either<E, A>>, action: string) {
  const toast = useToast()
  const message = messages[action] ?? action
  const warnMessage = message + ", mit Warnungen"
  const successMessage = messages[action] ?? action + " Success"
  const errorMessage = action + " Fehlgeschlagen"
  return Object.assign(
    flow(f, p =>
      p.then(
        r =>
          r._tag === "Right"
            ? Failure.Guard(r.right)
              ? Promise.resolve(
                  toast.warning(
                    warnMessage + r.right.message ? "\n" + r.right.message : ""
                  )
                ).then(
                  // eslint-disable-next-line @typescript-eslint/no-empty-function
                  _ => {}
                )
              : Promise.resolve(
                  toast.success(
                    successMessage +
                      (Success.Guard(r.right) && r.right.message
                        ? "\n" + r.right.message
                        : "")
                  )
                ).then(
                  // eslint-disable-next-line @typescript-eslint/no-empty-function
                  _ => {}
                )
            : Promise.resolve(
                toast.error(`${errorMessage}: ` + renderError(r.left))
              )
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                .then(_ => {}),
        err => {
          if (err instanceof InterruptedException) {
            return
          }
          // TODO: Report?
          console.error(`Unexpected Error trying to ${action}`, err)
          toast.error(
            `Unexpected Error trying to ${action}: ` +
              JSON.stringify(err, undefined, 2)
          )
        }
      )
    ),
    { action }
  )
}

// TODO: Treat HttpErrorRequest and ResponseError as Exception
// and treat HttpErrorResponse with a SupportedErrrors body, as a user useful error.
export function renderError(e: ResponseError | FetchError) {
  if (e._tag === "HttpErrorRequest") {
    return `There was an error in the request: ${e.error}`
  }
  if (e._tag === "HttpErrorResponse") {
    return `There was an error in processing the response: \n${
      e.response.body._tag === "Some" && e.response.body.value
        ? parseError(e.response.body.value)
        : ""
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
