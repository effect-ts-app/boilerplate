import { ref } from "vue";
import { Effect, Has } from "@effect-ts-app/boilerplate-prelude";
import { pipe } from "@effect-ts-app/boilerplate-prelude/Function";
import { ApiConfig, LiveApiConfig } from "@effect-ts-app/boilerplate-client/config";
import * as HF from "@effect-ts-app/core/http/http-client-fetch";
import type { FetchResponse } from "@effect-ts-app/boilerplate-client/fetch";
import type { Http } from "@effect-ts-app/core/http/http-client";

export function make<R, E, A>(self: Effect<R, E, FetchResponse<A>>) {
  const data = ref<A>();
  const loading = ref(true);
  const error = ref<E>();

  const execute = pipe(
    self,
    Effect.map((_) => _.body),
    Effect.flatMap((_) =>
      Effect.succeedWith(() => {
        data.value = _;
        error.value = undefined;
        loading.value = false;
      })
    ),
    Effect.catchAll((_) => Effect.succeedWith(() => { error.value = _; loading.value = false }))
  );

  // TODO: nicer is tagged union where: Initial, Loading, Success, Failure, Refreshing etc.
  return {
    execute,
    data,
    loading,
    error,
  };
}

const Layers = HF.Client(fetch)["+++"](LiveApiConfig({ apiUrl: "/api" }))

export function make2<E, A>(self: Effect<Has<ApiConfig> & Has<Http>, E, FetchResponse<A>>) {
  const { execute, ...rest } = make(self)
  return {
    execute: () => run(execute),
    ...rest,
  }
}

export function run<E, A>(self: Effect<Has<ApiConfig> & Has<Http>, E, A>) {
  return pipe(
    self,
    Effect.provideLayer(Layers),
    Effect.runPromise
  )
}