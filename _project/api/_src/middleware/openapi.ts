import * as Ex from "@effect-app/infra-adapters/express"
import { readTextFile } from "@effect-app/infra-adapters/fileUtil"
import type { NextHandleFunction } from "connect"
import redoc from "redoc-express"
import { serve as serve_, setup as setup_ } from "swagger-ui-express"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const serve: NonEmptyArray<NextHandleFunction> = serve_ as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const setup: any = setup_

const readOpenApiDoc = readTextFile("./openapi.json").orDie

export const openapiRoutes = Ex.get("/openapi.json", (_req, res) => readOpenApiDoc.map(js => res.send(js)))
  > Ex.get(
    "/docs",
    Ex.classic(
      redoc.default({
        title: "API Docs",
        specUrl: "./openapi.json"
      })
    )
  )
  > Ex.use(...serve.mapNonEmpty(Ex.classic))
  > Ex.get(
    "/swagger",
    (req, res, next) =>
      readOpenApiDoc.flatMap(docs =>
        Effect.sync(() => setup(docs, { swaggerOptions: { url: "./openapi.json" } })(req, res, next))
      )
  )
