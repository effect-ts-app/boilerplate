import { matchAll } from "./lib/routing.js"
import * as HelloWorldControllers from "./Usecases/HelloWorld.Controllers.js"

// Use this when using a file with individually exported handlers
// e.g export const GetHelloWorld = handle(HelloWorld.Get)(...)
export const helloWorld = Effect.struct(matchAll(HelloWorldControllers))

// Use this when exporting grouped handlers constructed through an Effect.
// e.g: `export const HelloWorldControllers = Effect.succeedWith(() => ({ Get: handle(HelloWorld.Get)(...) }))`
// export const helloWorldAlt = Effect.struct(HelloWorldControllers)
//   .flatMap(_ => Effect.struct(matchAllAlt(_)))
