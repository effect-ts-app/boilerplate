/* eslint-disable no-var */
import * as HttpClientNode from "@effect/platform-node/NodeHttpClient"
import { api, ApiPortTag } from "api/api.js"
import { basicLayer, basicRuntime } from "api/lib/basicRuntime.js"
import { Config, Effect, Layer, ManagedRuntime } from "effect-app"
import { layer as LiveApiConfig } from "effect-app/client/config"
import type { Runtime } from "effect/Runtime"

const POOL_ID = process.env["VITEST_POOL_ID"]
const PORT = 40000 + parseInt(POOL_ID ?? "1")

const ApiLive = api
  .pipe(Layer.provide(Layer.succeed(ApiPortTag, { port: PORT })))

const ApiConfigLive = Config
  .all({
    apiUrl: Config.string("apiUrl").pipe(Config.withDefault("http://127.0.0.1:" + PORT)),
    headers: Config
      .hashMap(
        Config
          .string(),
        "headers"
      )
      .pipe(Config.option)
  })
  .pipe(Effect.andThen(LiveApiConfig), Layer.unwrapEffect)

const appLayer = ApiLive
  .pipe(Layer.provideMerge(
    Layer
      .mergeAll(
        basicLayer,
        ApiConfigLive,
        HttpClientNode.layer
      )
  ))

type LayerA<T> = T extends Layer.Layer<unknown, unknown, infer A> ? A : never
type AppLayer = LayerA<typeof appLayer>

declare global {
  var runtime: Runtime<AppLayer>
  var cleanup: () => Promise<void>
}

beforeAll(async () => {
  if (globalThis.runtime) return
  console.log(`[${POOL_ID}] Creating runtime`)

  const rt = ManagedRuntime
    .make(appLayer)

  globalThis.cleanup = () => basicRuntime.runPromise(rt.disposeEffect)
  globalThis.runtime = await rt
    .runtime()
    .catch((error: unknown) => {
      console.error(error)
      throw error
    })
}, 30 * 1000)

afterAll(async () => {
  if (globalThis.cleanup) {
    console.log(`[${POOL_ID}] Destroying runtime`)
    await globalThis.cleanup().catch((error) => {
      console.error(error)
      throw error
    })
  }
})
