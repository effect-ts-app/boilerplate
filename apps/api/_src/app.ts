import * as Ex from "@effect-ts/express"
import { match } from "./lib/routing.js"
import * as MW from "./middleware/index.js"
import * as R from "./routes.js"

const middleware = Ex.use(MW.urlEncoded({ extended: false }), MW.json())
  > MW.serverHealth
  > MW.openapiRoutes

// TODO
const routes = Effect.struct({
  GetHelloWorld: match(R.GetHelloWorld)
}).map(HelloWorld => ({
  HelloWorld
}))

export const app = middleware > routes
