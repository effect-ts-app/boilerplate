/* eslint-disable @typescript-eslint/no-explicit-any */
import { flow, pipe, tuple } from "@effect-app/prelude/Function"
import type {
  ApiConfig,
  FetchError,
  ResponseError,
  SupportedErrors,
} from "@effect-app/prelude/client"
import type { MutationResult } from "@effect-app/vue"
import { useMutation } from "@effect-app/vue"
import { Failure, Success } from "@effect-app-boilerplate/resources/Views"
import * as Sentry from "@sentry/browser"
import {
  useIntervalFn,
  type MaybeRefOrGetter,
  type Pausable,
  type UseIntervalFnOptions,
} from "@vueuse/core"
import type { ComputedRef } from "vue"
import type { Either, HttpClient } from "@/utils/prelude"
import { Effect, Matcher } from "@/utils/prelude"
import { Cause } from "effect"
import { useToast } from "vue-toastification"
import { intl } from "./intl"

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
  useSafeQuery_,
} from "@effect-app/vue"
export {
  refreshAndWaitAForOperation,
  refreshAndWaitAForOperationP,
  refreshAndWaitForOperation,
  refreshAndWaitForOperationP,
} from "@effect-app-boilerplate/resources/lib"

type ResponseErrors = SupportedErrors | FetchError | ResponseError

export function pauseWhileProcessing(
  iv: Pausable,
  pmf: () => Promise<unknown>,
) {
  return Promise.resolve(iv.pause())
    .then(() => pmf())
    .finally(() => iv.resume())
}

