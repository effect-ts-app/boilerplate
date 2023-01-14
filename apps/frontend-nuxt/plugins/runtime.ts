import { makeApiLayers, initializeSync } from "@effect-ts-app/boilerplate-vue"
import * as Http from "@effect-ts-app/core/http/http-client"

export const versionMatch = ref(true)
export const runtime = ref<ReturnType<typeof makeRuntime>>()

function makeRuntime(feVersion: string) {
  const middleware = Http.LiveMiddlewareStack([
    req =>
      <
        R,
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
        req<R, M, Req, Resp>(method, url, requestType, responseType, body)[
          "|>"
        ](
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

  return initializeSync(makeApiLayers()["|>"](Layer.merge(middleware)))
}

export default defineNuxtPlugin(_ => {
  const config = useRuntimeConfig()
  runtime.value = makeRuntime(config.public.feVersion)
})
