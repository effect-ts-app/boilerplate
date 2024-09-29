/* eslint-disable @typescript-eslint/no-explicit-any */
import { makeApiLayers, initializeSync } from "@effect-app/vue"
import * as Layer from "effect/Layer"
import * as Runtime from "effect/Runtime"
import { Duration, Effect, Option } from "effect-app"
import { WebSdkLive } from "~/utils/observability"
import type { ApiConfig } from "effect-app/client"
import * as EffectRequest from "effect/Request"
import "@effect-app/core/builtin"
import { defineNuxtPlugin } from "#app"
import { ref } from "vue"
import { HttpClient } from "effect-app/http"

export const versionMatch = ref(true)

export const runtime = ref<ReturnType<typeof makeRuntime>>()

const RequestCacheLayers = Layer.mergeAll(
  Layer.setRequestCache(
    EffectRequest.makeCache({ capacity: 500, timeToLive: Duration.hours(8) }),
  ),
  Layer.setRequestCaching(true),
  Layer.setRequestBatching(true),
)

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
    RequestCacheLayers,
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

export default defineNuxtPlugin(_ => {
  const config = useRuntimeConfig()
  runtime.value = makeRuntime(
    config.public.feVersion,
    config.public.env !== "local-dev" || !config.public.telemetry,
  )
})
