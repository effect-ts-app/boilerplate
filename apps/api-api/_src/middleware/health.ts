import * as Ex from "@effect-ts-app/infra/express/index"

export function serverHealth(version: string) {
  return Ex.get(
    "/.well-known/local/server-health",
    (_, res) => Effect.sync(() => res.json({ version }))
  )
}
