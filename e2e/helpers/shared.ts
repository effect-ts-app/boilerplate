// TODO
// import "@effect-app/core/fluent/polyfill/browser"

import type * as H from "@effect-app/core/http/http-client"
import * as HF from "@effect-app/core/http/http-client-fetch"
import type { ApiConfig } from "@effect-app/prelude/client/config"
import { Live as LiveApiConfig } from "@effect-app/prelude/client/config"
import { initializeSync } from "@effect-app/vue/runtime"
import fetch from "cross-fetch"
import { Config, Effect, HashMap, Layer, Opt, Tag } from "../prelude.js"

export interface AppConfig {
  AUTH_DISABLED: boolean
}

const AppConfig = Tag.Tag<AppConfig>()

export const accessAppConfig = Effect.environment<AppConfig>()

export function makeEnv(config: ApiConfig, appConfig: AppConfig) {
  const layers = LiveApiConfig(
    Config.struct({ apiUrl: Config.succeed(config.apiUrl), headers: Config.succeed(config.headers) })
  )["|>"](Layer.provideToAndMerge(HF.Client(fetch)))["|>"](Layer.provideToAndMerge(Layer.succeed(AppConfig)(appConfig)))
  const runtime = initializeSync(layers)

  return runtime
}

type Env = ApiConfig | H.HttpOps | { AUTH_DISABLED: boolean }
export type SupportedEnv = Env // Effect.DefaultEnv |

export function toBase64(b: string) {
  if (typeof window != "undefined" && window.btoa) {
    return window.btoa(b)
  }
  return Buffer.from(b, "utf-8").toString("base64")
}

export type Party = "buyer" | "supplier"
export type Role = "admin" | "manager" | "contributor" | "member"

function cypressEnv(entry: string) {
  return process.env["CYPRESS_" + entry]
}

export const { runtime } = makeEnv(
  {
    apiUrl: "/api/proxy",
    headers: (cypressEnv("BASIC_AUTH_USER")
      ? Opt.some(HashMap.make(
        [
          "Authorization",
          toBase64(
            `${cypressEnv("BASIC_AUTH_USER")}:${cypressEnv("BASIC_AUTH_PASSWORD")}`
          )
        ]
      ))
      : Opt.none)
  },
  { AUTH_DISABLED: cypressEnv("AUTH_DISABLED") === "true" }
)
