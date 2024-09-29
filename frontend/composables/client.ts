/* eslint-disable @typescript-eslint/no-explicit-any */
import { flow, pipe, tuple } from "@effect-app/core/Function"
import {
  type ApiConfig,
  type FetchError,
  type ResError,
  type SupportedErrors,
} from "effect-app/client"
import { Failure, Success } from "effect-app/Operations"
import * as Sentry from "@sentry/browser"
import {
  useIntervalFn,
  type MaybeRefOrGetter,
  type Pausable,
  type UseIntervalFnOptions,
} from "@vueuse/core"
import { computed, type ComputedRef } from "vue"
import type { Either } from "effect-app"
import { Array, Effect, Match, Option, Cause, S } from "effect-app"
import { useToast } from "vue-toastification"
import { intl } from "./intl"

import { Result, useSafeMutation, type MutationResult } from "@effect-app/vue"
import type { HttpClient } from "effect-app/http"

export { useToast } from "vue-toastification"

export { clientFor } from "effect-app/client"
export {
  useSafeMutation,
  useSafeQuery,
  Result,
  type MutationResult,
} from "@effect-app/vue"

type ResErrors =
  | S.ParseResult.ParseError
  | SupportedErrors
  | FetchError
  | ResError

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

interface Opts<A> {
  suppressErrorToast?: boolean
  suppressSuccessToast?: boolean
  successToast?: (a: A) => any
}

/**
 * Pass a function that returns an Effect, e.g from a client action, give it a name, and optionally pass an onSuccess callback.
 * Returns a tuple with state ref and execution function which reports errors as Toast.
 */
export const useAndHandleMutation: {
  <I, E extends ResErrors, A>(
    self: {
      handler: (i: I) => Effect<A, E, ApiConfig | HttpClient.HttpClient.Service>
      name: string
    },
    action: string,
    options?: Opts<A>,
  ): Resp<I, E, A>
  <E extends ResErrors, A>(
    self: {
      handler: Effect<A, E, ApiConfig | HttpClient.HttpClient.Service>
      name: string
    },
    action: string,
    options?: Opts<A>,
  ): ActResp<E, A>
} = (self: any, action: any, options: any) => {
  const [a, b] = useSafeMutation({
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
    name: self.name,
  })

  return tuple(
    computed(() => mutationResultToVue(a.value)),
    handleRequestWithToast(b as any, action, options),
  )
}
export const useSafeMutationWithState = <I, E, A>(self: {
  handler: (i: I) => Effect<A, E, ApiConfig | HttpClient.HttpClient.Service>
  name: string
}) => {
  const [a, b] = useSafeMutation(self)

  return tuple(
    computed(() => mutationResultToVue(a.value)),
    b,
  )
}

export function makeUseAndHandleMutation(onSuccess: () => Promise<void>) {
  return ((self: any, action: any, options: any) => {
    return useAndHandleMutation(
      {
        handler: (typeof self.handler === "function"
          ? (i: any) =>
              Effect.tap(self.handler(i), () => Effect.promise(onSuccess))
          : Effect.tap(self.handler, () => Effect.promise(onSuccess))) as any,
        name: self.name,
      },
      action,
      options,
    )
  }) as {
    <I, E extends ResErrors, A>(
      self: {
        handler: (
          i: I,
        ) => Effect<A, E, ApiConfig | HttpClient.HttpClient.Service>
        name: string
      },
      action: string,
      options?: Opts<A>,
    ): Resp<I, E, A>
    <E extends ResErrors, A>(
      self: {
        handler: Effect<A, E, ApiConfig | HttpClient.HttpClient.Service>
        name: string
      },
      action: string,
      options?: Opts<A>,
    ): ActResp<E, A>
  }
}

