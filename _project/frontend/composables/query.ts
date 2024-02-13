import { useQuery } from "@tanstack/vue-query"
import { Effect, Runtime } from "effect-app"
import { Refreshing, Done, Loading, Initial } from "effect-app/client"
import type {
  SupportedErrors,
  ResponseError,
  ApiConfig,
  FetchResponse,
  FetchError,
  QueryResult,
} from "effect-app/client"
import type { HttpClient } from "~/utils/prelude"

export const useSafeQuery = <I, A>(
  q:
    | {
        handler: (
          req: I,
        ) => Effect<
          FetchResponse<A>,
          SupportedErrors | ResponseError | FetchError,
          ApiConfig | HttpClient.Client.Default
        >
        mapPath: (req: I) => string
      }
    | {
        handler: Effect<
          FetchResponse<A>,
          SupportedErrors | ResponseError | FetchError,
          ApiConfig | HttpClient.Client.Default
        >
        mapPath: string
      },
  arg?: I | WatchSource<I>,
) => {
  const arr = arg
  const req: { value: Arg } = !arg
    ? undefined
    : typeof arr === "function"
      ? ({
          get value() {
            return (arr as any)()
          },
        } as any)
      : ref(arg)
  const r = useQuery(
    Effect.isEffect(q.handler)
      ? {
          queryKey: [computed(() => q.mapPath)],
          queryFn: () =>
            q.handler.runPromise
              .then(_ => _.body)
              .catch(_ => {
                if (!Runtime.isFiberFailure(_)) throw _
                const cause = _[Runtime.FiberFailureCauseId]
                throw Cause.squash(cause)
              }),
        }
      : {
          queryKey: [computed(() => q.mapPath(req.value))],
          queryFn: () =>
            q
              .handler(req.value)
              .runPromise.then(_ => _.body)
              .catch(_ => {
                if (!Runtime.isFiberFailure(_)) throw _
                const cause = _[Runtime.FiberFailureCauseId]
                throw Cause.squash(cause)
              }),
        },
  )

  function swrToQuery<E, A>(r: {
    error: E | undefined
    data: A | undefined
    isValidating: boolean
  }): QueryResult<E, A> {
    if (r.error) {
      return r.isValidating
        ? Refreshing.fail<E, A>(r.error, r.data)
        : Done.fail<E, A>(r.error, r.data)
    }
    if (r.data !== undefined) {
      return r.isValidating
        ? Refreshing.succeed<A, E>(r.data)
        : Done.succeed<A, E>(r.data)
    }

    return r.isValidating ? new Loading() : new Initial()
  }

  const result = computed(() =>
    swrToQuery({
      error: r.error.value,
      data: r.data.value,
      isValidating: r.isFetching.value,
    }),
  )
  const latestSuccess = computed(() => {
    const value = result.value
    return value.isSuccess()
      ? value.current.isRight()
        ? value.current.right
        : value.previous.isSome()
          ? value.previous.value
          : undefined
      : undefined
  })
  return [result, latestSuccess, r.refetch] as const
}
