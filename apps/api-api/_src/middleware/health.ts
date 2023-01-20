import * as Ex from "@effect-app/infra-adapters/express"

export function serverHealth(version: string) {
  return Ex.get(
    "/.well-known/local/server-health",
    (_, res) => Effect(() => res.json({ version }))
  )
}
