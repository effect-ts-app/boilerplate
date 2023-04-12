import type * as H from "@effect-app/core/http/http-client"
import * as HF from "@effect-app/core/http/http-client-fetch"
import { typedKeysOf } from "@effect-app/core/utils"
import type { ApiConfig } from "@effect-app/prelude/client/config"
import { Live as LiveApiConfig } from "@effect-app/prelude/client/config"
import { initializeSync } from "@effect-app/vue/runtime"
import fetch from "cross-fetch"
import { readFileSync } from "fs"

export function makeRuntime(config: ApiConfig) {
  const layers = HF.Client(fetch)
    > LiveApiConfig(Config.all({ apiUrl: Config.succeed(config.apiUrl), headers: Config.succeed(config.headers) }))
  const runtime = initializeSync(layers)

  return runtime
}

export function makeHeaders(namespace: string, role?: "manager" | "user") {
  const basicAuthCredentials = process.env["BASIC_AUTH_CREDENTIALS"]
  let cookie: string | undefined = undefined
  if (role) {
    const f = readFileSync("./storageState." + role + ".json", "utf-8")
    const p = JSON.parse(f) as { cookies: { name: string; value: string }[] }
    const cookies = p.cookies
    cookie = cookies.map((_) => `${_.name}=${_.value}`).join(";")
  }
  return <Record<string, string>> {
    ...basicAuthCredentials
      ? { "authorization": `Basic ${Buffer.from(basicAuthCredentials).toString("base64")}` }
      : undefined,
    ...cookie
      ? { "Cookie": cookie }
      : undefined,
    "x-store-id": namespace
  }
}

export function makeHeadersHashMap(namespace: string, role?: "manager" | "user") {
  const headers = makeHeaders(namespace, role)
  const keys = typedKeysOf(headers)
  return HashMap.make(...keys.map((_) => [_, headers[_]!] as const))
}

type Env = ApiConfig | H.HttpOps
export type SupportedEnv = Env // Effect.DefaultEnv |

export function toBase64(b: string) {
  if (typeof window != "undefined" && window.btoa) {
    return window.btoa(b)
  }
  return Buffer.from(b, "utf-8").toString("base64")
}
