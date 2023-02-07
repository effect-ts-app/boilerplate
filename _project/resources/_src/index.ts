import "./lib/operations.js"

export { ClientEvents } from "./Events.js"

// codegen:start {preset: barrel, include: ./*.ts, exclude: [./_global*.ts, ./index.ts, ./lib.ts, ./Views.ts, ./errors.ts], export: { as: 'PascalCase', postfix: 'Rsc' }}
export * as EventsRsc from "./Events.js"
export * as HelloWorldRsc from "./HelloWorld.js"
export * as MeRsc from "./Me.js"
export * as OperationsRsc from "./Operations.js"
// codegen:end
