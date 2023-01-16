/* eslint-disable no-var */
import { api } from "@effect-ts-app/boilerplate-api-api/api"
import { ApiConfig, BaseConfig } from "@effect-ts-app/boilerplate-api-api/config"
import { Emailer, MemQueue } from "@effect-ts-app/boilerplate-api-api/services"
import { Live as LiveApiConfig } from "@effect-ts-app/boilerplate-prelude/client/config"
import * as HF from "@effect-ts-app/core/http/http-client-fetch"
import type { Runtime } from "@effect/io/Runtime"
import { fetch } from "cross-fetch"
import { afterAll, beforeAll } from "vitest"

import * as Logger from "@effect/io/Logger"
import * as Level from "@effect/io/Logger/Level"

const POOL_ID = process.env["VITEST_POOL_ID"]
const PORT = 40000 + parseInt(POOL_ID ?? "1")

const appConfig = BaseConfig.config.unsafeRunSync$
const apiConfig = ApiConfig.config.unsafeRunSync$
const cfg = { ...appConfig, ...apiConfig, port: PORT }

const appLayer = Logger.minimumLogLevel(Level.Debug)
  > Logger.logFmt
  > Emailer.Fake
  > MemQueue.Live
  > LiveApiConfig(
    Config.struct({
      apiUrl: Config.string("apiUrl").withDefault("http://127.0.0.1:" + PORT),
      headers: Config.string()
        .table("headers").optional
    })
  )
  > HF.Client(fetch)
  > api(cfg)

type LayerA<T> = T extends Layer<any, any, infer A> ? A : never

declare global {
  var runtime: Runtime<LayerA<typeof appLayer>>
  var cleanup: () => Promise<void>
}

beforeAll(async () => {
  if (globalThis.runtime) return
  console.log(`[${POOL_ID}] Creating runtime`)

  const appRuntime = <R, E, A>(layer: Layer<R, E, A>) =>
    Effect.gen(function*($) {
      const scope = yield* $(Scope.make())
      const env = yield* $(layer.buildWithScope(scope))
      const runtime = yield* $(
        Effect.runtime<A>().scoped.provideEnvironment(env)
      )

      return {
        runtime,
        clean: scope.close(Exit.unit)
      }
    })

  const runtime = appRuntime(appLayer)
    .unsafeRunPromise$
    .catch(error => {
      console.error(error)
      throw error
    })

  const cleanup = () =>
    Effect.promise(() => runtime)
      .flatMap(_ => _.clean)
      .unsafeRunPromise$

  globalThis.cleanup = cleanup
  globalThis.runtime = (await runtime).runtime
}, 30 * 1000)

afterAll(async () => {
  if (globalThis.cleanup) {
    console.log(`[${POOL_ID}] Destroying runtime`)
    await globalThis.cleanup().catch(error => {
      console.error(error)
      throw error
    })
  }
})
