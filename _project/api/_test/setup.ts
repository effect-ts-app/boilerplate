/* eslint-disable no-var */
import { api, ApiPortTag } from "@effect-app-boilerplate/api/api"
import { basicLayer } from "@effect-app-boilerplate/messages/basicRuntime"
import * as HttpClientNode from "@effect/platform-node/NodeHttpClient"
import { Config, Effect, Exit, Layer } from "effect"
import { layer as LiveApiConfig } from "effect-app/client/config"
import type { Runtime } from "effect/Runtime"
import * as Scope from "effect/Scope"

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
  .andThen(LiveApiConfig)
  .pipe(Layer.unwrapEffect)

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

  const appRuntime = <R, E, A>(layer: Layer.Layer<R, E, A>) =>
    Effect.gen(function*($) {
      const scope = yield* $(Scope.make())
      const env = yield* $(Layer.buildWithScope(layer, scope))
      const runtime = yield* $(
        Effect.runtime<A>().pipe(Effect.scoped, Effect.provide(env))
      )

      return {
        runtime,
        clean: Scope.close(scope, Exit.unit)
      }
    })

  const runtime = appRuntime(appLayer)
    .runPromise
    .catch((error: unknown) => {
      console.error(error)
      throw error
    })

  const cleanup = () =>
    Effect
      .promise(() => runtime)
      .andThen((_) => _.clean)
      .runPromise

  globalThis.cleanup = cleanup
  globalThis.runtime = (await runtime).runtime
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
