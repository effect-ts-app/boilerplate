import * as Ex from "@effect-app/infra-adapters/express"
import { readTextFile } from "@effect-app/infra-adapters/fileUtil"
import type { NextHandleFunction } from "connect"
import { Effect } from "effect-app"
import type { NonEmptyArray } from "effect/ReadonlyArray"
import redoc from "redoc-express"
import { serve as serve_, setup as setup_ } from "swagger-ui-express"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const serve: NonEmptyArray<NextHandleFunction> = serve_ as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const setup: any = setup_

export const openapiRoutes = (url: string) => {
  const readOpenApiDoc = readTextFile("./openapi.json")
    .pipe(
      Effect.map((_) => JSON.parse(_)),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Effect.map((_) => ({ ..._ as any, servers: [{ url }] })),
      Effect.orDie
    )

  return Effect.all([
    Ex.get("/openapi.json", (_req, res) => readOpenApiDoc.andThen((js) => res.send(js)).asUnit),
    Ex.get(
      "/docs",
      Ex.classic(
        redoc.default({
          title: "API Docs",
          specUrl: "./openapi.json",
          redocOptions: {}
        })
      )
    ),
    Ex.use(...serve.map(Ex.classic)),
    Ex.get(
      "/swagger",
      (req, res, next) =>
        readOpenApiDoc.andThen((docs) =>
          Effect.sync(() => setup(docs, { swaggerOptions: { url: "./openapi.json" } })(req, res, next))
        )
    )
  ])
}