export const withSuccess: {
  <I, E extends ResErrors, A, X>(
    self: {
      handler: (i: I) => Effect<A, E, ApiConfig | HttpClient.HttpClient.Service>
      name: string
    },
    onSuccess: (a: A, i: I) => Promise<X>,
  ): {
    handler: (i: I) => Effect<X, E, ApiConfig | HttpClient.HttpClient.Service>
    name: string
  }
  <E extends ResErrors, A, X>(
    self: {
      handler: Effect<A, E, ApiConfig | HttpClient.HttpClient.Service>
      name: string
    },
    onSuccess: (_: A) => Promise<X>,
  ): {
    handler: Effect<X, E, ApiConfig | HttpClient.HttpClient.Service>
    name: string
  }
} = (self: any, onSuccess: any): any => ({
  ...self,
  handler:
    typeof self.handler === "function"
      ? (i: any) =>
          pipe(
            (
              self.handler as (
                i: any,
              ) => Effect<any, any, ApiConfig | HttpClient.HttpClient.Service>
            )(i),
            Effect.flatMap(_ => Effect.promise(() => onSuccess(_, i))),
          )
      : Effect.flatMap(self.handler, _ => Effect.promise(() => onSuccess(_))),
})

export function withSuccessE<I, E extends ResErrors, A, E2, X>(
  self: {
    handler: (i: I) => Effect<A, E, ApiConfig | HttpClient.HttpClient.Service>
    name: string
  },
  onSuccessE: (_: A, i: I) => Effect<X, E2>,
) {
  return {
    ...self,
    handler: (i: any) =>
      pipe(
        self.handler(i),
        Effect.flatMap(_ => onSuccessE(_, i)),
      ),
  }
}

interface Res<A, E> {
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
  ComputedRef<Res<A, E>>,
  WithAction<(I: I) => Promise<void>>,
]

type ActResp<E, A> = readonly [
  ComputedRef<Res<A, E>>,
  WithAction<() => Promise<void>>,
]
function mutationResultToVue<A, E>(
  mutationResult: MutationResult<A, E>,
): Res<A, E> {
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

const messages: Record<string, string | undefined> = {}

/**
 * Pass a function that returns a Promise.
 * Returns an execution function which reports errors as Toast.
 */
export function handleRequestWithToast<
  E extends ResErrors,
  A,
  Args extends unknown[],
>(
  f: (...args: Args) => Promise<Either<A, E>>,
  action: string,
  options: Opts<A> = { suppressErrorToast: false },
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
                  toast.error(`${errorMessage}:\n` + renderError(r.left)),
              )
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                .then(_ => {
                  console.warn(r.left, r.left.toString())
                }),
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

export function renderError(e: ResErrors): string {
  return Match.value(e).pipe(
    Match.tags({
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
      ParseError: e => {
        console.warn(e.toString())
        return intl.value.formatMessage({ id: "validation.failed" })
      },
    }),
    Match.orElse(e =>
      intl.value.formatMessage(
        { id: "handle.unexpected_error" },
        {
          error: `${e.message ?? e._tag ?? e}`,
        },
      ),
    ),
  )
}

function parseError(e: string) {
  try {
    const js = JSON.parse(e) as any
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

function orPrevious<E, A>(result: Result.Result<A, E>) {
  return Result.isFailure(result) && Option.isSome(result.previousValue)
    ? Result.success(result.previousValue.value, result.waiting)
    : result
}

export function composeQueries<
  R extends Record<string, Result.Result<any, any>>,
>(
  results: R,
  renderPreviousOnFailure?: boolean,
): Result.Result<
  {
    [Property in keyof R]: R[Property] extends Result.Result<infer A, any>
      ? A
      : never
  },
  {
    [Property in keyof R]: R[Property] extends Result.Result<any, infer E>
      ? E
      : never
  }[keyof R]
> {
  const values = renderPreviousOnFailure
    ? Object.values(results).map(orPrevious)
    : Object.values(results)
  const error = values.find(Result.isFailure)
  if (error) {
    return error
  }
  const initial = Array.findFirst(values, x =>
    x._tag === "Initial" ? Option.some(x) : Option.none(),
  )
  if (initial.value !== undefined) {
    return initial.value
  }
  const loading = Array.findFirst(values, x =>
    Result.isInitial(x) && x.waiting ? Option.some(x) : Option.none(),
  )
  if (loading.value !== undefined) {
    return loading.value
  }

  const isRefreshing = values.some(x => x.waiting)

  const r = Object.entries(results).reduce((prev, [key, value]) => {
    prev[key] = Result.value(value).value
    return prev
  }, {} as any)
  return Result.success(r, isRefreshing)
}
