/* eslint-disable @typescript-eslint/no-explicit-any */
import { makeApiLayers, initializeSync } from "@effect-app/vue"
import * as Layer from "effect/Layer"
import * as Runtime from "effect/Runtime"
import { Effect, Option } from "effect-app"
import { WebSdkLive } from "~/utils/observability"
import type { ApiConfig } from "effect-app/client"
import "@effect-app/core/builtin"
import { ref } from "vue"
import { HttpClient } from "effect-app/http"

export const versionMatch = ref(true)

export const runtime = shallowRef<ReturnType<typeof makeRuntime>>()

function makeRuntime(feVersion: string, disableTracing: boolean) {
  const apiLayers = Layer.mergeAll(
    Layer.provideMerge(
      Layer.effect(
        HttpClient.HttpClient,
        Effect.map(
          HttpClient.HttpClient,
          HttpClient.tap(r =>
            Effect.sync(() => {
              const remoteFeVersion = r.headers["x-fe-version"]
              if (remoteFeVersion) {
                versionMatch.value = feVersion === remoteFeVersion
              }
            }),
          ),
        ),
      ),
      makeApiLayers({ apiUrl: "/api/api", headers: Option.none() }),
    ),
  )

  const rt: {
    runtime: Runtime.Runtime<RT>
    clean: () => void
  } = initializeSync(
    // TODO: tracing when deployed
    disableTracing
      ? apiLayers
      : apiLayers.pipe(
          Layer.merge(
            WebSdkLive({
              serviceName: "effect-app-boilerplate-frontend",
              serviceVersion: feVersion,
              attributes: {},
            }),
          ),
        ),
  )
  return {
    ...rt,
    runFork: Runtime.runFork(rt.runtime),
    runSync: Runtime.runSync(rt.runtime),
    runPromise: Runtime.runPromise(rt.runtime),
    runCallback: Runtime.runCallback(rt.runtime),
  }
}

// TODO: make sure the runtime provides these
export type RT = ApiConfig | HttpClient.HttpClient

export default defineNuxtPlugin(nuxtApp => {
  const config = useRuntimeConfig()

  const rt = makeRuntime(
    config.public.feVersion,
    config.public.env !== "local-dev" || !config.public.telemetry,
  )
  nuxtApp.vueApp.config.globalProperties.$run = rt.runFork
  ;(nuxtApp.vueApp.config.globalProperties as any).$runIfEffect = (a: any) => {
    console.log("run if effect", a)
    return a && Effect.isEffect(a) ? rt.runFork(a as any) : a
  }
  runtime.value = rt
})

export const runFork = <A, E>(
  self: Effect.Effect<A, E, RT>,
  options?: Runtime.RunForkOptions,
) => runtime.value!.runFork(self, options)
export const runPromise = <A, E>(
  effect: Effect.Effect<A, E, RT>,
  options?:
    | {
        readonly signal?: AbortSignal
      }
    | undefined,
) => runtime.value!.runPromise(effect, options)

declare module "vue" {
  export interface ComponentCustomProperties {
    $run: ReturnType<typeof makeRuntime>["runFork"]
  }
}
