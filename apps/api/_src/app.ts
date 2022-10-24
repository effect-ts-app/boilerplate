import * as Ex from "@effect-ts-app/infra/express"
import * as MW from "./middleware/index.js"
import * as R from "./routes.js"

const middleware = Ex.use(MW.urlEncoded({ extended: false }), MW.json())
  > MW.serverHealth
  > MW.openapiRoutes

const routes = Effect.struct(R)

export const app = middleware > routes
