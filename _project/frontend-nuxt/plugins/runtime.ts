import { makeApiLayers, initializeSync } from "@effect-app/vue"
import * as Config from "@effect/io/Config"
import * as Layer from "@effect/io/Layer"
import * as Runtime from "@effect/io/Runtime"
import * as Http from "@effect-app/core/http/http-client"
import { Option } from "@/composables/prelude"

export const versionMatch = ref(true)
export const runtime = ref<ReturnType<typeof makeRuntime>>()

function makeRuntime(feVersion: string) {
  const middleware = Http.LiveMiddlewareStack([
    req =>
      <
        M extends Http.Method,
        Req extends Http.RequestType,
        Resp extends Http.ResponseType
      >(
        method: M,
        url: string,
        requestType: Req,
        responseType: Resp,
        body?: Http.RequestBodyTypes[Req][M]
      ) =>
        req<M, Req, Resp>(method, url, requestType, responseType, body)["|>"](
          Effect.tap(r =>
            Effect.sync(() => {
              const remoteFeVersion = r.headers["x-fe-version"]
              if (remoteFeVersion) {
                versionMatch.value = feVersion === remoteFeVersion
              }
            })
          )
        ),
  ])

  const rt = initializeSync(
    Layer.merge(
      makeApiLayers(
        Config.succeed({ apiUrl: "/api/api", headers: Option.none })
      ),
      middleware
    )
  )
  return {
    ...rt,
    runFork: Runtime.runFork(rt.runtime),
    runSync: Runtime.runSync(rt.runtime),
    runPromise: Runtime.runPromise(rt.runtime),
    runCallback: Runtime.runCallback(rt.runtime),
  }
}

export default defineNuxtPlugin(_ => {
  const config = useRuntimeConfig()
  runtime.value = makeRuntime(config.public.feVersion)
})
