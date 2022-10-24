// TODO
// import "@effect-ts-app/core/fluent/polyfill/browser"

import type * as H from "@effect-ts-app/core/http/http-client"
import * as HF from "@effect-ts-app/core/http/http-client-fetch"
import type { ApiConfig } from "@effect-ts-app/boilerplate-client/lib/config"
import { LiveApiConfig } from "@effect-ts-app/boilerplate-client/lib/config"
import type { Has } from "@effect-ts-app/boilerplate-prelude"
import { Effect, Layer } from "@effect-ts-app/boilerplate-prelude"
import fetch from "cross-fetch"

export interface AppConfig {
  AUTH_DISABLED: boolean
}

export const accessAppConfig = Effect.access((r: AppConfig) => r)

export function makeEnv(config: ApiConfig, appConfig: AppConfig) {
  const layers = LiveApiConfig(config)
    [">+>"](HF.Client(fetch))
    ["+++"](Layer.fromRawFunction(() => appConfig))

  function runPromise<E, A>(eff: Effect<SupportedEnv, E, A>) {
    return eff.inject(layers).runPromise()
  }

  return {
    runPromise
  }
}

type Env = Has<ApiConfig> & Has<H.HttpOps> & { AUTH_DISABLED: boolean }
export type SupportedEnv = Effect.DefaultEnv & Env

export function toBase64(b: string) {
  if (typeof window != "undefined" && window.btoa) {
    return window.btoa(b)
  }
  return Buffer.from(b, "utf-8").toString("base64")
}

export type Party = "buyer" | "supplier"
export type Role = "admin" | "manager" | "contributor" | "member"

export const { runPromise } = makeEnv(
  {
    apiUrl: "/api/proxy",
    headers: {
      ...(Cypress.env("BASIC_AUTH_USER")
        ? {
          Authorization: toBase64(
            `${Cypress.env("BASIC_AUTH_USER")}:${Cypress.env("BASIC_AUTH_PASSWORD")}`
          )
        }
        : undefined)
    }
  },
  { AUTH_DISABLED: Cypress.env("AUTH_DISABLED") === "true" }
)