export function useIntervalPauseWhileProcessing(
  pmf: () => Promise<unknown>,
  interval?: MaybeRefOrGetter<number> | undefined,
  options?: Omit<UseIntervalFnOptions, "immediateCallback"> | undefined,
) {
  const iv = useIntervalFn(
    () => pauseWhileProcessing(iv, pmf),
    interval,
    options ? { ...options, immediateCallback: false } : options,
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
  <I, E extends ResponseErrors, A>(
    self: {
      handler: (
        i: I,
      ) => Effect.Effect<ApiConfig | HttpClient.Client.Default, E, A>
    },
    action: string,
    options?: { suppressErrorToast?: boolean },
  ): Resp<I, E, A>
  <E extends ResponseErrors, A>(
    self: {
      handler: Effect.Effect<ApiConfig | HttpClient.Client.Default, E, A>
    },
    action: string,
    options?: { suppressErrorToast?: boolean },
  ): ActResp<E, A>
} = (self: any, action: any, options: any) => {
  const [a, b] = useMutation({
    handler: Effect.isEffect(self.handler)
      ? (pipe(
          self.handler,
          Effect.withSpan("mutation", { attributes: { action } }),
        ) as any)
      : (...args: any[]) =>
          pipe(
            self.handler(...args),
            Effect.withSpan("mutation", { attributes: { action } }),
          ),
  })

  return tuple(
    computed(() => mutationResultToVue(a.value)),
    handleRequestWithToast(b as any, action, options),
  )
}
export const useMutationWithState = <I, E, A>(self: {
  handler: (i: I) => Effect.Effect<ApiConfig | HttpClient.Client.Default, E, A>
}) => {
  const [a, b] = useMutation(self)

  return tuple(
    computed(() => mutationResultToVue(a.value)),
    b,
  )
}

export function makeUseAndHandleMutation(onSuccess: () => Promise<void>) {
  return ((self: any, action: any, options: any) => {
    return useAndHandleMutation(
      {
        handler: (typeof self === "function"
          ? (i: any) => Effect.tap(self(i), () => Effect.promise(onSuccess))
          : Effect.tap(self, () => Effect.promise(onSuccess))) as any,
      },
      action,
      options,
    )
  }) as {
    <I, E extends ResponseErrors, A>(
      self: (
        i: I,
      ) => Effect.Effect<ApiConfig | HttpClient.Client.Default, E, A>,
      action: string,
      options?: { suppressErrorToast?: boolean },
    ): Resp<I, E, A>
    <E extends ResponseErrors, A>(
      self: Effect.Effect<ApiConfig | HttpClient.Client.Default, E, A>,
      action: string,
      options?: { suppressErrorToast?: boolean },
    ): ActResp<E, A>
  }
}

export const withSuccess: {
  <I, E extends ResponseErrors, A, X>(
    self: {
      handler: (
        i: I,
      ) => Effect.Effect<ApiConfig | HttpClient.Client.Default, E, A>
    },
    onSuccess: (_: A) => Promise<X>,
  ): {
    handler: (
      i: I,
    ) => Effect.Effect<ApiConfig | HttpClient.Client.Default, E, X>
  }
  <E extends ResponseErrors, A, X>(
    self: {
      handler: Effect.Effect<ApiConfig | HttpClient.Client.Default, E, A>
    },
    onSuccess: (_: A) => Promise<X>,
  ): { handler: Effect.Effect<ApiConfig | HttpClient.Client.Default, E, X> }
} = (self: any, onSuccess: any): any => ({
  ...self,
  handler:
    typeof self.handler === "function"
      ? flow(
          self.handler as (
            i: any,
          ) => Effect.Effect<ApiConfig | HttpClient.Client.Default, any, any>,
          Effect.flatMap(_ => Effect.promise(() => onSuccess(_))),
        )
      : Effect.flatMap(self.handler, _ => Effect.promise(() => onSuccess(_))),
})

export function withSuccessE<I, E extends ResponseErrors, A, E2, X>(
  self: {
    handler: (
      i: I,
    ) => Effect.Effect<ApiConfig | HttpClient.Client.Default, E, A>
  },
  onSuccessE: (_: A) => Effect.Effect<never, E2, X>,
) {
  return {
    ...self,
    handler: flow(
      self.handler,
      Effect.flatMap(_ => onSuccessE(_)),
    ),
  }
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
  WithAction<(I: I) => Promise<void>>,
]

type ActResp<E, A> = readonly [
  ComputedRef<Res<E, A>>,
  WithAction<() => Promise<void>>,
]

function mutationResultToVue<E, A>(
  mutationResult: MutationResult<E, A>,
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
  E extends ResponseErrors,
  A,
  Args extends unknown[],
>(
  f: (...args: Args) => Promise<Either.Either<E, A>>,
  action: string,
  options: { suppressErrorToast?: boolean } = { suppressErrorToast: false },
) {
  const toast = useToast()
  const message = messages[action] ?? action
  const warnMessage = intl.value.formatMessage(
    { id: "handle.with_warnings" },
    { action: message },
  )
  const successMessage = intl.value.formatMessage(
    { id: "handle.success" },
    { action: message },
  )
  const errorMessage = intl.value.formatMessage(
    { id: "handle.with_errors" },
    { action: message },
  )
  return Object.assign(
    flow(f, p =>
      p.then(
        r =>
          r._tag === "Right"
            ? S.is(Failure)(r.right)
              ? Promise.resolve(
                  toast.warning(
                    warnMessage + r.right.message ? "\n" + r.right.message : "",
                  ),
                ).then(
                  // eslint-disable-next-line @typescript-eslint/no-empty-function
                  _ => {},
                )
              : Promise.resolve(
                  toast.success(
                    successMessage +
                      (S.is(Success)(r.right) && r.right.message
                        ? "\n" + r.right.message
                        : ""),
                  ),
                ).then(
                  // eslint-disable-next-line @typescript-eslint/no-empty-function
                  _ => {},
                )
            : Promise.resolve(
                !options.suppressErrorToast &&
                  toast.error(
                    `${errorMessage}:\n` + renderError(r.left, message),
                  ),
              )
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                .then(_ => {}),
        err => {
          if (Cause.isInterruptedException(err)) {
            return
          }
          const extra = {
            action,
            message: `Unexpected Error trying to ${action}`,
          }
          Sentry.captureException(err, {
            extra,
          })
          console.error(err, extra)

          toast.error(
            intl.value.formatMessage(
              { id: "handle.unexpected_error" },
              {
                action: message,
                error: JSON.stringify(err, undefined, 2),
              },
            ),
          )

          return
        },
      ),
    ),
    { action },
  )
}

export function renderError(e: ResponseErrors, action: string): string {
  return Matcher.value(e).pipe(
    Matcher.tags({
      HttpErrorRequest: e =>
        intl.value.formatMessage(
          { id: "handle.request_error" },
          { error: `${e.error}` },
        ),
      HttpErrorResponse: e =>
        e.response.status >= 500 ||
        e.response.body._tag !== "Some" ||
        !e.response.body.value
          ? intl.value.formatMessage(
              { id: "handle.error_response" },
              {
                error: `${
                  e.response.body._tag === "Some" && e.response.body.value
                    ? parseError(e.response.body.value)
                    : "Unknown"
                } (${e.response.status})`,
              },
            )
          : intl.value.formatMessage(
              { id: "handle.unexpected_error" },
              {
                action,
                error:
                  JSON.stringify(e.response.body, undefined, 2) +
                  "( " +
                  e.response.status +
                  ")",
              },
            ),
      ResponseError: e =>
        intl.value.formatMessage(
          { id: "handle.response_error" },
          { error: `${e.error}` },
        ),
    }),
    Matcher.orElse(e =>
      intl.value.formatMessage(
        { id: "handle.unexpected_error" },
        {
          action,
          error: `${e.message ?? e._tag}`,
        },
      ),
    ),
  )
}

function parseError(e: string) {
  try {
    const js = JSON.parse(e)
    if ("_tag" in js) {
      if ("message" in js) {
        return `${js.message || js._tag}`
      }
      return js._tag
    }
    if ("message" in js) {
      return js.message
    }
    return "Unknown"
  } catch {
    return "There was an error trying to parse the error response"
  }
}
