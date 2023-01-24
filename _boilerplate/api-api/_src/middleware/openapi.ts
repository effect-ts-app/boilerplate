import * as Ex from "@effect-app/infra-adapters/express"
import { readTextFile } from "@effect-app/infra-adapters/fileUtil"
import redoc from "redoc-express"
import { serve as serve_, setup as setup_ } from "swagger-ui-express"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const serve: any = serve_
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
  > Ex.use(...serve.map(Ex.classic))
  > Ex.get(
    "/swagger",
    (req, res, next) =>
      readOpenApiDoc.flatMap(docs =>
        Effect(() => setup(docs, { swaggerOptions: { url: "./openapi.json" } })(req, res, next))
      )
  )
