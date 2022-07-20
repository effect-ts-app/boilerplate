import { clientFor } from "./clientFor.js"
import * as HelloWorld from "./HelloWorld/_index.js"

export { HelloWorld }
// codegen:start {preset: barrel, include: ./HelloWorld/*.ts, exclude: "./HelloWorld/_index.ts"}
export * from "./HelloWorld/Get.js"
// codegen:end

export const helloWorldClient = clientFor(HelloWorld)
