import * as Ex from "@effect-ts-app/infra/express"
import * as cfg from "../config.js"

export const serverHealth = Ex.get(
  "/.well-known/local/server-health",
  (_, res) => Effect.sync(() => res.json({ version: cfg.API_VERSION }))
)
