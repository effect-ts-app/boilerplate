// codegen:start {preset: barrel, include: ./*.controllers.ts, import: default}
import helloWorldControllers from "./HelloWorld.controllers.js"
import meControllers from "./Me.controllers.js"
import operationsControllers from "./Operations.controllers.js"

export { helloWorldControllers, meControllers, operationsControllers }
// codegen:end
