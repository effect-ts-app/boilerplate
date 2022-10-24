import { matchAllAltAnonymous } from "./lib/routing.js"
import * as HelloWorldControllers from "./Usecases/HelloWorld.Controllers.js"

export const helloWorld = Effect.struct(HelloWorldControllers ).flatMap(_ => Effect.struct(matchAllAltAnonymous(_)))
