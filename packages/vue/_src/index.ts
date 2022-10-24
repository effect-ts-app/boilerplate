import type { Http } from "@effect-ts-app/core/http/http-client"
import * as HF from "@effect-ts-app/core/http/http-client-fetch"
import type { FetchResponse } from "@effect-ts-app/boilerplate-client/lib"
import { ApiConfig, Done, isInitializing, isSuccess } from "@effect-ts-app/boilerplate-client/lib"
import * as swrv from "swrv"
import type { fetcherFn, IKey, IResponse } from "swrv/dist/types.js"
// import type { default as useSWRVType } from "swrv"
import type { Ref } from "vue"
import { computed, ref, shallowRef, watch } from "vue"

export { isFailed, isInitializing, isSuccess } from "@effect-ts-app/boilerplate-client/lib"

declare function useSWRVType<Data = any, Error = any>(key: IKey): IResponse<Data, Error>
declare function useSWRVType<Data = any, Error = any>(
  key: IKey,
  fn?: fetcherFn<Data>,
  config?: swrv.IConfig
): IResponse<Data, Error>

// madness - workaround different import behavior on server and client
const useSWRV = (swrv.default.default ? swrv.default.default : swrv.default) as unknown as typeof useSWRVType

const Layers = HF.Client(fetch) + (ApiConfig.Live({
  apiUrl: "/api"
}))

function swrToQuery<E, A>(
  r: { error: E | undefined; data: A | undefined; isValidating: boolean }
): QueryResult<E, A> {
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

export function useSafeQuery<E, A>(key: string, self: Effect<ApiConfig | Http, E, FetchResponse<A>>) {
  // const [result, latestSuccess, execute] = make(self)

  // TODO: support with interruption
  // const sem = TSemaphore.unsafeMakeSemaphore(1)
  // const lock = TSemaphore.withPermit(sem)
  // let fib: Fiber.FiberContext<E, FetchResponse<A>> | undefined = undefined
  // const execute = self
  // const runNew = execute.fork()
  //   .tap(newFiber =>
  //     Effect.sync(() => {
  //       fib = newFiber
  //     })
  //   )

  // const ex = lock(
  //   Effect.suspend(() => {
  //     return fib
  //       ? Fiber.interrupt(fib).zipRight(runNew)
  //       : runNew
  //   })
  // ).flatMap(Fiber.await)
  //   .flatMap(Effect.done)

  // function execWithInterruption() {
  //   return ex.provideSomeLayer(Layers)
  //     .runPromise()
  //     .catch(err => {
  //       if (!Cause.isInterruptedException(err)) throw err
  //       return undefined
  //     })
  // }

  // const swr = useSWRV<A, E>(key, () => execWithInterruption().then(_ => _?.body as any)) // Effect.runPromise(self.provideSomeLayer(Layers))
  const swr = useSWRV<A, E>(key, () => run(self).then(_ => _.body))
  const result = computed(() =>
    swrToQuery({ data: swr.data.value, error: swr.error.value, isValidating: swr.isValidating.value })
  ) // ref<QueryResult<E, A>>()
  const latestSuccess = ref<A>()
  watch(result, _ => {
    if (isSuccess(_)) {
      latestSuccess.value = _.current.right
    }
  })

  return tuple(result, latestSuccess, () => swr.mutate(), swr)
}

export function useSafeQueryLegacy<E, A>(self: Effect<ApiConfig | Http, E, FetchResponse<A>>) {
  const [result, latestSuccess, execute] = make(self)

  const sem = TSemaphore.unsafeMake(1)
  const lock = sem.withPermit
  let fib: Fiber.Runtime<unknown, unknown> | undefined = undefined
  const runNew = execute.fork
    .tap(newFiber =>
      Effect.sync(() => {
        fib = newFiber
      })
    )

  const ex = lock(
    Effect.suspendSucceed(() => {
      return fib
        ? fib.interrupt.zipRight(runNew)
        : runNew
    })
  ).flatMap(_ => _.await)
    .flatMap(Effect.done)

  function exec() {
    return run(ex)
      .catch(err => {
        // TODO
        if (!JSON.stringify(err).includes("InterruptedException")) throw err
      })
  }

  return tuple(result, latestSuccess, exec)
}

export function make<R, E, A>(self: Effect<R, E, FetchResponse<A>>) {
  const result = shallowRef(new Initial() as QueryResult<E, A>)

  const execute = Effect.sync(() => {
    result.value = isInitializing(result.value)
      ? new Loading()
      : new Refreshing(result.value)
  })
    .zipRight(self.map(_ => _.body).asQueryResult)
    .flatMap(r => Effect.sync(() => result.value = r))

  const latestSuccess = computed(() => {
    const value = result.value
    return value._tag === "Refreshing" || value._tag === "Done" ?
      value.current._tag === "Right"
        ? value.current.right
        : value.previous._tag === "Some"
        ? value.previous.value
        : undefined :
      undefined
  })

  return tuple(result, latestSuccess, execute)
}

export function run<E, A>(self: Effect<ApiConfig | Http, E, A>) {
  return self.provideSomeLayer(Layers).unsafeRunPromise()
}

function handleExit<E, A>(
  loading: Ref<boolean>,
  error: Ref<E | undefined>,
  value: Ref<A | undefined>
) {
  return (exit: Exit<E, A>): Either<E, A> => {
    loading.value = false
    if (exit._tag === "Success") {
      value.value = exit.value
      error.value = undefined
      return Either.right(exit.value)
    }

    const err = exit.cause.failureMaybe
    if (err.isSome()) {
      error.value = err.value
      value.value = undefined
      return Either.left(err.value)
    }

    const died = exit.cause.dieMaybe
    if (died.value) {
      throw died.value
    }
    const interrupted = exit.cause.interruptMaybe
    if (interrupted.value) {
      throw new InterruptedException()
    }
    throw new Error("Invalid state")
  }
}

/**
 * Pass a function that returns an Effect, e.g from a client action.
 * Returns a tuple with state ref and execution function which reports errors as Toast.
 */
export function useMutation<I, E, A>(self: (i: I) => Effect<ApiConfig | Http, E, A>) {
  const loading = ref(false)
  const error = ref<E>()
  const value = ref<A>()
  const handle = handleExit(loading, error, value)
  const exec = (i: I) =>
    Effect.sync(() => {
      loading.value = true
      value.value = undefined
      error.value = undefined
    })
      .zipRight(self(i))
      .provideSomeLayer(Layers)
      .unsafeRunPromiseExit()
      .then(handle)

  const state = computed(() => ({ loading: loading.value, value: value.value, error: error.value }))

  return tuple(
    state,
    exec
  )
}

/**
 * Parameter-less variant of @see {@link useMutation}
 */
export function useAction<E, A>(self: Effect<ApiConfig | Http, E, A>) {
  const loading = ref(false)
  const error = ref<E>()
  const value = ref<A>()

  const handle = handleExit(loading, error, value)

  const exec = () => {
    loading.value = true
    return self.provideSomeLayer(Layers)
      .unsafeRunPromiseExit()
      .then(handle)
  }
  const state = computed(() => ({ loading: loading.value, value: value.value, error: error.value }))
  return tuple(
    state,
    exec
  )
}
