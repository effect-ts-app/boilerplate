import { type Http } from "@effect-app/core/http/http-client"
import { flow, tuple } from "@effect-app/prelude/Function"
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
import type { MutationResult } from "@effect-app/vue"
import { useMutation } from "@effect-app/vue"
import { InterruptedException } from "@effect/io/Cause"
import { Failure, Success } from "@effect-app-boilerplate/resources/Views"
import type {
  MaybeRefOrGetter,
  Pausable,
  UseIntervalFnOptions,
} from "@vueuse/core"
import type { Either } from "./prelude"
import { Effect } from "./prelude"

import { useToast } from "vue-toastification"

export { useToast } from "vue-toastification"

export {
  clientFor,
  isFailed,
  isInitializing,
  isRefreshing,
  isSuccess,
} from "@effect-app/prelude/client"
export {
  useMutate,
  useMutation,
  useSafeQuery,
  useSafeQueryWithArg,
  useSafeQueryWithArg_,
  useSafeQuery_,
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
export const useAndHandleMutation: {
  <I, E extends ResponseError | FetchError, A>(
    self: (i: I) => Effect.Effect<ApiConfig | Http, E, A>,
    action: string,
    options?: { suppressErrorToast?: boolean }
  ): Resp<I, E, A>
  <E extends ResponseError | FetchError, A>(
    self: Effect.Effect<ApiConfig | Http, E, A>,
    action: string,
    options?: { suppressErrorToast?: boolean }
  ): ActResp<E, A>
} = (self: any, action: any, options: any) => {
  const [a, b] = useMutation(self)

  return tuple(
    computed(() => mutationResultToVue(a.value)),
    handleRequestWithToast(b as any, action, options)
  )
}

export function makeUseAndHandleMutation(onSuccess: () => Promise<void>) {
  return ((self: any, action: any, options: any) => {
    return useAndHandleMutation(
      (typeof self === "function"
        ? (i: any) => Effect.tap(self(i), () => Effect.promise(onSuccess))
        : Effect.tap(self, () => Effect.promise(onSuccess))) as any,
      action,
      options
    )
  }) as {
    <I, E extends ResponseError | FetchError, A>(
      self: (i: I) => Effect.Effect<ApiConfig | Http, E, A>,
      action: string,
      options?: { suppressErrorToast?: boolean }
    ): Resp<I, E, A>
    <E extends ResponseError | FetchError, A>(
      self: Effect.Effect<ApiConfig | Http, E, A>,
      action: string,
      options?: { suppressErrorToast?: boolean }
    ): ActResp<E, A>
  }
}

export const withSuccess: {
  <I, E extends ResponseError | FetchError, A, X>(
    self: (i: I) => Effect.Effect<ApiConfig | Http, E, A>,
    onSuccess: (_: A) => Promise<X>
  ): (i: I) => Effect.Effect<ApiConfig | Http, E, X>
  <E extends ResponseError | FetchError, A, X>(
    self: Effect.Effect<ApiConfig | Http, E, A>,
    onSuccess: (_: A) => Promise<X>
  ): Effect.Effect<ApiConfig | Http, E, X>
} = (self: any, onSuccess: any): any =>
  typeof self === "function"
    ? flow(
        self as (i: any) => Effect.Effect<ApiConfig | Http, any, any>,
        Effect.flatMap(_ => Effect.promise(() => onSuccess(_)))
      )
    : Effect.flatMap(self, _ => Effect.promise(() => onSuccess(_)))

export function withSuccessE<I, E extends ResponseError | FetchError, A, E2, X>(
  self: (i: I) => Effect.Effect<ApiConfig | Http, E, A>,
  onSuccessE: (_: A) => Effect.Effect<never, E2, X>
) {
  return flow(
    self,
    Effect.flatMap(_ => onSuccessE(_))
  )
}

interface Res<E, A> {
  readonly loading: boolean
  readonly data: A | undefined
  readonly error: E | undefined
}

type WithAction<A> = A & {
  action: string
}

// computed() takes a getter function and returns a readonly reactive ref
// object for the returned value from the getter.
type Resp<I, E, A> = readonly [
  ComputedRef<Res<E, A>>,
  WithAction<(I: I) => Promise<void>>
]

type ActResp<E, A> = readonly [
  ComputedRef<Res<E, A>>,
  WithAction<() => Promise<void>>
]

function mutationResultToVue<E, A>(
  mutationResult: MutationResult<E, A>
): Res<E, A> {
  switch (mutationResult._tag) {
    case "Loading": {
      return { loading: true, data: undefined, error: undefined }
    }
    case "Success": {
      return {
        loading: false,
        data: mutationResult.data,
        error: undefined,
      }
    }
    case "Error": {
      return {
        loading: false,
        data: undefined,
        error: mutationResult.error,
      }
    }
    case "Initial": {
      return { loading: false, data: undefined, error: undefined }
    }
  }
}

const messages: Record<string, string | undefined> = {
  Drucken: "An Drucker geschickt",
  "Problem melden": "Problem gemeldet",
}

/**
 * Pass a function that returns a Promise.
 * Returns an execution function which reports errors as Toast.
 */
export function handleRequestWithToast<
  E extends ResponseError | FetchError,
  A,
  Args extends unknown[]
>(
  f: (...args: Args) => Promise<Either.Either<E, A>>,
  action: string,
  options: { suppressErrorToast?: boolean } = { suppressErrorToast: false }
) {
  const toast = useToast()
  const message = messages[action] ?? action
  const warnMessage = intl.value.formatMessage(
    { id: "handle.with_warnings" },
    { action: message }
  )
  const successMessage = intl.value.formatMessage(
    { id: "handle.success" },
    { action: message }
  )
  const errorMessage = intl.value.formatMessage(
    { id: "handle.with_errors" },
    { action: message }
  )
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
                !options.suppressErrorToast &&
                  toast.error(`${errorMessage}:\n` + renderError(r.left))
              )
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                .then(_ => {}),
        err => {
          if (err instanceof InterruptedException) {
            return
          }
          // Sentry.captureException(err, {
          //   extra: {
          //     action,
          //     message: `Unexpected Error trying to ${action}`,
          //   },
          // })

          toast.error(
            intl.value.formatMessage(
              { id: "handle.unexpected_error" },
              {
                action: message,
                error: JSON.stringify(err, undefined, 2),
              }
            )
          )

          return
        }
      )
    ),
    { action }
  )
}

