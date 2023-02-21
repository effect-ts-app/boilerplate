import type * as H from "@effect-app/core/http/http-client"
import * as HF from "@effect-app/core/http/http-client-fetch"
import { typedKeysOf } from "@effect-app/core/utils"
import type { ApiConfig } from "@effect-app/prelude/client/config"
import { Live as LiveApiConfig } from "@effect-app/prelude/client/config"
import { initializeSync } from "@effect-app/vue/runtime"
import fetch from "cross-fetch"

export function makeRuntime(config: ApiConfig) {
  const layers = HF.Client(fetch)
    > LiveApiConfig(Config.struct({ apiUrl: Config.succeed(config.apiUrl), headers: Config.succeed(config.headers) }))
  const runtime = initializeSync(layers)

  return runtime
}

export function makeHeaders(namespace: string, userId?: string) {
  const basicAuthCredentials = process.env["BASIC_AUTH_CREDENTIALS"]
  return <Record<string, string>> {
    ...basicAuthCredentials
      ? { "authorization": `Basic ${Buffer.from(basicAuthCredentials).toString("base64")}` }
      : undefined,
    ...userId
      ? { "Cookie": `user-id=${userId};` } :
      undefined,
    "x-store-id": namespace
  }
}

export function makeHeadersHashMap(namespace: string, userId?: string) {
  const headers = makeHeaders(namespace, userId)
  const keys = typedKeysOf(headers)
  return HashMap.make(...keys.map(_ => [_, headers[_]!] as const))
}

type Env = ApiConfig | H.HttpOps
export type SupportedEnv = Env // Effect.DefaultEnv |

export function toBase64(b: string) {
  if (typeof window != "undefined" && window.btoa) {
    return window.btoa(b)
  }
  return Buffer.from(b, "utf-8").toString("base64")
}
