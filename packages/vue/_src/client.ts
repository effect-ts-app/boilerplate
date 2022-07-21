import type { ApiConfig } from "@effect-ts-app/boilerplate-client/config"
import { LiveApiConfig } from "@effect-ts-app/boilerplate-client/config"
import type { FetchResponse } from "@effect-ts-app/boilerplate-client/fetch"
import { Initial, Loading, queryResult, Refreshing } from "@effect-ts-app/boilerplate-client/QueryResult"
import type { QueryResult } from "@effect-ts-app/boilerplate-client/QueryResult"
import type { Http } from "@effect-ts-app/core/http/http-client"
import * as HF from "@effect-ts-app/core/http/http-client-fetch"
import { computed, shallowRef } from "vue"

export { isFailed, isSuccess } from "@effect-ts-app/boilerplate-client/QueryResult"

export function make<R, E, A>(self: Effect<R, E, FetchResponse<A>>) {
  const result = shallowRef(new Initial() as QueryResult<E, A>)

  const execute = Effect.succeedWith(() => {
    result.value = result.value._tag === "Initial" ||
        result.value._tag === "Loading"
      ? new Loading()
      : new Refreshing(result.value)
  })
    .zipRight(
      self.map(_ => _.body)
        >= queryResult
    )
    .flatMap(r => Effect.succeedWith(() => result.value = r))

  const latestResult = computed(() => {
    const value = result.value
    return value._tag === "Refreshing" || value._tag === "Done" ?
      value.current._tag === "Right"
        ? value.current.right
        : value.previous._tag === "Some"
        ? value.previous.value
        : undefined :
      undefined
  })

  return [result, latestResult, execute] as const
}

const Layers = HF.Client(fetch)["+++"](LiveApiConfig({ apiUrl: "/api" }))

export function makeRun<E, A>(self: Effect<Has<ApiConfig> & Has<Http>, E, FetchResponse<A>>) {
  const [result, latestResult, execute] = make(self)
  return [result, latestResult, () => run(execute)] as const
}

export function run<E, A>(self: Effect<Has<ApiConfig> & Has<Http>, E, A>) {
  return self.inject(Layers).runPromise()
}