// TODO: Treat HttpErrorRequest and ResponseError as Exception
// and treat HttpErrorResponse with a SupportedErrrors body, as a user useful error.
export function renderError(e: ResponseError | FetchError): string {
  if (e._tag === "HttpErrorRequest") {
    return intl.value.formatMessage(
      { id: "handle.request_error" },
      { error: `${e.error}` }
    )
  } else if (e._tag === "HttpErrorResponse") {
    return e.response.status >= 500 ||
      e.response.body._tag !== "Some" ||
      !e.response.body.value
      ? intl.value.formatMessage(
          { id: "handle.error_response" },
          {
            error: `${
              e.response.body._tag === "Some" && e.response.body.value
                ? parseError(e.response.body.value)
                : ""
            } (${e.response.status})`,
          }
        )
      : parseError(e.response.body.value)
  } else if (e._tag === "ResponseError") {
    return intl.value.formatMessage(
      { id: "handle.response_error" },
      { error: `${e.error}` }
    )
  } else {
    return intl.value.formatMessage(
      { id: "handle.unexpected_error" },
      {
        // TODO: we need a string representing the action for better DX debugging
        action: "unknown action",
        error: JSON.stringify(e, undefined, 2),
      }
    )
  }
}

function parseError(e: string) {
  try {
    const js = JSON.parse(e)
    if ("_tag" in js) {
      if ("message" in js) {
        return `${js.message || js._tag}`
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
